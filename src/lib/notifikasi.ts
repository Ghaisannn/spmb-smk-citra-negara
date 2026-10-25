import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { JENIS_BERKAS } from "./berkas-config";
import {
  GROUP_JENIS,
  NOTIF_HREF,
  type NotifFilter,
  type NotifInput,
  type NotifItem,
} from "./notifikasi-config";

const WAJIB = JENIS_BERKAS.filter((j) => j.wajib).map((j) => `'${j.kode}'`).join(",");
const N_WAJIB = JENIS_BERKAS.filter((j) => j.wajib).length;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

type Row = NotifInput & { userId: number };

/* ============ MEMBUAT NOTIFIKASI (tidak pernah menggagalkan aksi utama) ============ */

export async function notifyBatch(rows: Row[]) {
  if (rows.length === 0) return;
  try {
    for (let i = 0; i < rows.length; i += 200) {
      const values = rows.slice(i, i + 200).map((r) => [
        r.userId,
        r.jenis,
        r.tone,
        clip(r.judul, 120),
        clip(r.isi, 300),
        r.href ?? NOTIF_HREF.dashboard,
      ]);
      await pool.query(
        "INSERT INTO notifikasi (user_id, jenis, tone, judul, isi, href) VALUES ?",
        [values]
      );
    }
  } catch (e) {
    console.error("Notifikasi gagal dibuat:", e);
  }
}

export const notify = (userId: number, n: NotifInput) => notifyBatch([{ userId, ...n }]);

export const notifyMany = (userIds: number[], n: NotifInput) =>
  notifyBatch([...new Set(userIds)].map((userId) => ({ userId, ...n })));

export function notifHasil(userId: number, hasil: string): Row {
  const href = NOTIF_HREF.hasil;
  if (hasil === "diterima") {
    return {
      userId,
      jenis: "hasil",
      tone: "sukses",
      judul: "Selamat! Anda dinyatakan diterima",
      isi: "Anda lolos seleksi penerimaan SMK Citra Negara. Lihat rincian keputusan dan langkah daftar ulang.",
      href,
    };
  }
  if (hasil === "cadangan") {
    return {
      userId,
      jenis: "hasil",
      tone: "tindakan",
      judul: "Anda masuk daftar cadangan",
      isi: "Panitia akan menghubungi Anda jika ada kursi yang kosong. Pantau terus notifikasi dan WhatsApp Anda.",
      href,
    };
  }
  return {
    userId,
    jenis: "hasil",
    tone: "info",
    judul: "Hasil seleksi telah diumumkan",
    isi: "Hasil seleksi Gelombang 1 sudah dapat dilihat. Buka halaman Hasil Seleksi untuk rinciannya.",
    href,
  };
}

/* ============ PENERIMA ============ */

export async function idsBelumCbt(): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id FROM users u
     JOIN biodata b ON b.user_id = u.id AND b.status = 'terkirim'
     WHERE u.role = 'calon_siswa' AND u.status = 'aktif'
       AND NOT EXISTS (SELECT 1 FROM cbt_percobaan c WHERE c.user_id = u.id)`
  );
  return rows.map((r) => r.id as number);
}

// Sama persis dengan aturan tampil di menu Pengumuman siswa.
export async function idsTargetPengumuman(target: string): Promise<number[]> {
  let sql = "SELECT u.id FROM users u WHERE u.role = 'calon_siswa' AND u.status = 'aktif'";
  const params: string[] = [];

  if (target.startsWith("Jurusan ")) {
    sql +=
      " AND EXISTS (SELECT 1 FROM pilihan_program p WHERE p.user_id = u.id AND p.program = ?)";
    params.push(target.slice(8).toUpperCase());
  } else if (target === "Pendaftar Belum Lengkap") {
    sql += ` AND (SELECT COUNT(DISTINCT b.jenis) FROM berkas b WHERE b.user_id = u.id AND b.jenis IN (${WAJIB})) < ${N_WAJIB}`;
  }

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows.map((r) => r.id as number);
}

/* ============ MEMBACA ============ */

const map = (r: RowDataPacket): NotifItem => ({
  id: r.id,
  jenis: r.jenis,
  tone: r.tone,
  judul: r.judul,
  isi: r.isi,
  href: r.href,
  dibaca: Boolean(r.dibaca),
  at: new Date(r.created_at).toISOString(),
});

// Dipakai topbar & API polling. Aman: tidak pernah melempar error.
export async function getRingkasNotif(userId: number, limit = 10) {
  try {
    const n = Math.min(Math.max(Math.floor(limit), 1), 30);
    const [cnt] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM notifikasi WHERE user_id = ? AND dibaca = 0",
      [userId]
    );
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, jenis, tone, judul, isi, href, dibaca, created_at
       FROM notifikasi WHERE user_id = ?
       ORDER BY created_at DESC, id DESC LIMIT ${n}`,
      [userId]
    );
    return { unread: Number(cnt[0]?.n ?? 0), items: rows.map(map) };
  } catch (e) {
    console.error("Notifikasi gagal dimuat:", e);
    return { unread: 0, items: [] as NotifItem[] };
  }
}

export async function listNotifikasi(
  userId: number,
  o: { filter: NotifFilter; page: number; perPage: number }
) {
  const where = ["user_id = ?"];
  const params: (string | number)[] = [userId];

  if (o.filter === "belum") {
    where.push("dibaca = 0");
  } else if (o.filter !== "semua") {
    const g = GROUP_JENIS[o.filter];
    where.push(`jenis IN (${g.map(() => "?").join(",")})`);
    params.push(...g);
  }

  const w = where.join(" AND ");
  const perPage = Math.min(Math.max(Math.floor(o.perPage), 1), 50);
  const page = Math.max(Math.floor(o.page), 1);

  const [cnt] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM notifikasi WHERE ${w}`,
    params
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, jenis, tone, judul, isi, href, dibaca, created_at
     FROM notifikasi WHERE ${w}
     ORDER BY created_at DESC, id DESC
     LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
    params
  );

  return { rows: rows.map(map), total: Number(cnt[0]?.n ?? 0), page, perPage };
}

export async function countNotifikasi(userId: number) {
  const q = (k: keyof typeof GROUP_JENIS) =>
    GROUP_JENIS[k].map((j) => `'${j}'`).join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS semua,
            SUM(dibaca = 0) AS belum,
            SUM(jenis IN (${q("pendaftaran")})) AS pendaftaran,
            SUM(jenis IN (${q("ujian")})) AS ujian,
            SUM(jenis IN (${q("info")})) AS info
     FROM notifikasi WHERE user_id = ?`,
    [userId]
  );
  const r = rows[0] ?? {};
  return {
    semua: Number(r.semua ?? 0),
    belum: Number(r.belum ?? 0),
    pendaftaran: Number(r.pendaftaran ?? 0),
    ujian: Number(r.ujian ?? 0),
    info: Number(r.info ?? 0),
  };
}

export async function markRead(userId: number, id: number) {
  await pool.execute("UPDATE notifikasi SET dibaca = 1 WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function markAllRead(userId: number) {
  await pool.execute("UPDATE notifikasi SET dibaca = 1 WHERE user_id = ? AND dibaca = 0", [userId]);
}

export async function deleteRead(userId: number) {
  await pool.execute("DELETE FROM notifikasi WHERE user_id = ? AND dibaca = 1", [userId]);
}