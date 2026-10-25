import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { nomorRegistrasi } from "./biodata-schema";
import { notify } from "./notifikasi";
import { NOTIF_HREF } from "./notifikasi-config";

export type CbtStatus = "tertutup" | "dibuka" | "ditutup";

export type SesiCbt = {
  id: number;
  nama: string;
  gelombang: number;
  tanggal: string;
  mulai: string;
  selesai: string;
  lokasi: string;
  kuota: number;
  terisi: number;
  durasi: number;
  jumlahSoal: number;
  status: CbtStatus;
};

const SESI = `SELECT j.id, j.nama, j.gelombang,
  DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
  TIME_FORMAT(j.mulai, '%H:%i') AS mulai,
  TIME_FORMAT(j.selesai, '%H:%i') AS selesai,
  j.lokasi, j.kuota, j.durasi_menit, j.jumlah_soal, j.cbt_status,
  (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = j.id) AS terisi
  FROM jadwal_tes j`;

function mapSesi(r: RowDataPacket): SesiCbt {
  return {
    id: r.id,
    nama: r.nama,
    gelombang: Number(r.gelombang),
    tanggal: r.tanggal,
    mulai: r.mulai,
    selesai: r.selesai,
    lokasi: r.lokasi,
    kuota: Number(r.kuota),
    terisi: Number(r.terisi),
    durasi: Number(r.durasi_menit),
    jumlahSoal: Number(r.jumlah_soal),
    status: r.cbt_status,
  };
}

const parseIds = (s: unknown) =>
  String(s ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

/* ============ SESI ============ */

export async function getSesiById(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(`${SESI} WHERE j.id = ?`, [id]);
  return rows[0] ? mapSesi(rows[0]) : null;
}

// Sesi CBT yang relevan untuk seorang siswa.
export async function getSesiUntukSiswa(userId: number): Promise<SesiCbt | null> {
  const [own] = await pool.query<RowDataPacket[]>(
    `${SESI} JOIN cbt_percobaan p ON p.sesi_id = j.id WHERE p.user_id = ?`,
    [userId]
  );
  if (own[0]) return mapSesi(own[0]);

  const [rows] = await pool.query<RowDataPacket[]>(
    `${SESI} WHERE j.tipe = 'cbt' ORDER BY j.tanggal ASC, j.mulai ASC, j.id ASC`
  );
  const all = rows.map(mapSesi);
  return (
    all.find((s) => s.status === "dibuka" && s.terisi < s.kuota) ??
    all.find((s) => s.status === "dibuka") ??
    all.find((s) => s.status === "tertutup") ??
    all.filter((s) => s.status === "ditutup").pop() ??
    null
  );
}

export async function getWawancara() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${SESI} WHERE j.tipe = 'wawancara'
     ORDER BY (j.tanggal >= CURDATE()) DESC, ABS(DATEDIFF(j.tanggal, CURDATE())) ASC, j.mulai ASC
     LIMIT 1`
  );
  return rows[0] ? mapSesi(rows[0]) : null;
}

export async function wawancaraSelesai(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT nilai_wawancara FROM seleksi WHERE user_id = ?",
    [userId]
  );
  return rows[0]?.nilai_wawancara !== null && rows[0]?.nilai_wawancara !== undefined;
}

export async function countSoalAktif() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM bank_soal WHERE status = 'aktif'"
  );
  return Number(rows[0]?.n ?? 0);
}

/* ============ PERCOBAAN ============ */

export type Percobaan = {
  id: number;
  sesiId: number;
  status: "berjalan" | "selesai";
  soalIds: number[];
  total: number;
  terjawab: number;
  sisaDetik: number;
  benar: number | null;
  nilai: number | null;
  mulai: string;
  selesai: string;
};

export async function getPercobaan(userId: number, retry = true): Promise<Percobaan | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.sesi_id, p.status, p.soal_ids, p.benar, p.nilai,
            TIMESTAMPDIFF(SECOND, NOW(), p.batas_at) AS sisa,
            TIME_FORMAT(p.mulai_at, '%H:%i') AS mulai,
            TIME_FORMAT(p.selesai_at, '%H:%i') AS selesai,
            (SELECT COUNT(*) FROM cbt_jawaban j WHERE j.percobaan_id = p.id) AS terjawab
     FROM cbt_percobaan p WHERE p.user_id = ?`,
    [userId]
  );
  const r = rows[0];
  if (!r) return null;

  // Waktu habis: kumpulkan otomatis.
  if (r.status === "berjalan" && Number(r.sisa) <= 0 && retry) {
    await finalizePercobaan(r.id);
    return getPercobaan(userId, false);
  }

  const ids = parseIds(r.soal_ids);
  return {
    id: r.id,
    sesiId: r.sesi_id,
    status: r.status,
    soalIds: ids,
    total: ids.length,
    terjawab: Number(r.terjawab),
    sisaDetik: Math.max(Number(r.sisa), 0),
    benar: r.benar === null ? null : Number(r.benar),
    nilai: r.nilai === null ? null : Number(r.nilai),
    mulai: r.mulai ?? "",
    selesai: r.selesai ?? "",
  };
}

