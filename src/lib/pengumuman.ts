import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { todayWib } from "./admin-config";
import { getBerkas } from "./berkas";
import { hitungWajib } from "./berkas-config";
import { formatTanggal } from "./biodata-schema";
import type { Post } from "./pengumuman-data";
import { getProgramKode } from "./program";

export type PengumumanRow = {
  id: number;
  judul: string;
  kategori: string;
  target: string;
  tanggal: string;
  status: "dipublikasi" | "draft";
  prioritas: boolean;
  isi: string;
  updatedAt: string;
};

export async function getPengumumanAdmin(): Promise<PengumumanRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, judul, kategori, target, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
            status, prioritas, isi, updated_at
     FROM pengumuman ORDER BY tanggal DESC, id DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    judul: r.judul,
    kategori: r.kategori,
    target: r.target,
    tanggal: r.tanggal,
    status: r.status,
    prioritas: Boolean(r.prioritas),
    isi: r.isi,
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

// Pengumuman yang tampil di portal siswa.
export async function getPengumumanPublik(userId: number): Promise<Post[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, judul, kategori, target, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, prioritas, isi
     FROM pengumuman
     WHERE status = 'dipublikasi' AND tanggal <= ?
     ORDER BY prioritas DESC, tanggal DESC, id DESC`,
    [todayWib()]
  );

  const [program, berkas] = await Promise.all([getProgramKode(userId), getBerkas(userId)]);
  const lengkap = hitungWajib(berkas).lengkap;

  const visible = rows.filter((r) => {
    const t = String(r.target);
    if (t.startsWith("Jurusan ")) return program !== null && t.slice(8).toUpperCase() === program;
    if (t === "Pendaftar Belum Lengkap") return !lengkap;
    return true;
  });

  return visible.map((r, i) => ({
    id: `db-${r.id}`,
    featured: i === 0 && Boolean(r.prioritas),
    kategori: r.kategori,
    tone: r.prioritas ? ("urgent" as const) : ("green" as const),
    tanggal: formatTanggal(r.tanggal),
    judul: r.judul,
    isi: r.isi,
    tags: [r.target],
  }));
}