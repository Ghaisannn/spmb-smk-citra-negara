import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { PASSING_GRADE } from "./admin-config";
import { getCounts, getKuota } from "./admin-data";
import { JENIS_BERKAS } from "./berkas-config";
import { kapasitasOf } from "./program-admin";
import { PROGRAM_KODE } from "./program-data";

const WAJIB = JENIS_BERKAS.filter((j) => j.wajib).map((j) => `'${j.kode}'`).join(",");
const N_WAJIB = JENIS_BERKAS.filter((j) => j.wajib).length;
const N_OK = `(SELECT COUNT(*) FROM berkas k WHERE k.user_id = u.id AND k.jenis IN (${WAJIB}) AND k.status = 'diterima')`;

const n = (v: unknown) => Number(v ?? 0);
const nn = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export type Filters = { program?: string; jalur?: string; q?: string };

// Populasi: calon siswa yang formulirnya sudah terkirim.
function pop(o: Filters, extra: string[] = []) {
  const where = ["u.role = 'calon_siswa'", ...extra];
  const params: (string | number)[] = [];

  if (o.program && PROGRAM_KODE.includes(o.program)) {
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
    const c = ["u.nama LIKE ?", "b.nama_sekolah LIKE ?", "b.nisn LIKE ?"];
    params.push(like, like, like);
    const m = /^(?:spmb-?2026-?)?(\d{1,6})$/i.exec(q);
    if (m) {
      c.push("u.id = ?");
      params.push(Number(m[1]));
    }
    where.push(`(${c.join(" OR ")})`);
  }

  return {
    from: `FROM users u
      JOIN biodata b ON b.user_id = u.id AND b.status = 'terkirim'
      LEFT JOIN pilihan_program pp ON pp.user_id = u.id
      LEFT JOIN seleksi s ON s.user_id = u.id
      WHERE ${where.join(" AND ")}`,
    params,
  };
}

/* ================= RINGKASAN (Dashboard & Laporan) ================= */

export async function getRingkasan() {
  const [c, kuota, rows] = await Promise.all([
    getCounts(),
    getKuota(),
    pool.query<RowDataPacket[]>(
      `SELECT SUM(s.hasil = 'diterima') AS diterima,
              SUM(s.hasil = 'cadangan') AS cadangan,
              SUM(s.hasil = 'tidak_diterima') AS tidak,
              SUM(s.skor IS NOT NULL) AS teruji,
              SUM(s.nilai_cbt IS NOT NULL) AS hadir
       FROM seleksi s
       JOIN users u ON u.id = s.user_id AND u.role = 'calon_siswa'
       JOIN biodata b ON b.user_id = u.id AND b.status = 'terkirim'`
    ),
  ]);
  const r = rows[0][0] ?? {};
  return {
    semua: c.semua,
    biodata: c.biodata,
    terverifikasi: c.terverifikasi,
    diterima: n(r.diterima),
    cadangan: n(r.cadangan),
    tidak: n(r.tidak),
    teruji: n(r.teruji),
    hadir: n(r.hadir),
    kapasitas: kuota.reduce((a, k) => a + kapasitasOf(k.rombel), 0),
    kuota,
  };
}

export async function getTren(weeks = 8) {
  const W = 7 * 86400000;
  const start = Date.now() - weeks * W;
  const sd = new Date(start);

  const [u, b, bu, bb] = await Promise.all([
    pool.query<RowDataPacket[]>(
      "SELECT created_at AS t FROM users WHERE role = 'calon_siswa' AND created_at >= ?",
      [sd]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT b.submitted_at AS t FROM biodata b JOIN users u ON u.id = b.user_id
       WHERE u.role = 'calon_siswa' AND b.status = 'terkirim' AND b.submitted_at >= ?`,
      [sd]
    ),
    pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'calon_siswa' AND created_at < ?",
      [sd]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM biodata b JOIN users u ON u.id = b.user_id
       WHERE u.role = 'calon_siswa' AND b.status = 'terkirim' AND b.submitted_at < ?`,
      [sd]
    ),
  ]);

  const bucket = (t: Date | string) =>
    Math.min(weeks - 1, Math.max(0, Math.floor((new Date(t).getTime() - start) / W)));

  const daftar = Array(weeks).fill(0) as number[];
  const kirim = Array(weeks).fill(0) as number[];
  for (const r of u[0]) daftar[bucket(r.t)]++;
  for (const r of b[0]) kirim[bucket(r.t)]++;

  const labels = Array.from({ length: weeks }, (_, i) =>
    new Date(start + i * W).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    })
  );

  return { labels, daftar, kirim, baseDaftar: n(bu[0][0]?.n), baseKirim: n(bb[0][0]?.n) };
}

/* ================= MONITORING ================= */

