import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type Soal = {
  id: number;
  kode: string;
  kategori: string;
  topik: string;
  tipe: string;
  kesulitan: "mudah" | "sedang" | "sulit";
  status: "aktif" | "revisi";
  teks: string;
  opsi: string[];
  kunci: string;
  bobot: number;
};

export async function getSoalAll(): Promise<Soal[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, kode, kategori, topik, tipe, kesulitan, status, teks,
            opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci, bobot
     FROM bank_soal
     ORDER BY kategori, CAST(SUBSTRING(kode, 5) AS UNSIGNED)`
  );
  return rows.map((r) => ({
    id: r.id,
    kode: r.kode,
    kategori: r.kategori,
    topik: r.topik,
    tipe: r.tipe,
    kesulitan: r.kesulitan,
    status: r.status,
    teks: r.teks,
    opsi: [r.opsi_a, r.opsi_b, r.opsi_c, r.opsi_d, r.opsi_e],
    kunci: r.kunci,
    bobot: Number(r.bobot),
  }));
}