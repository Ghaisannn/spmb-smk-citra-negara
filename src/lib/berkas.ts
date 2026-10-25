import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { KODE_BERKAS, type BerkasMap, type StatusBerkas } from "./berkas-config";

export async function getBerkas(userId: number): Promise<BerkasMap> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT jenis, nama_asli, ukuran, status, catatan, uploaded_at
     FROM berkas WHERE user_id = ?`,
    [userId]
  );

  const map: BerkasMap = {};
  for (const r of rows) {
    if (!KODE_BERKAS.includes(r.jenis)) continue;
    map[r.jenis] = {
      jenis: r.jenis,
      namaAsli: r.nama_asli,
      ukuran: Number(r.ukuran),
      status: r.status as StatusBerkas,
      catatan: r.catatan ?? "",
      uploadedAt: new Date(r.uploaded_at).toISOString(),
    };
  }
  return map;
}