export async function getMonitoring(f: Filters) {
  const { from, params } = pop(f);
  const [stat, dist] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(s.skor IS NOT NULL) AS teruji,
              SUM(${N_OK} >= ${N_WAJIB}) AS lulus_adm,
              SUM(s.skor >= ${PASSING_GRADE}) AS lulus_pg,
              SUM(s.skor < ${PASSING_GRADE}) AS bawah
       ${from}`,
      params
    ),
    pool.query<RowDataPacket[]>(
      `SELECT pp.program AS program,
              SUM(s.hasil = 'diterima') AS ok,
              SUM(s.hasil = 'cadangan') AS cad,
              SUM(s.hasil = 'tidak_diterima') AS tdk
       ${from} AND pp.program IS NOT NULL
       GROUP BY pp.program`,
      params
    ),
  ]);

  const s = stat[0][0] ?? {};
  return {
    total: n(s.total),
    teruji: n(s.teruji),
    lulusAdm: n(s.lulus_adm),
    lulusPg: n(s.lulus_pg),
    bawah: n(s.bawah),
    distribusi: dist[0].map((r) => ({
      program: r.program as string,
      ok: n(r.ok),
      cad: n(r.cad),
      tdk: n(r.tdk),
    })),
  };
}

export type PenilaianRow = {
  id: number;
  nama: string;
  sekolah: string;
  program: string;
  cbt: number | null;
  wwn: number | null;
  skor: number | null;
  hasil: "belum" | "diterima" | "cadangan" | "tidak_diterima";
  jalur: string;
  catatan: string;
  peringkat: number | null;
  totalPeserta: number | null;
};

export async function listPenilaian(
  o: Filters & { sort?: string; page?: number; perPage?: number; all?: boolean }
) {
  const { from, params } = pop(o, ["s.skor IS NOT NULL"]);
  const order =
    o.sort === "terendah"
      ? "s.skor ASC, u.id ASC"
      : o.sort === "terbaru"
        ? "s.updated_at DESC, u.id DESC"
        : "s.skor DESC, u.id ASC";
  const perPage = Math.min(Math.max(Math.floor(o.perPage ?? 10), 1), 100);
  const page = Math.max(Math.floor(o.page ?? 1), 1);
  const limit = o.all ? "" : `LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`;

  const [cnt, rows] = await Promise.all([
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n ${from}`, params),
    pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nama, b.nama_sekolah, pp.program, s.nilai_cbt, s.nilai_wawancara,
              s.skor, s.hasil, COALESCE(s.jalur, 'Reguler') AS jalur, s.catatan,
              s.peringkat, s.total_peserta
       ${from} ORDER BY ${order} ${limit}`,
      params
    ),
  ]);

  const mapped: PenilaianRow[] = rows[0].map((r) => ({
    id: r.id,
    nama: r.nama,
    sekolah: r.nama_sekolah ?? "",
    program: r.program ?? "",
    cbt: nn(r.nilai_cbt),
    wwn: nn(r.nilai_wawancara),
    skor: nn(r.skor),
    hasil: r.hasil,
    jalur: r.jalur,
    catatan: r.catatan ?? "",
    peringkat: nn(r.peringkat),
    totalPeserta: nn(r.total_peserta),
  }));

  return { rows: mapped, total: n(cnt[0][0]?.n), page, perPage };
}

/* ================= PERSETUJUAN ================= */

export type Persetujuan = {
  status: "menunggu" | "disetujui" | "revisi";
  noBerkas: string;
  diajukanOleh: string;
  jabatan: string;
  catatan: string;
  diajukanAt: string;
  keputusanAt: string | null;
  catatanRevisi: string;
};

export async function getPersetujuan(): Promise<Persetujuan> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT status, no_berkas, diajukan_oleh, jabatan_pengusul, catatan_panitia,
            diajukan_at, keputusan_at, catatan_revisi
     FROM persetujuan_hasil WHERE id = 1`
  );
  const r = rows[0];
  if (!r) {
    return {
      status: "menunggu",
      noBerkas: "BA.042/SPMB-CN/III/2026",
      diajukanOleh: "Drs. Supriyadi, M.Pd",
      jabatan: "Ketua Panitia SPMB 2026",
      catatan: "",
      diajukanAt: new Date().toISOString(),
      keputusanAt: null,
      catatanRevisi: "",
    };
  }
  return {
    status: r.status,
    noBerkas: r.no_berkas,
    diajukanOleh: r.diajukan_oleh,
    jabatan: r.jabatan_pengusul,
    catatan: r.catatan_panitia,
    diajukanAt: new Date(r.diajukan_at).toISOString(),
    keputusanAt: r.keputusan_at ? new Date(r.keputusan_at).toISOString() : null,
    catatanRevisi: r.catatan_revisi ?? "",
  };
}

export type DraftSk = {
  judul: string;
  nomor: string;
  tanggal: string;
  sambutan: string;
  versi: number;
  status: "draft" | "terbit";
  publishedAt: string | null;
};

