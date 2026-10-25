import pool from "@/lib/db";
import { bad, serverError, unauthorized } from "@/lib/admin-guard";
import { kepsekOnly } from "@/lib/kepsek-guard";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const session = await kepsekOnly();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const action = body.action;

    const [dr] = await pool.query<RowDataPacket[]>("SELECT status FROM draft_sk WHERE id = 1");
    if (dr[0]?.status === "terbit") return bad("Hasil seleksi sudah dipublikasikan.", 409);

    const [pr] = await pool.query<RowDataPacket[]>("SELECT status FROM persetujuan_hasil WHERE id = 1");
    if (!pr[0]) return bad("Data persetujuan belum disiapkan. Jalankan database/kepsek.sql.", 500);
    if (pr[0].status !== "menunggu") {
      return bad(
        pr[0].status === "disetujui"
          ? "Hasil seleksi sudah disahkan."
          : "Usulan sedang dikembalikan ke panitia untuk revisi.",
        409
      );
    }

    if (action === "setuju") {
      const [c] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM seleksi WHERE hasil = 'diterima'"
      );
      if (!Number(c[0]?.n)) return bad("Belum ada peserta berstatus Diterima untuk disahkan.");

      await pool.execute(
        `UPDATE persetujuan_hasil
         SET status = 'disetujui', keputusan_oleh = ?, keputusan_at = NOW(), catatan_revisi = NULL
         WHERE id = 1`,
        [session.id]
      );
      await pool.execute(
        "INSERT INTO kepsek_log (jenis, judul, detail) VALUES ('persetujuan', ?, ?)",
        ["Hasil Seleksi Disahkan Kepala Sekolah", `${session.nama} menyetujui dan mengesahkan penetapan hasil seleksi Gelombang 1.`]
      );
      return Response.json({ message: "Hasil seleksi berhasil disahkan. Lanjutkan ke menu Pengumuman." });
    }

    if (action === "revisi") {
      const catatan = typeof body.catatan === "string" ? body.catatan.trim() : "";
      if (catatan.length < 5 || catatan.length > 255) {
        return bad("Catatan revisi harus 5 sampai 255 karakter.");
      }
      await pool.execute(
        `UPDATE persetujuan_hasil
         SET status = 'revisi', keputusan_oleh = ?, keputusan_at = NOW(), catatan_revisi = ?
         WHERE id = 1`,
        [session.id, catatan]
      );
      await pool.execute(
        "INSERT INTO kepsek_log (jenis, judul, detail) VALUES ('persetujuan', ?, ?)",
        ["Dikembalikan ke Panitia untuk Revisi", catatan]
      );
      return Response.json({ message: "Usulan dikembalikan ke panitia untuk direvisi." });
    }

    return bad("Aksi tidak valid.");
  } catch (e) {
    return serverError("Kepsek persetujuan", e);
  }
}