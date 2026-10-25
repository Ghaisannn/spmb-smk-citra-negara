import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { getBerkas } from "./berkas";
import { JENIS_BERKAS } from "./berkas-config";
import { getBiodataState } from "./biodata";
import { getPembayaran } from "./pembayaran";
import { getProgramKode } from "./program";
import { PROGRAM_KODE, type ProgramKode } from "./program-data";
import { PROGRAM_ADMIN } from "./program-admin";
import type { StatusPendaftar } from "./admin-format";

const WAJIB = JENIS_BERKAS.filter((j) => j.wajib)
  .map((j) => `'${j.kode}'`)
  .join(",");
const N_WAJIB = JENIS_BERKAS.filter((j) => j.wajib).length;

const BASE = `
  SELECT u.id, u.nama, u.nik, u.created_at,
         b.status AS bio_status, b.nama_sekolah, b.nisn,
         pp.program,
         (SELECT COUNT(*) FROM berkas k WHERE k.user_id = u.id
            AND k.jenis IN (${WAJIB}) AND k.status = 'diterima') AS n_ok,
         (SELECT COUNT(*) FROM berkas k WHERE k.user_id = u.id
            AND k.status = 'menunggu') AS n_wait,
         (SELECT COUNT(*) FROM berkas k WHERE k.user_id = u.id
            AND k.status = 'perlu_perbaikan') AS n_fix,
         (SELECT p.status FROM pembayaran p WHERE p.user_id = u.id) AS pay_status
  FROM users u
  LEFT JOIN biodata b ON b.user_id = u.id
  LEFT JOIN pilihan_program pp ON pp.user_id = u.id
  WHERE u.role = 'calon_siswa'`;

const LIST = `
  SELECT t.*, CASE
    WHEN t.bio_status IS NULL OR t.bio_status <> 'terkirim' THEN 'draft'
    WHEN t.n_ok >= ${N_WAJIB} THEN 'terverifikasi'
    WHEN t.n_wait > 0 THEN 'menunggu'
    WHEN t.n_fix > 0 THEN 'revisi'
    ELSE 'biodata' END AS status
  FROM (${BASE}) t`;

async function count(sql: string, params: (string | number)[] = []) {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return Number(rows[0]?.n ?? 0);
}

/* ============ DASHBOARD ============ */

export async function getDashboardStats() {
  const [total, biodata, berkasMenunggu, diterima, bayarMenunggu, belumBerkas] =
    await Promise.all([
      count("SELECT COUNT(*) AS n FROM users WHERE role = 'calon_siswa'"),
      count(
        `SELECT COUNT(*) AS n FROM biodata b JOIN users u ON u.id = b.user_id
         WHERE b.status = 'terkirim' AND u.role = 'calon_siswa'`
      ),
      count("SELECT COUNT(*) AS n FROM berkas WHERE status = 'menunggu'"),
      count("SELECT COUNT(*) AS n FROM seleksi WHERE hasil = 'diterima'"),
      count("SELECT COUNT(*) AS n FROM pembayaran WHERE status = 'menunggu_verifikasi'"),
      count(`SELECT COUNT(*) AS n FROM (${LIST}) x WHERE x.status = 'biodata'`),
    ]);
  return { total, biodata, berkasMenunggu, diterima, bayarMenunggu, belumBerkas };
}

export type Aktivitas = {
  kind: "baru" | "unggah" | "verifikasi";
  userId: number;
  nama: string;
  at: string;
  sekolah?: string;
  program?: string;
  jenis?: string;
};

