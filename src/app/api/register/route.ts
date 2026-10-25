import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { notify } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const nik = typeof body.nik === "string" ? body.nik.trim() : "";
    const whatsapp =
      typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
    const password = body.password;

    if (!nama || !email || !nik || !whatsapp || typeof password !== "string") {
      return Response.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    if (nama.length > 100 || email.length > 150) {
      return Response.json(
        { message: "Nama atau email terlalu panjang." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (!/^\d{16}$/.test(nik)) {
      return Response.json(
        { message: "NIK harus 16 digit angka." },
        { status: 400 }
      );
    }

    if (!/^(08|628)\d{8,12}$/.test(whatsapp)) {
      return Response.json(
        { message: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return Response.json(
        { message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id, email, nik FROM users WHERE email = ? OR nik = ?",
      [email, nik]
    );

    if (existing.length > 0) {
      const emailTaken = existing.some((u) => u.email === email);
      return Response.json(
        {
          message: emailTaken
            ? "Email sudah terdaftar."
            : "NIK sudah terdaftar.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Role ditentukan server, bukan dari form.
    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (nama, email, password, role, nik, whatsapp)
       VALUES (?, ?, ?, 'calon_siswa', ?, ?)`,
      [nama, email, hashedPassword, nik, whatsapp]
    );

    await notify(res.insertId, {
      jenis: "akun",
      tone: "sukses",
      judul: "Selamat datang di Portal SPMB",
      isi: "Akun Anda sudah aktif. Mulai dengan melengkapi biodata pendaftaran (3 tahap), lalu pilih program keahlian.",
      href: NOTIF_HREF.biodata,
    });

    return Response.json(
      { message: "Registrasi calon siswa berhasil." },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Email atau NIK sudah terdaftar." },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}