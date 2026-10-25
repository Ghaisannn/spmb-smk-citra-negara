import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { notify } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";
import {
  BANK_PENGIRIM,
  BIAYA_PENDAFTARAN,
  MAX_BUKTI_MB,
} from "@/lib/pembayaran-config";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

const DIR = path.join(process.cwd(), "storage", "bukti");
const MAX_BYTES = MAX_BUKTI_MB * 1024 * 1024;

// Cek isi file yang sebenarnya, bukan hanya ekstensi.
function detectType(buf: Buffer): "jpg" | "png" | "pdf" | null {
  if (buf.length < 8) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "png";
  }
  if (buf.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  return null;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const state = await getBiodataState(session.id);
    if (!state || state.status !== "terkirim") {
      return Response.json(
        { message: "Kirim formulir biodata terlebih dahulu." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT status, bukti_file FROM pembayaran WHERE user_id = ?",
      [session.id]
    );
    const existing = rows[0];

    if (
      existing &&
      (existing.status === "menunggu_verifikasi" || existing.status === "lunas")
    ) {
      return Response.json(
        { message: "Pembayaran Anda sedang diproses atau sudah lunas." },
        { status: 409 }
      );
    }

    const form = await request.formData();
    const bank = String(form.get("bank") ?? "");
    const nama = String(form.get("nama") ?? "").trim();
    const file = form.get("bukti");

    if (!(BANK_PENGIRIM as readonly string[]).includes(bank)) {
      return Response.json({ message: "Pilih bank pengirim." }, { status: 400 });
    }
    if (nama.length < 3 || nama.length > 100) {
      return Response.json(
        { message: "Nama pengirim harus 3 sampai 100 karakter." },
        { status: 400 }
      );
    }
    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { message: "Bukti transfer wajib diunggah." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { message: `Ukuran file maksimal ${MAX_BUKTI_MB} MB.` },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = detectType(buf);
    if (!ext) {
      return Response.json(
        { message: "Format file harus JPG, PNG, atau PDF." },
        { status: 400 }
      );
    }

    await mkdir(DIR, { recursive: true });
    const filename = `user-${session.id}-${Date.now()}.${ext}`;
    await writeFile(path.join(DIR, filename), buf);

    await pool.execute(
      `INSERT INTO pembayaran
         (user_id, jumlah, bank_pengirim, nama_pengirim, bukti_file,
          status, catatan, paid_at)
       VALUES (?, ?, ?, ?, ?, 'menunggu_verifikasi', NULL, NOW())
       ON DUPLICATE KEY UPDATE
         jumlah = VALUES(jumlah),
         bank_pengirim = VALUES(bank_pengirim),
         nama_pengirim = VALUES(nama_pengirim),
         bukti_file = VALUES(bukti_file),
         status = 'menunggu_verifikasi',
         catatan = NULL,
         paid_at = NOW(),
         verified_at = NULL`,
      [session.id, BIAYA_PENDAFTARAN, bank, nama, filename]
    );

    // Hapus bukti lama (kalau ini upload ulang setelah ditolak).
    if (existing?.bukti_file) {
      await unlink(path.join(DIR, path.basename(existing.bukti_file))).catch(
        () => {}
      );
    }

    await notify(session.id, {
      jenis: "pembayaran",
      tone: "info",
      judul: "Bukti pembayaran diterima",
      isi: "Panitia akan memeriksa bukti transfer Anda dalam 1x24 jam kerja. Hasilnya muncul di notifikasi ini.",
      href: NOTIF_HREF.pembayaran,
    });

    return Response.json({ message: "Bukti pembayaran berhasil dikirim." });
  } catch (error) {
    console.error("Pembayaran error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}