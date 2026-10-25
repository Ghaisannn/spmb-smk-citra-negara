import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { HasilStatus } from "./admin-config";

export type HasilRow = {
  id: number;
  nama: string;
  sekolah: string;
  program: string;
  hasil: HasilStatus;
  nilaiCbt: number | null;
  nilaiWwn: number | null;
  skor: number | null;
  jalur: string;
  catatan: string;
};

const FROM = `
  FROM users u
  JOIN biodata b ON b.user_id = u.id AND b.status = 'terkirim'
  LEFT JOIN pilihan_program pp ON pp.user_id = u.id
  LEFT JOIN seleksi s ON s.user_id = u.id
  WHERE u.role = 'calon_siswa'`;

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function listHasil(o: {
  q?: string;
  program?: string;
  jalur?: string;
  tab?: string;
  page: number;
  perPage: number;
}) {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (["diterima", "cadangan", "tidak_diterima"].includes(o.tab ?? "")) {
    where.push("COALESCE(s.hasil, 'belum') = ?");
    params.push(o.tab as string);
  }
  if (o.program) {
    where.push("pp.program = ?");
    params.push(o.program);
  }
  if (o.jalur) {
    where.push("COALESCE(s.jalur, 'Reguler') = ?");
    params.push(o.jalur);
  }

  const q = (o.q ?? "").trim().slice(0, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const c = ["u.nama LIKE ?", "b.nama_sekolah LIKE ?", "pp.program LIKE ?"];
    params.push(like, like, like);
    const m = /^(?:spmb-?2026-?)?(\d{1,6})$/i.exec(q);
    if (m) {
      c.push("u.id = ?");
      params.push(Number(m[1]));
    }
    where.push(`(${c.join(" OR ")})`);
  }

  const w = where.length ? ` AND ${where.join(" AND ")}` : "";
  const perPage = Math.min(Math.max(Math.floor(o.perPage), 1), 100);
  const page = Math.max(Math.floor(o.page), 1);

  const [cnt] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n ${FROM}${w}`, params);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nama, b.nama_sekolah, pp.program,
            COALESCE(s.hasil, 'belum') AS hasil,
            s.nilai_cbt, s.nilai_wawancara, s.skor,
            COALESCE(s.jalur, 'Reguler') AS jalur, s.catatan
     ${FROM}${w}
     ORDER BY u.id ASC LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
    params
  );

  const mapped: HasilRow[] = rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    sekolah: r.nama_sekolah ?? "",
    program: r.program ?? "",
    hasil: r.hasil,
    nilaiCbt: num(r.nilai_cbt),
    nilaiWwn: num(r.nilai_wawancara),
    skor: num(r.skor),
    jalur: r.jalur,
    catatan: r.catatan ?? "",
  }));

  return { rows: mapped, total: Number(cnt[0]?.n ?? 0), page, perPage };
}

export async function getHasilCounts() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
            SUM(COALESCE(s.hasil, 'belum') = 'diterima') AS diterima,
            SUM(COALESCE(s.hasil, 'belum') = 'cadangan') AS cadangan,
            SUM(COALESCE(s.hasil, 'belum') = 'tidak_diterima') AS tidak,
            SUM(COALESCE(s.dipublikasi, 0) = 1 AND COALESCE(s.hasil, 'belum') <> 'belum') AS pub
     ${FROM}`
  );
  const r = rows[0] ?? {};
  return {
    total: Number(r.total ?? 0),
    diterima: Number(r.diterima ?? 0),
    cadangan: Number(r.cadangan ?? 0),
    tidak: Number(r.tidak ?? 0),
    pub: Number(r.pub ?? 0),
  };
}

// Peringkat berdasarkan skor akhir (skor sama = peringkat sama).
export async function hitungPeringkat() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT user_id, skor FROM seleksi WHERE skor IS NOT NULL ORDER BY skor DESC, user_id ASC"
  );
  const total = rows.length;
  let rank = 0;
  let prev: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    const sk = Number(rows[i].skor);
    if (prev === null || sk !== prev) rank = i + 1;
    prev = sk;
    await pool.execute("UPDATE seleksi SET peringkat = ?, total_peserta = ? WHERE user_id = ?", [
      rank,
      total,
      rows[i].user_id,
    ]);
  }
  return total;
}