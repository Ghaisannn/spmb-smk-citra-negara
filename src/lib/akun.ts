import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type StatusAkun = "aktif" | "nonaktif";

export type SiswaAkun = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  whatsapp: string;
  status: StatusAkun;
  createdAt: string;
  lastLogin: string | null;
  formulir: "belum" | "draft" | "terkirim";
  langkah: number;
  program: string;
  bayar: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
};

export type KepsekAkun = {
  id: number;
  nama: string;
  email: string;
  status: StatusAkun;
  createdAt: string;
  lastLogin: string | null;
  pernahMengesahkan: boolean;
};

export type AkunLog = {
  aksi: string;
  targetNama: string;
  targetRole: string;
  detail: string;
  at: string;
};

const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

export async function getAkunCounts() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT SUM(role = 'calon_siswa') AS siswa,
            SUM(role = 'calon_siswa' AND status = 'aktif') AS siswa_aktif,
            SUM(role = 'calon_siswa' AND status = 'nonaktif') AS siswa_nonaktif,
            SUM(role = 'kepsek') AS kepsek,
            SUM(role = 'kepsek' AND status = 'aktif') AS kepsek_aktif
     FROM users`
  );
  const r = rows[0] ?? {};
  return {
    siswa: Number(r.siswa ?? 0),
    siswaAktif: Number(r.siswa_aktif ?? 0),
    siswaNonaktif: Number(r.siswa_nonaktif ?? 0),
    kepsek: Number(r.kepsek ?? 0),
    kepsekAktif: Number(r.kepsek_aktif ?? 0),
  };
}

export async function listSiswa(o: {
  q?: string;
  status?: string;
  page: number;
  perPage: number;
}) {
  const where = ["u.role = 'calon_siswa'"];
  const params: (string | number)[] = [];

  if (o.status === "aktif" || o.status === "nonaktif") {
    where.push("u.status = ?");
    params.push(o.status);
  }

  const q = (o.q ?? "").trim().slice(0, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const c = ["u.nama LIKE ?", "u.email LIKE ?", "u.nik LIKE ?", "u.whatsapp LIKE ?"];
    params.push(like, like, like, like);
    const m = /^(?:spmb-?2026-?)?(\d{1,6})$/i.exec(q);
    if (m) {
      c.push("u.id = ?");
      params.push(Number(m[1]));
    }
    where.push(`(${c.join(" OR ")})`);
  }

  const w = where.join(" AND ");
  const perPage = Math.min(Math.max(Math.floor(o.perPage), 1), 50);
  const page = Math.max(Math.floor(o.page), 1);

  const [cnt] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM users u WHERE ${w}`,
    params
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nama, u.email, u.nik, u.whatsapp, u.status, u.created_at, u.last_login_at,
            b.id AS bio_id, b.status AS bio_status, b.step_selesai,
            pp.program, pay.status AS pay_status
     FROM users u
     LEFT JOIN biodata b ON b.user_id = u.id
     LEFT JOIN pilihan_program pp ON pp.user_id = u.id
     LEFT JOIN pembayaran pay ON pay.user_id = u.id
     WHERE ${w}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
    params
  );

  const mapped: SiswaAkun[] = rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    email: r.email,
    nik: r.nik ?? "",
    whatsapp: r.whatsapp ?? "",
    status: r.status,
    createdAt: iso(r.created_at) as string,
    lastLogin: iso(r.last_login_at),
    formulir: r.bio_status === "terkirim" ? "terkirim" : r.bio_id !== null ? "draft" : "belum",
    langkah: Number(r.step_selesai ?? 0),
    program: r.program ?? "",
    bayar: r.pay_status ?? "belum_bayar",
  }));

  return { rows: mapped, total: Number(cnt[0]?.n ?? 0), page, perPage };
}

export async function listKepsek(): Promise<KepsekAkun[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nama, u.email, u.status, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM persetujuan_hasil p WHERE p.keputusan_oleh = u.id) AS n_putus
     FROM users u WHERE u.role = 'kepsek'
     ORDER BY u.created_at ASC, u.id ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    email: r.email,
    status: r.status,
    createdAt: iso(r.created_at) as string,
    lastLogin: iso(r.last_login_at),
    pernahMengesahkan: Number(r.n_putus) > 0,
  }));
}

export async function getAkunLog(limit = 8): Promise<AkunLog[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT aksi, target_nama, target_role, detail, created_at
     FROM akun_log ORDER BY id DESC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    aksi: r.aksi,
    targetNama: r.target_nama,
    targetRole: r.target_role,
    detail: r.detail ?? "",
    at: iso(r.created_at) as string,
  }));
}