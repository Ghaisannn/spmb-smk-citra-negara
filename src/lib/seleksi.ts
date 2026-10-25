import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type Seleksi = {
  tesStatus: "belum" | "selesai";
  hasil: "belum" | "diterima" | "cadangan" | "tidak_diterima";
  skor: number | null;
  peringkat: number | null;
  totalPeserta: number | null;
  noSk: string;
  tanggalYudisium: string;
  batasDaftarUlang: string;
  kuotaTerisi: number | null;
  kuotaTotal: number | null;
  kelas: string;
};

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function getSeleksi(userId: number): Promise<Seleksi> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT tes_status, hasil, skor, peringkat, total_peserta, no_sk,
            DATE_FORMAT(tanggal_yudisium, '%Y-%m-%d') AS tanggal_yudisium,
            DATE_FORMAT(batas_daftar_ulang, '%Y-%m-%d') AS batas_daftar_ulang,
            kuota_terisi, kuota_total, kelas, dipublikasi
     FROM seleksi WHERE user_id = ?`,
    [userId]
  );
  const r = rows[0];

  // Hasil baru terlihat oleh siswa setelah admin mempublikasikannya.
  const open = Number(r?.dipublikasi ?? 0) === 1;
  const hasil =
    open && ["diterima", "cadangan", "tidak_diterima"].includes(r?.hasil) ? r.hasil : "belum";

  return {
    tesStatus: r?.tes_status === "selesai" ? "selesai" : "belum",
    hasil,
    skor: open ? num(r?.skor) : null,
    peringkat: open ? num(r?.peringkat) : null,
    totalPeserta: open ? num(r?.total_peserta) : null,
    noSk: open ? (r?.no_sk ?? "") : "",
    tanggalYudisium: open ? (r?.tanggal_yudisium ?? "") : "",
    batasDaftarUlang: open ? (r?.batas_daftar_ulang ?? "") : "",
    kuotaTerisi: open ? num(r?.kuota_terisi) : null,
    kuotaTotal: open ? num(r?.kuota_total) : null,
    kelas: r?.kelas ?? "A",
  };
}

// Selisih hari (WIB) dari hari ini ke tanggal target (yyyy-mm-dd).
export function sisaHari(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}