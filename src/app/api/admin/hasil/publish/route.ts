import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { isValidDate } from "@/lib/admin-config";
import { getKuota } from "@/lib/admin-data";
import { hitungPeringkat } from "@/lib/hasil-admin";
import { kapasitasOf } from "@/lib/program-admin";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const b = await request.json();

    if (b.unpublish === true) {
      await pool.execute("UPDATE seleksi SET dipublikasi = 0");
      return Response.json({
        message: "Publikasi ditarik. Siswa kembali melihat status belum diumumkan.",
      });
    }

    const noSk = typeof b.noSk === "string" ? b.noSk.trim() : "";
    const yudisium = typeof b.tanggalYudisium === "string" ? b.tanggalYudisium : "";
    const batas = typeof b.batasDaftarUlang === "string" ? b.batasDaftarUlang : "";

    if (noSk.length < 5 || noSk.length > 60) return bad("Nomor SK harus 5 sampai 60 karakter.");
    if (!isValidDate(yudisium) || !isValidDate(batas)) return bad("Tanggal tidak valid.");
    if (batas < yudisium) return bad("Batas daftar ulang tidak boleh sebelum tanggal yudisium.");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.user_id, s.hasil, pp.program
       FROM seleksi s LEFT JOIN pilihan_program pp ON pp.user_id = s.user_id
       WHERE s.hasil <> 'belum'`
    );
    if (rows.length === 0) {
      return bad("Belum ada peserta yang berstatus Diterima, Cadangan, atau Belum Diterima.");
    }

    await hitungPeringkat();

    const kuota = await getKuota();
    const kapasitas = new Map(kuota.map((k) => [k.kode as string, kapasitasOf(k.rombel)]));
    const diterima = new Map<string, number>();
    for (const r of rows) {
      if (r.hasil === "diterima" && r.program) {
        diterima.set(r.program, (diterima.get(r.program) ?? 0) + 1);
      }
    }

    for (const r of rows) {
      await pool.execute(
        `UPDATE seleksi SET dipublikasi = 1, no_sk = ?, tanggal_yudisium = ?,
           batas_daftar_ulang = ?, kelas = 'A', kuota_terisi = ?, kuota_total = ?
         WHERE user_id = ?`,
        [
          noSk,
          yudisium,
          batas,
          r.program ? (diterima.get(r.program) ?? 0) : null,
          r.program ? (kapasitas.get(r.program) ?? null) : null,
          r.user_id,
        ]
      );
    }

    return Response.json({
      message: `Hasil seleksi ${rows.length} peserta berhasil dipublikasikan ke portal siswa.`,
    });
  } catch (e) {
    return serverError("Hasil publish", e);
  }
}