// Percobaan yang masih boleh menerima jawaban (toleransi 5 detik).
export async function getPercobaanAktif(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, soal_ids FROM cbt_percobaan
     WHERE user_id = ? AND status = 'berjalan' AND batas_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)`,
    [userId]
  );
  return rows[0] ? { id: rows[0].id as number, soalIds: parseIds(rows[0].soal_ids) } : null;
}

export async function simpanJawaban(percobaanId: number, soalId: number, jawaban: string | null) {
  if (jawaban === null) {
    await pool.execute("DELETE FROM cbt_jawaban WHERE percobaan_id = ? AND soal_id = ?", [
      percobaanId,
      soalId,
    ]);
  } else {
    await pool.execute(
      `INSERT INTO cbt_jawaban (percobaan_id, soal_id, jawaban) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE jawaban = VALUES(jawaban)`,
      [percobaanId, soalId, jawaban]
    );
  }
}

export type SoalUjian = {
  id: number;
  topik: string;
  teks: string;
  opsi: string[];
  jawaban: string | null;
};

// Tidak pernah mengirim kunci jawaban.
export async function getSoalUjian(p: Percobaan): Promise<SoalUjian[]> {
  if (p.soalIds.length === 0) return [];
  const [soal] = await pool.query<RowDataPacket[]>(
    `SELECT id, topik, teks, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e
     FROM bank_soal WHERE id IN (?)`,
    [p.soalIds]
  );
  const [jw] = await pool.query<RowDataPacket[]>(
    "SELECT soal_id, jawaban FROM cbt_jawaban WHERE percobaan_id = ?",
    [p.id]
  );
  const byId = new Map(soal.map((s) => [s.id as number, s]));
  const ans = new Map(jw.map((j) => [j.soal_id as number, j.jawaban as string]));

  return p.soalIds
    .filter((id) => byId.has(id))
    .map((id) => {
      const s = byId.get(id)!;
      return {
        id,
        topik: s.topik,
        teks: s.teks,
        opsi: [s.opsi_a, s.opsi_b, s.opsi_c, s.opsi_d, s.opsi_e],
        jawaban: ans.get(id) ?? null,
      };
    });
}

type Hasil = { ok: true } | { ok: false; message: string; status: number };

export async function mulaiPercobaan(userId: number): Promise<Hasil> {
  const ada = await getPercobaan(userId);
  if (ada) {
    return ada.status === "berjalan"
      ? { ok: true }
      : {
          ok: false,
          status: 409,
          message: "Anda sudah menyelesaikan ujian CBT. Ujian hanya dapat dikerjakan satu kali.",
        };
  }

  const sesi = await getSesiUntukSiswa(userId);
  if (!sesi || sesi.status !== "dibuka") {
    return { ok: false, status: 409, message: "Sesi ujian CBT belum dibuka oleh panitia." };
  }
  if (sesi.terisi >= sesi.kuota) {
    return { ok: false, status: 409, message: "Kuota peserta sesi ini sudah penuh. Hubungi panitia." };
  }

  const [soal] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM bank_soal WHERE status = 'aktif' ORDER BY RAND() LIMIT ?",
    [sesi.jumlahSoal]
  );
  if (soal.length < sesi.jumlahSoal) {
    return { ok: false, status: 409, message: "Butir soal belum siap. Hubungi panitia." };
  }

  try {
    await pool.execute(
      `INSERT INTO cbt_percobaan (user_id, sesi_id, soal_ids, mulai_at, batas_at)
       VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [userId, sesi.id, soal.map((r) => r.id).join(","), sesi.durasi]
    );
  } catch (e) {
    if ((e as { code?: string }).code !== "ER_DUP_ENTRY") throw e;
  }
  return { ok: true };
}

/* ============ PENILAIAN ============ */

