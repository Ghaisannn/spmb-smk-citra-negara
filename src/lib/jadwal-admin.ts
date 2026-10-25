import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { finalizeExpired, type CbtStatus } from "./cbt";

export type StatusJadwal = "selesai" | "berlangsung" | "siap" | "terjadwal";
export type TipeJadwal = "cbt" | "wawancara" | "lainnya";

export type JadwalRow = {
  id: number;
  nama: string;
  gelombang: number;
  tanggal: string;
  mulai: string;
  selesai: string;
  lokasi: string;
  kuota: number;
  terisi: number;
  pengawas: string;
  tipe: TipeJadwal;
  cbtStatus: CbtStatus;
  durasi: number;
  jumlahSoal: number;
  nJalan: number;
  nSelesai: number;
  status: StatusJadwal;
  hariIni: boolean;
  sesi: string;
};

// "YYYY-MM-DD HH:MM" dalam WIB
function nowWib() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function hitung(
  r: { tipe: string; cbt_status: string; tanggal: string; mulai: string; selesai: string },
  now: string
): { status: StatusJadwal; hariIni: boolean } {
  const today = now.slice(0, 10);
  const hariIni = r.tanggal === today;
  const diff = (Date.parse(r.tanggal) - Date.parse(today)) / 86400000;

  // Sesi CBT: status ditentukan oleh panitia (buka / tutup), bukan jam.
  if (r.tipe === "cbt") {
    if (r.cbt_status === "dibuka") return { status: "berlangsung", hariIni };
    if (r.cbt_status === "ditutup") return { status: "selesai", hariIni };
    return { status: diff <= 3 ? "siap" : "terjadwal", hariIni };
  }

  if (now >= `${r.tanggal} ${r.selesai}`) return { status: "selesai", hariIni };
  if (now >= `${r.tanggal} ${r.mulai}`) return { status: "berlangsung", hariIni };
  return { status: diff <= 3 ? "siap" : "terjadwal", hariIni };
}

export async function getJadwalList(): Promise<JadwalRow[]> {
  await finalizeExpired();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT j.id, j.nama, j.gelombang,
            DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
            TIME_FORMAT(j.mulai, '%H:%i') AS mulai,
            TIME_FORMAT(j.selesai, '%H:%i') AS selesai,
            j.lokasi, j.kuota, j.terisi AS terisi_manual, j.pengawas,
            j.tipe, j.cbt_status, j.durasi_menit, j.jumlah_soal,
            (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = j.id) AS n_total,
            (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = j.id AND c.status = 'berjalan') AS n_jalan,
            (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = j.id AND c.status = 'selesai') AS n_selesai
     FROM jadwal_tes j ORDER BY j.tanggal ASC, j.mulai ASC, j.id ASC`
  );
  const now = nowWib();

  return rows.map((r) => {
    const jam = Number(String(r.mulai).slice(0, 2));
    return {
      id: r.id,
      nama: r.nama,
      gelombang: Number(r.gelombang),
      tanggal: r.tanggal,
      mulai: r.mulai,
      selesai: r.selesai,
      lokasi: r.lokasi,
      kuota: Number(r.kuota),
      terisi: r.tipe === "cbt" ? Number(r.n_total) : Number(r.terisi_manual),
      pengawas: r.pengawas ?? "",
      tipe: r.tipe,
      cbtStatus: r.cbt_status,
      durasi: Number(r.durasi_menit),
      jumlahSoal: Number(r.jumlah_soal),
      nJalan: Number(r.n_jalan),
      nSelesai: Number(r.n_selesai),
      sesi: jam < 11 ? "Sesi Pagi" : jam < 15 ? "Sesi Siang" : "Sesi Sore",
      ...hitung(r as never, now),
    };
  });
}

export async function countPeserta() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM biodata b JOIN users u ON u.id = b.user_id
     WHERE b.status = 'terkirim' AND u.role = 'calon_siswa'`
  );
  return Number(rows[0]?.n ?? 0);
}