import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { notify } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";
import type { RowDataPacket } from "mysql2";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const status = body.status;

    if (!Number.isInteger(userId) || userId <= 0 || (status !== "lunas" && status !== "ditolak")) {
      return Response.json({ message: "Data tidak valid." }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT status FROM pembayaran WHERE user_id = ?",
      [userId]
    );
    if (!rows[0] || rows[0].status !== "menunggu_verifikasi") {
      return Response.json(
        { message: "Pembayaran ini tidak sedang menunggu verifikasi." },
        { status: 409 }
      );
    }

    if (status === "lunas") {
      await pool.execute(
        `UPDATE pembayaran SET status = 'lunas', catatan = NULL, verified_at = NOW()
         WHERE user_id = ?`,
        [userId]
      );
      await notify(userId, {
        jenis: "pembayaran",
        tone: "sukses",
        judul: "Pembayaran dinyatakan lunas",
        isi: "Terima kasih. Biaya pendaftaran Anda sudah diverifikasi oleh panitia.",
        href: NOTIF_HREF.pembayaran,
      });
    } else {
      const catatan =
        (typeof body.catatan === "string" ? body.catatan.trim() : "").slice(0, 255) ||
        "Bukti transfer tidak dapat diverifikasi.";
      await pool.execute(
        `UPDATE pembayaran SET status = 'ditolak', catatan = ?, verified_at = NULL
         WHERE user_id = ?`,
        [catatan, userId]
      );
      await notify(userId, {
        jenis: "pembayaran",
        tone: "bahaya",
        judul: "Bukti pembayaran ditolak",
        isi: `${catatan} Silakan unggah ulang bukti transfer yang benar.`,
        href: NOTIF_HREF.pembayaran,
      });
    }

    return Response.json({ message: "Status pembayaran diperbarui." });
  } catch (error) {
    console.error("Admin pembayaran error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}