export async function finalizePercobaan(id: number) {
  const [pr] = await pool.query<RowDataPacket[]>(
    "SELECT user_id, soal_ids, status FROM cbt_percobaan WHERE id = ?",
    [id]
  );
  const p = pr[0];
  if (!p || p.status !== "berjalan") return;

  const ids = parseIds(p.soal_ids);
  let benar = 0;
  let nilai = 0;
  let terjawab = 0;

  if (ids.length > 0) {
    const [soal] = await pool.query<RowDataPacket[]>(
      "SELECT id, kunci, bobot FROM bank_soal WHERE id IN (?)",
      [ids]
    );
    const [jw] = await pool.query<RowDataPacket[]>(
      "SELECT soal_id, jawaban FROM cbt_jawaban WHERE percobaan_id = ?",
      [id]
    );
    terjawab = jw.length;
    const ans = new Map(jw.map((r) => [r.soal_id as number, r.jawaban as string]));
    let total = 0;
    let got = 0;
    for (const s of soal) {
      const b = Number(s.bobot);
      total += b;
      if (ans.get(s.id as number) === s.kunci) {
        got += b;
        benar++;
      }
    }
    nilai = total > 0 ? Math.round((got / total) * 10000) / 100 : 0;
  }

  const [res] = await pool.execute<ResultSetHeader>(
    `UPDATE cbt_percobaan SET status = 'selesai', selesai_at = NOW(), benar = ?, nilai = ?
     WHERE id = ? AND status = 'berjalan'`,
    [benar, nilai, id]
  );
  if (res.affectedRows === 0) return;

    await pool.execute(
    `INSERT INTO seleksi (user_id, nilai_cbt, skor, tes_status) VALUES (?, ?, ?, 'selesai')
     ON DUPLICATE KEY UPDATE
       nilai_cbt = VALUES(nilai_cbt),
       skor = VALUES(skor),
       tes_status = 'selesai'`,
    [p.user_id, nilai, nilai]
  );

  await notify(p.user_id as number, {
    jenis: "cbt",
    tone: "sukses",
    judul: "Ujian CBT selesai dikerjakan",
    isi: `Jawaban Anda sudah dikumpulkan (${terjawab} dari ${ids.length} soal terjawab). Nilai akan diumumkan bersama hasil seleksi.`,
    href: NOTIF_HREF.jadwal,
  });
}

export async function selesaikanPercobaan(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM cbt_percobaan WHERE user_id = ? AND status = 'berjalan'",
    [userId]
  );
  if (rows[0]) await finalizePercobaan(rows[0].id);
}

export async function finalizeExpired(sesiId?: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM cbt_percobaan WHERE status = 'berjalan' AND batas_at <= NOW()
     ${sesiId ? "AND sesi_id = ?" : ""}`,
    sesiId ? [sesiId] : []
  );
  for (const r of rows) await finalizePercobaan(r.id);
}

/* ============ ADMIN ============ */

export type PesertaCbt = {
  userId: number;
  nama: string;
  noReg: string;
  status: "berjalan" | "selesai";
  terjawab: number;
  total: number;
  nilai: number | null;
  mulai: string;
  selesai: string;
};

export async function getPesertaSesi(sesiId: number): Promise<PesertaCbt[]> {
  await finalizeExpired(sesiId);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.user_id, u.nama, p.status, p.nilai,
            TIME_FORMAT(p.mulai_at, '%H:%i') AS mulai,
            TIME_FORMAT(p.selesai_at, '%H:%i') AS selesai,
            (LENGTH(p.soal_ids) - LENGTH(REPLACE(p.soal_ids, ',', '')) + 1) AS total,
            (SELECT COUNT(*) FROM cbt_jawaban j WHERE j.percobaan_id = p.id) AS terjawab
     FROM cbt_percobaan p JOIN users u ON u.id = p.user_id
     WHERE p.sesi_id = ? ORDER BY p.status ASC, p.mulai_at ASC`,
    [sesiId]
  );
  return rows.map((r) => ({
    userId: r.user_id,
    nama: r.nama,
    noReg: nomorRegistrasi(r.user_id),
    status: r.status,
    terjawab: Number(r.terjawab),
    total: Number(r.total),
    nilai: r.nilai === null ? null : Number(r.nilai),
    mulai: r.mulai ?? "",
    selesai: r.selesai ?? "",
  }));
}

// Menutup sesi = mengumpulkan semua jawaban yang masih berjalan.
export async function tutupSesi(sesiId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM cbt_percobaan WHERE sesi_id = ? AND status = 'berjalan'",
    [sesiId]
  );
  for (const r of rows) await finalizePercobaan(r.id);
  await pool.execute("UPDATE jadwal_tes SET cbt_status = 'ditutup' WHERE id = ?", [sesiId]);
  return rows.length;
}

export async function resetPercobaan(userId: number) {
  await pool.execute("DELETE FROM cbt_percobaan WHERE user_id = ?", [userId]);
  await pool.execute(
    "UPDATE seleksi SET nilai_cbt = NULL, tes_status = 'belum', skor = NULL WHERE user_id = ?",
    [userId]
  );
  await notify(userId, {
    jenis: "cbt",
    tone: "tindakan",
    judul: "Percobaan ujian CBT direset",
    isi: "Panitia mereset percobaan Anda. Anda dapat mengerjakan ujian kembali saat sesi dibuka.",
    href: NOTIF_HREF.jadwal,
  });
}