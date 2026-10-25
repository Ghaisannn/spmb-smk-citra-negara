import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { KATEGORI_SOAL, KESULITAN, STATUS_SOAL } from "@/lib/admin-config";
import type { RowDataPacket } from "mysql2";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function parse(b: Record<string, unknown>) {
  const kategori = str(b.kategori);
  const topik = str(b.topik);
  const kesulitan = str(b.kesulitan);
  const status = str(b.status);
  const teks = str(b.teks);
  const kunci = str(b.kunci).toUpperCase();
  const bobot = Number(b.bobot);
  const opsi = Array.isArray(b.opsi) ? b.opsi.map(str) : [];

  if (!KATEGORI_SOAL.some((k) => k.kode === kategori)) return "Kategori soal tidak valid.";
  if (topik.length < 2 || topik.length > 60) return "Topik harus 2 sampai 60 karakter.";
  if (!(KESULITAN as readonly string[]).includes(kesulitan)) return "Tingkat kesulitan tidak valid.";
  if (!(STATUS_SOAL as readonly string[]).includes(status)) return "Status soal tidak valid.";
  if (teks.length < 10 || teks.length > 1000) return "Teks pertanyaan harus 10 sampai 1000 karakter.";
  if (opsi.length !== 5 || opsi.some((o) => o.length < 1 || o.length > 255)) {
    return "Kelima pilihan jawaban (A sampai E) wajib diisi.";
  }
  if (!["A", "B", "C", "D", "E"].includes(kunci)) return "Kunci jawaban tidak valid.";
  if (!Number.isFinite(bobot) || bobot <= 0 || bobot > 9.99) return "Bobot harus lebih dari 0 dan maksimal 9.99.";

  return { kategori, topik, kesulitan, status, teks, kunci, bobot, opsi };
}

export async function POST(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const v = parse(await request.json());
    if (typeof v === "string") return bad(v);

    const prefix = KATEGORI_SOAL.find((k) => k.kode === v.kategori)!.prefix;
    const [r] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(kode, 5) AS UNSIGNED)), 0) AS n
       FROM bank_soal WHERE kategori = ?`,
      [v.kategori]
    );
    const kode = `${prefix}-${String(Number(r[0]?.n ?? 0) + 1).padStart(2, "0")}`;

    await pool.execute(
      `INSERT INTO bank_soal
        (kode, kategori, topik, kesulitan, status, teks, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci, bobot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode, v.kategori, v.topik, v.kesulitan, v.status, v.teks, ...v.opsi, v.kunci, v.bobot]
    );
    return Response.json({ message: `Soal ${kode} berhasil ditambahkan.` }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return bad("Kode soal bentrok. Coba simpan sekali lagi.", 409);
    }
    return serverError("Soal create", e);
  }
}

export async function PUT(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return bad("Soal tidak valid.");
    const v = parse(body);
    if (typeof v === "string") return bad(v);

    // Kategori dan kode soal tidak diubah saat edit.
    const [res] = await pool.execute(
      `UPDATE bank_soal SET topik=?, kesulitan=?, status=?, teks=?,
         opsi_a=?, opsi_b=?, opsi_c=?, opsi_d=?, opsi_e=?, kunci=?, bobot=?
       WHERE id = ?`,
      [v.topik, v.kesulitan, v.status, v.teks, ...v.opsi, v.kunci, v.bobot, id]
    );
    if ((res as { affectedRows: number }).affectedRows === 0) return bad("Soal tidak ditemukan.", 404);
    return Response.json({ message: "Butir soal diperbarui." });
  } catch (e) {
    return serverError("Soal update", e);
  }
}

export async function DELETE(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const ids = (new URL(request.url).searchParams.get("ids") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 200);
    if (ids.length === 0) return bad("Tidak ada soal yang dipilih.");

    await pool.query("DELETE FROM bank_soal WHERE id IN (?)", [ids]);
    return Response.json({ message: `${ids.length} butir soal dihapus.` });
  } catch (e) {
    return serverError("Soal delete", e);
  }
}