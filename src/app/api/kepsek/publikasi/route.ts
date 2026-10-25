import pool from "@/lib/db";
import { bad, serverError, unauthorized } from "@/lib/admin-guard";
import { todayWib } from "@/lib/admin-config";
import { getKuota } from "@/lib/admin-data";
import { hitungPeringkat } from "@/lib/hasil-admin";
import { rentang, addDays, SURAT } from "@/lib/kepsek-config";
import { kepsekOnly } from "@/lib/kepsek-guard";
import { notifHasil, notifyBatch } from "@/lib/notifikasi";
import { kapasitasOf } from "@/lib/program-admin";
import type { RowDataPacket } from "mysql2";

export async function POST() {
  const session = await kepsekOnly();
  if (!session) return unauthorized();

  try {
    const [pr] = await pool.query<RowDataPacket[]>("SELECT status FROM persetujuan_hasil WHERE id = 1");
    if (pr[0]?.status !== "disetujui") {
      return bad("Sahkan hasil seleksi di menu Persetujuan Hasil terlebih dahulu.", 409);
    }

    const [dr] = await pool.query<RowDataPacket[]>(
      `SELECT judul, nomor_surat, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
              sambutan, status, pengumuman_id
       FROM draft_sk WHERE id = 1`
    );
    const d = dr[0];
    if (!d) return bad("Draf belum disiapkan. Jalankan database/kepsek.sql.", 500);
    if (d.status === "terbit") return bad("Surat ini sudah dipublikasikan.", 409);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.user_id, s.hasil, s.dipublikasi, pp.program
       FROM seleksi s LEFT JOIN pilihan_program pp ON pp.user_id = s.user_id
       WHERE s.hasil <> 'belum'`
    );
    if (rows.length === 0) return bad("Belum ada peserta yang berstatus Diterima, Cadangan, atau Belum Diterima.");

    await hitungPeringkat();

    const kuota = await getKuota();
    const kapasitas = new Map(kuota.map((k) => [k.kode as string, kapasitasOf(k.rombel)]));
    const diterimaPer = new Map<string, number>();
    let totalDiterima = 0;
    for (const r of rows) {
      if (r.hasil === "diterima") {
        totalDiterima++;
        if (r.program) diterimaPer.set(r.program, (diterimaPer.get(r.program) ?? 0) + 1);
      }
    }

    for (const r of rows) {
      await pool.execute(
        `UPDATE seleksi SET dipublikasi = 1, no_sk = ?, tanggal_yudisium = ?,
           batas_daftar_ulang = DATE_ADD(?, INTERVAL 6 DAY), kelas = 'A',
           kuota_terisi = ?, kuota_total = ?
         WHERE user_id = ?`,
        [
          d.nomor_surat,
          d.tanggal,
          d.tanggal,
          r.program ? (diterimaPer.get(r.program) ?? 0) : null,
          r.program ? (kapasitas.get(r.program) ?? null) : null,
          r.user_id,
        ]
      );
    }

    // Surat juga tampil di menu Pengumuman siswa.
    const tgl = d.tanggal < todayWib() ? d.tanggal : todayWib();
    const isi = `${d.sambutan}\n\nSebanyak ${totalDiterima} calon siswa dinyatakan DITERIMA. Daftar ulang dilaksanakan pada ${rentang(
      addDays(d.tanggal, 1),
      addDays(d.tanggal, 6)
    )} pukul ${SURAT.jamDaftarUlang} di ${SURAT.lokasi}.`.slice(0, 2000);

    let pengumumanId = d.pengumuman_id as number | null;
    if (pengumumanId) {
      await pool.execute(
        `UPDATE pengumuman SET judul = ?, kategori = 'Pengumuman Kelulusan', target = 'Semua Pendaftar',
           tanggal = ?, status = 'dipublikasi', prioritas = 1, isi = ? WHERE id = ?`,
        [d.judul, tgl, isi, pengumumanId]
      );
    } else {
      const [ins] = await pool.execute(
        `INSERT INTO pengumuman (judul, kategori, target, tanggal, status, prioritas, isi)
         VALUES (?, 'Pengumuman Kelulusan', 'Semua Pendaftar', ?, 'dipublikasi', 1, ?)`,
        [d.judul, tgl, isi]
      );
      pengumumanId = (ins as { insertId: number }).insertId;
    }

    await pool.execute(
      "UPDATE draft_sk SET status = 'terbit', pengumuman_id = ?, published_at = NOW() WHERE id = 1",
      [pengumumanId]
    );
    await pool.execute(
      "INSERT INTO kepsek_log (jenis, judul, detail) VALUES ('pengumuman', 'Publikasi Resmi', ?)",
      [`Surat dipublikasikan oleh ${session.nama}. ${rows.length} peserta kini dapat melihat hasilnya.`]
    );

    // Notifikasi hasil hanya untuk peserta yang hasilnya baru terbuka.
    await notifyBatch(
      rows
        .filter((r) => Number(r.dipublikasi) === 0)
        .map((r) => notifHasil(r.user_id as number, r.hasil as string))
    );

    return Response.json({
      message: `Pengumuman dipublikasikan. Hasil seleksi ${rows.length} peserta kini tampil di portal siswa.`,
    });
  } catch (e) {
    return serverError("Kepsek publikasi", e);
  }
}