export async function getAktivitas(): Promise<Aktivitas[]> {
  const [baru, unggah, verif] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nama, u.created_at AS at, b.nama_sekolah, pp.program
       FROM users u
       LEFT JOIN biodata b ON b.user_id = u.id
       LEFT JOIN pilihan_program pp ON pp.user_id = u.id
       WHERE u.role = 'calon_siswa'
       ORDER BY u.created_at DESC LIMIT 5`
    ),
    pool.query<RowDataPacket[]>(
      `SELECT k.user_id AS id, u.nama, k.jenis, k.uploaded_at AS at
       FROM berkas k JOIN users u ON u.id = k.user_id
       ORDER BY k.uploaded_at DESC LIMIT 5`
    ),
    pool.query<RowDataPacket[]>(
      `SELECT k.user_id AS id, u.nama, k.jenis, k.verified_at AS at
       FROM berkas k JOIN users u ON u.id = k.user_id
       WHERE k.status = 'diterima' AND k.verified_at IS NOT NULL
       ORDER BY k.verified_at DESC LIMIT 5`
    ),
  ]);

  const out: Aktivitas[] = [
    ...baru[0].map((r) => ({
      kind: "baru" as const,
      userId: r.id,
      nama: r.nama,
      at: new Date(r.at).toISOString(),
      sekolah: r.nama_sekolah ?? undefined,
      program: r.program ?? undefined,
    })),
    ...unggah[0].map((r) => ({
      kind: "unggah" as const,
      userId: r.id,
      nama: r.nama,
      at: new Date(r.at).toISOString(),
      jenis: r.jenis,
    })),
    ...verif[0].map((r) => ({
      kind: "verifikasi" as const,
      userId: r.id,
      nama: r.nama,
      at: new Date(r.at).toISOString(),
      jenis: r.jenis,
    })),
  ];

  return out.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);
}

/* ============ DAFTAR PENDAFTAR ============ */

export type Filter =
  | "semua"
  | "biodata"
  | "menunggu"
  | "terverifikasi"
  | "berkas_menunggu"
  | "bayar_menunggu";

export type PendaftarRow = {
  id: number;
  nama: string;
  nik: string;
  createdAt: string;
  namaSekolah: string;
  nisn: string;
  program: string;
  status: StatusPendaftar;
  nOk: number;
  nWait: number;
  nFix: number;
  payStatus: string;
};

export async function listPendaftar(o: {
  q?: string;
  filter?: Filter;
  program?: string;
  page?: number;
  perPage?: number;
  all?: boolean;
  order?: "baru" | "lama";
}) {
  const where: string[] = [];
  const params: (string | number)[] = [];

  switch (o.filter) {
    case "biodata":
      where.push("x.status <> 'draft'");
      break;
    case "menunggu":
      where.push("x.status = 'menunggu'");
      break;
    case "terverifikasi":
      where.push("x.status = 'terverifikasi'");
      break;
    case "berkas_menunggu":
      where.push("x.n_wait > 0 AND x.status <> 'draft'");
      break;
    case "bayar_menunggu":
      where.push("x.pay_status = 'menunggu_verifikasi'");
      break;
  }

  if (o.program && PROGRAM_KODE.includes(o.program)) {
    where.push("x.program = ?");
    params.push(o.program);
  }

  const q = (o.q ?? "").trim().slice(0, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const clauses = [
      "x.nama LIKE ?",
      "x.nama_sekolah LIKE ?",
      "x.nisn LIKE ?",
      "x.nik LIKE ?",
    ];
    params.push(like, like, like, like);
    const m = /^(?:spmb-?2026-?)?(\d{1,6})$/i.exec(q);
    if (m) {
      clauses.push("x.id = ?");
      params.push(Number(m[1]));
    }
    where.push(`(${clauses.join(" OR ")})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = await count(
    `SELECT COUNT(*) AS n FROM (${LIST}) x ${whereSql}`,
    params
  );

  const dir = o.order === "lama" ? "ASC" : "DESC";
  const perPage = Math.min(Math.max(Math.floor(o.perPage ?? 7), 1), 100);
  const page = Math.max(Math.floor(o.page ?? 1), 1);
  const limit = o.all ? "" : `LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT x.* FROM (${LIST}) x ${whereSql}
     ORDER BY x.created_at ${dir}, x.id ${dir} ${limit}`,
    params
  );

  const mapped: PendaftarRow[] = rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    nik: r.nik ?? "",
    createdAt: new Date(r.created_at).toISOString(),
    namaSekolah: r.nama_sekolah ?? "",
    nisn: r.nisn ?? "",
    program: r.program ?? "",
    status: r.status as StatusPendaftar,
    nOk: Number(r.n_ok),
    nWait: Number(r.n_wait),
    nFix: Number(r.n_fix),
    payStatus: r.pay_status ?? "belum_bayar",
  }));

  return { rows: mapped, total, perPage, page };
}

export async function getCounts() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS semua,
            SUM(x.status <> 'draft') AS biodata,
            SUM(x.status = 'menunggu') AS menunggu,
            SUM(x.status = 'terverifikasi') AS terverifikasi,
            SUM(x.n_wait > 0 AND x.status <> 'draft') AS berkas_menunggu,
            SUM(x.pay_status = 'menunggu_verifikasi') AS bayar_menunggu
     FROM (${LIST}) x`
  );
  const r = rows[0] ?? {};
  return {
    semua: Number(r.semua ?? 0),
    biodata: Number(r.biodata ?? 0),
    menunggu: Number(r.menunggu ?? 0),
    terverifikasi: Number(r.terverifikasi ?? 0),
    berkas_menunggu: Number(r.berkas_menunggu ?? 0),
    bayar_menunggu: Number(r.bayar_menunggu ?? 0),
  };
}

/* ============ KUOTA ============ */

export type KuotaRow = {
  kode: ProgramKode;
  rombel: number;
  kepala: string;
  terisi: number;
};

export async function getKuota(): Promise<KuotaRow[]> {
  const [kuota] = await pool.query<RowDataPacket[]>(
    "SELECT kode, rombel, kepala FROM program_kuota"
  );
  const [isi] = await pool.query<RowDataPacket[]>(
    "SELECT program, COUNT(*) AS n FROM pilihan_program GROUP BY program"
  );

  return (PROGRAM_KODE as readonly ProgramKode[]).map((kode) => {
    const k = kuota.find((r) => r.kode === kode);
    const d = PROGRAM_ADMIN[kode];
    return {
      kode,
      rombel: k ? Number(k.rombel) : d.rombel,
      kepala: k?.kepala ?? d.kepala,
      terisi: Number(isi.find((r) => r.program === kode)?.n ?? 0),
    };
  });
}

/* ============ DETAIL ============ */

export async function getPendaftarDetail(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE id = ? AND role = 'calon_siswa'",
    [id]
  );
  if (!rows[0]) return null;

  const [state, items, pay, program, kuota] = await Promise.all([
    getBiodataState(id),
    getBerkas(id),
    getPembayaran(id),
    getProgramKode(id),
    getKuota(),
  ]);
  if (!state) return null;

  return {
    state,
    items,
    pay,
    program,
    kuota: program ? (kuota.find((k) => k.kode === program) ?? null) : null,
  };
}