export async function getDraft(): Promise<DraftSk> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT judul, nomor_surat, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
            sambutan, versi, status, published_at
     FROM draft_sk WHERE id = 1`
  );
  const r = rows[0];
  if (!r) {
    return {
      judul: "Surat Keputusan Kelulusan Seleksi Penerimaan Murid Baru (SPMB) Gelombang 1",
      nomor: "",
      tanggal: new Date().toISOString().slice(0, 10),
      sambutan: "",
      versi: 1,
      status: "draft",
      publishedAt: null,
    };
  }
  return {
    judul: r.judul,
    nomor: r.nomor_surat,
    tanggal: r.tanggal,
    sambutan: r.sambutan,
    versi: Number(r.versi),
    status: r.status,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
  };
}

export type LogItem = { judul: string; detail: string; at: string };

export async function getLog(jenis: string, limit = 50) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT judul, detail, created_at FROM kepsek_log WHERE jenis = ? ORDER BY id DESC LIMIT ?",
    [jenis, limit]
  );
  const [c] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM kepsek_log WHERE jenis = ?",
    [jenis]
  );
  const items: LogItem[] = rows.map((r) => ({
    judul: r.judul,
    detail: r.detail ?? "",
    at: new Date(r.created_at).toISOString(),
  }));
  return { items, total: n(c[0]?.n) };
}

export type PlenoRow = {
  id: number;
  nama: string;
  sekolah: string;
  program: string;
  skor: number | null;
  hasil: "diterima" | "cadangan";
  prioritas: number | null;
};

export async function listPleno(o: { q?: string; program?: string; page: number; perPage: number }) {
  const extra = ["s.hasil IN ('diterima','cadangan')"];
  const { from, params } = pop({ q: o.q, program: o.program }, extra);
  const perPage = Math.min(Math.max(Math.floor(o.perPage), 1), 50);
  const page = Math.max(Math.floor(o.page), 1);

  const [cnt, rows, cad, tabs, st] = await Promise.all([
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n ${from}`, params),
    pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nama, b.nama_sekolah, pp.program, s.skor, s.hasil
       ${from}
       ORDER BY (s.hasil = 'diterima') DESC, s.skor DESC, u.id ASC
       LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
      params
    ),
    pool.query<RowDataPacket[]>(
      "SELECT user_id FROM seleksi WHERE hasil = 'cadangan' ORDER BY skor DESC, user_id ASC"
    ),
    pool.query<RowDataPacket[]>(
      `SELECT pp.program AS program, COUNT(*) AS n
       ${pop({}, extra).from} AND pp.program IS NOT NULL GROUP BY pp.program`
    ),
    pool.query<RowDataPacket[]>(
      `SELECT SUM(s.hasil = 'diterima') AS ok, SUM(s.hasil = 'cadangan') AS cad,
              SUM(s.hasil = 'diterima' AND s.skor >= ${PASSING_GRADE}) AS ok_valid
       ${pop({}, extra).from}`
    ),
  ]);

  const rank = new Map<number, number>();
  cad[0].forEach((r, i) => rank.set(r.user_id as number, i + 1));

  const mapped: PlenoRow[] = rows[0].map((r) => ({
    id: r.id,
    nama: r.nama,
    sekolah: r.nama_sekolah ?? "",
    program: r.program ?? "",
    skor: nn(r.skor),
    hasil: r.hasil,
    prioritas: r.hasil === "cadangan" ? (rank.get(r.id) ?? null) : null,
  }));

  const s = st[0][0] ?? {};
  const ok = n(s.ok);
  return {
    rows: mapped,
    total: n(cnt[0][0]?.n),
    page,
    perPage,
    tabCounts: Object.fromEntries(tabs[0].map((r) => [r.program as string, n(r.n)])) as Record<string, number>,
    diterima: ok,
    cadangan: n(s.cad),
    pctValid: ok > 0 ? Math.round((n(s.ok_valid) / ok) * 100) : 0,
  };
}

/* ================= LAPORAN ================= */

export type MatrixRow = {
  program: string;
  pagu: number;
  pendaftar: number;
  lolosAdm: number;
  hadir: number;
  diterima: number;
  cadangan: number;
};

export async function getMatrix(): Promise<MatrixRow[]> {
  const [kuota, rows] = await Promise.all([
    getKuota(),
    pool.query<RowDataPacket[]>(
      `SELECT pp.program AS program, COUNT(*) AS pendaftar,
              SUM(${N_OK} >= ${N_WAJIB}) AS lolos_adm,
              SUM(s.nilai_cbt IS NOT NULL) AS hadir,
              SUM(s.hasil = 'diterima') AS diterima,
              SUM(s.hasil = 'cadangan') AS cadangan
       FROM pilihan_program pp
       JOIN users u ON u.id = pp.user_id AND u.role = 'calon_siswa'
       LEFT JOIN seleksi s ON s.user_id = u.id
       GROUP BY pp.program`
    ),
  ]);

  return kuota.map((k) => {
    const r = rows[0].find((x) => x.program === k.kode);
    return {
      program: k.kode as string,
      pagu: kapasitasOf(k.rombel),
      pendaftar: n(r?.pendaftar),
      lolosAdm: n(r?.lolos_adm),
      hadir: n(r?.hadir),
      diterima: n(r?.diterima),
      cadangan: n(r?.cadangan),
    };
  });
}