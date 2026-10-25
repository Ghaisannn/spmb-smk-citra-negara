import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { COOKIE_NAME, dashboardPath, type Role } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;
    const portal = body.portal === "staff" ? "staff" : "siswa";
    const selectedRole = body.role; // hanya dipakai untuk mencocokkan tab Admin/Kepsek

    if (!email || typeof password !== "string" || !password) {
      return Response.json(
        { message: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, nama, email, password, role, status FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    if (user.status !== "aktif") {
      return Response.json(
        {
          message:
            "Akun Anda sedang dinonaktifkan. Hubungi panitia SPMB untuk mengaktifkannya kembali.",
        },
        { status: 403 }
      );
    }

    const role = user.role as Role;

    // Pastikan akun masuk lewat pintu yang benar.
    if (portal === "siswa" && role !== "calon_siswa") {
      return Response.json(
        { message: "Akun ini bukan akun calon siswa. Gunakan Login Staff." },
        { status: 403 }
      );
    }

    if (portal === "staff") {
      if (role === "calon_siswa") {
        return Response.json(
          { message: "Akun ini tidak memiliki akses staff." },
          { status: 403 }
        );
      }
      if (selectedRole !== role) {
        return Response.json(
          {
            message: `Akun ini terdaftar sebagai ${
              role === "admin" ? "Admin" : "Kepsek"
            }. Pilih tombol yang sesuai.`,
          },
          { status: 403 }
        );
      }
    }

    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
      return Response.json(
        { message: "Konfigurasi sesi belum tersedia." },
        { status: 500 }
      );
    }

    await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    const token = await new SignJWT({ nama: user.nama, role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    (await cookies()).set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === "production",
    });

    return Response.json({
      message: "Login berhasil.",
      user: { id: user.id, nama: user.nama, role },
      redirectTo: dashboardPath(role),
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}