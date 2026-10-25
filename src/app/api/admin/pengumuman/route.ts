import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import {
  KATEGORI_PENGUMUMAN,
  TARGET_PENGUMUMAN,
  isValidDate,
  todayWib,
} from "@/lib/admin-config";
import { idsTargetPengumuman, notifyMany } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";
import type { RowDataPacket } from "mysql2";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function parse(b: Record<string, unknown>) {
  const judul = str(b.judul);
  const kategori = str(b.kategori);
  const target = str(b.target);
  const tanggal = str(b.tanggal);
  const status = str(b.status);
  const isi = str(b.isi);

  if (judul.length < 5 || judul.length > 150) return "Judul harus 5 sampai 150 karakter.";
  if (!(KATEGORI_PENGUMUMAN as readonly string[]).includes(kategori)) return "Kategori tidak valid.";
  if (!(TARGET_PENGUMUMAN as readonly string[]).includes(target)) return "Target penerima tidak valid.";
  if (!isValidDate(tanggal)) return "Tanggal publikasi tidak valid.";
  if (status !== "dipublikasi" && status !== "draft") return "Status publikasi tidak valid.";
  if (isi.length < 10 || isi.length > 2000) return "Isi pengumuman harus 10 sampai 2000 karakter.";

  return { judul, kategori, target, tanggal, status, prioritas: b.prioritas ? 1 : 0, isi };
}

// Kirim notifikasi ke siswa sesuai target pengumuman.
async function kabarkan(p: { judul: string; isi: string; target: string; prioritas: number }) {
  try {
    const ids = await idsTargetPengumuman(p.target);
    await notifyMany(ids, {
      jenis: "pengumuman",
      tone: p.prioritas ? "tindakan" : "info",
      judul: `Pengumuman baru: ${p.judul}`,
      isi: p.isi.replace(/\s+/g, " "),
      href: NOTIF_HREF.pengumuman,
    });
  } catch (e) {
    console.error("Notifikasi pengumuman gagal:", e);
  }
}

export async function POST(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const v = parse(await request.json());
    if (typeof v === "string") return bad(v);

    await pool.execute(
      `INSERT INTO pengumuman (judul, kategori, target, tanggal, status, prioritas, isi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [v.judul, v.kategori, v.target, v.tanggal, v.status, v.prioritas, v.isi]
    );

    if (v.status === "dipublikasi" && v.tanggal <= todayWib()) await kabarkan(v);

    return Response.json(
      { message: v.status === "draft" ? "Draft pengumuman tersimpan." : "Pengumuman berhasil dipublikasikan." },
      { status: 201 }
    );
  } catch (e) {
    return serverError("Pengumuman create", e);
  }
}

export async function PUT(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return bad("Pengumuman tidak valid.");
    const v = parse(body);
    if (typeof v === "string") return bad(v);

    const [cur] = await pool.query<RowDataPacket[]>(
      "SELECT status FROM pengumuman WHERE id = ?",
      [id]
    );
    if (!cur[0]) return bad("Pengumuman tidak ditemukan.", 404);

    await pool.execute(
      `UPDATE pengumuman SET judul=?, kategori=?, target=?, tanggal=?, status=?, prioritas=?, isi=?
       WHERE id = ?`,
      [v.judul, v.kategori, v.target, v.tanggal, v.status, v.prioritas, v.isi, id]
    );

    // Notifikasi hanya saat draft baru dipublikasikan.
    if (cur[0].status === "draft" && v.status === "dipublikasi" && v.tanggal <= todayWib()) {
      await kabarkan(v);
    }

    return Response.json({ message: "Pengumuman diperbarui." });
  } catch (e) {
    return serverError("Pengumuman update", e);
  }
}

// Publikasikan draft sekarang
export async function PATCH(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const id = Number((await request.json()).id);
    if (!Number.isInteger(id) || id <= 0) return bad("Pengumuman tidak valid.");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT judul, isi, target, prioritas, status FROM pengumuman WHERE id = ?",
      [id]
    );
    const p = rows[0];
    if (!p) return bad("Pengumuman tidak ditemukan.", 404);
    if (p.status === "dipublikasi") {
      return Response.json({ message: "Pengumuman sudah dipublikasikan." });
    }

    await pool.execute(
      `UPDATE pengumuman SET status = 'dipublikasi', tanggal = LEAST(tanggal, ?) WHERE id = ?`,
      [todayWib(), id]
    );
    await kabarkan({
      judul: p.judul,
      isi: p.isi,
      target: p.target,
      prioritas: Number(p.prioritas),
    });

    return Response.json({ message: "Pengumuman dipublikasikan ke portal siswa." });
  } catch (e) {
    return serverError("Pengumuman publish", e);
  }
}

export async function DELETE(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return bad("Pengumuman tidak valid.");
    await pool.execute("DELETE FROM pengumuman WHERE id = ?", [id]);
    return Response.json({ message: "Pengumuman dihapus." });
  } catch (e) {
    return serverError("Pengumuman delete", e);
  }
}