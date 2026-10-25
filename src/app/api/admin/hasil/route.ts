import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { HASIL_LABEL, JALUR, type HasilStatus } from "@/lib/admin-config";
import { hitungPeringkat } from "@/lib/hasil-admin";
import type { RowDataPacket } from "mysql2";

const STATUS = Object.keys(HASIL_LABEL) as HasilStatus[];

// null = kosong, undefined = tidak valid
function nilai(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : undefined;
}

async function pesertaValid(ids: number[]) {
  if (ids.length === 0) return [] as number[];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id FROM users u
     JOIN biodata b ON b.user_id = u.id AND b.status = 'terkirim'
     WHERE u.role = 'calon_siswa' AND u.id IN (?)`,
    [ids]
  );
  return rows.map((r) => r.id as number);
}

export async function PATCH(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const body = await request.json();

    // Hitung ulang peringkat
    if (body.action === "hitung") {
      const n = await hitungPeringkat();
      return Response.json({ message: `Nilai akhir dan peringkat diperbarui untuk ${n} peserta.` });
    }

    // Ubah status banyak peserta sekaligus
    if (Array.isArray(body.userIds)) {
      const hasil = body.hasil as HasilStatus;
      if (!STATUS.includes(hasil)) return bad("Status tidak valid.");
      const ids = await pesertaValid(
        body.userIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      );
      if (ids.length === 0) return bad("Tidak ada peserta yang dipilih.");

      for (const id of ids) {
        await pool.execute(
          `INSERT INTO seleksi (user_id, hasil) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE hasil = VALUES(hasil)`,
          [id, hasil]
        );
      }
      return Response.json({ message: `Status ${ids.length} peserta berhasil diperbarui.` });
    }

    // Ubah satu peserta
    const userId = Number(body.userId);
    const cbt = nilai(body.nilaiCbt);
    const hasil = body.hasil as HasilStatus;
    const jalur = typeof body.jalur === "string" ? body.jalur : "";
    const catatan = typeof body.catatan === "string" ? body.catatan.trim().slice(0, 150) : "";

    if (!Number.isInteger(userId) || userId <= 0) return bad("Peserta tidak valid.");
    if (cbt === undefined) return bad("Nilai CBT harus berupa angka 0 sampai 100.");
    if (!STATUS.includes(hasil)) return bad("Status kelulusan tidak valid.");
    if (!(JALUR as readonly string[]).includes(jalur)) return bad("Jalur pendaftaran tidak valid.");
    if ((await pesertaValid([userId])).length === 0) return bad("Peserta tidak ditemukan.", 404);

    // Nilai akhir = nilai CBT.
    await pool.execute(
      `INSERT INTO seleksi (user_id, nilai_cbt, skor, hasil, jalur, catatan, tes_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nilai_cbt = VALUES(nilai_cbt), skor = VALUES(skor), hasil = VALUES(hasil),
         jalur = VALUES(jalur), catatan = VALUES(catatan), tes_status = VALUES(tes_status)`,
      [userId, cbt, cbt, hasil, jalur, catatan || null, cbt !== null ? "selesai" : "belum"]
    );

    return Response.json({ message: "Data seleksi peserta tersimpan." });
  } catch (e) {
    return serverError("Hasil update", e);
  }
}