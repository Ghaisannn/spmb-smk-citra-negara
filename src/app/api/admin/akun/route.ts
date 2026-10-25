import { unlink } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { BERKAS_DIR } from "@/lib/berkas-files";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";

const BUKTI_DIR = path.join(process.cwd(), "storage", "bukti");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WA = /^(08|628)\d{8,12}$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function errSandi(p: unknown) {
  if (typeof p !== "string" || p.length < 8 || Buffer.byteLength(p, "utf8") > 72) {
    return "Kata sandi minimal 8 karakter dan maksimal 72 byte.";
  }
  return null;
}

async function getTarget(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, nama, email, role, status, nik, whatsapp
     FROM users WHERE id = ? AND role IN ('calon_siswa','kepsek')`,
    [id]
  );
  return rows[0] ?? null;
}

async function kepsekAktifLain(excludeId: number) {
  const [r] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'kepsek' AND status = 'aktif' AND id <> ?",
    [excludeId]
  );
  return Number(r[0]?.n ?? 0);
}

async function catat(
  adminId: number,
  t: { id: number | null; nama: string; role: string },
  aksi: string,
  detail?: string
) {
  await pool.execute(
    `INSERT INTO akun_log (admin_id, target_id, target_nama, target_role, aksi, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, t.id, t.nama, t.role, aksi, detail ? detail.slice(0, 255) : null]
  );
}

/* ===== Tambah akun Kepala Sekolah ===== */
export async function POST(request: Request) {
  const admin = await adminOnly();
  if (!admin) return unauthorized();

  try {
    const b = await request.json();
    const nama = str(b.nama);
    const email = str(b.email).toLowerCase();

    if (nama.length < 3 || nama.length > 100) return bad("Nama harus 3 sampai 100 karakter.");
    if (!EMAIL.test(email) || email.length > 150) return bad("Format email tidak valid.");
    const es = errSandi(b.password);
    if (es) return bad(es);

    const [dup] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
    if (dup[0]) return bad("Email sudah dipakai akun lain.", 409);

    const hash = await bcrypt.hash(b.password as string, 12);
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'kepsek')",
      [nama, email, hash]
    );

    await catat(admin.id, { id: res.insertId, nama, role: "kepsek" }, "tambah", `Akun dibuat dengan email ${email}.`);
    return Response.json({ message: "Akun Kepala Sekolah berhasil dibuat." }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return bad("Email sudah dipakai akun lain.", 409);
    return serverError("Akun create", e);
  }
}

/* ===== Ubah data akun ===== */
export async function PUT(request: Request) {
  const admin = await adminOnly();
  if (!admin) return unauthorized();

  try {
    const b = await request.json();
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) return bad("Akun tidak valid.");

    const t = await getTarget(id);
    if (!t) return bad("Akun tidak ditemukan.", 404);

    const nama = str(b.nama);
    const email = str(b.email).toLowerCase();
    if (nama.length < 3 || nama.length > 100) return bad("Nama harus 3 sampai 100 karakter.");
    if (!EMAIL.test(email) || email.length > 150) return bad("Format email tidak valid.");

    const [dupE] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, id]
    );
    if (dupE[0]) return bad("Email sudah dipakai akun lain.", 409);

    const diff: string[] = [];
    if (nama !== t.nama) diff.push("Nama");
    if (email !== t.email) diff.push("Email");

    if (t.role === "calon_siswa") {
      const nik = str(b.nik);
      const wa = str(b.whatsapp);
      if (!/^\d{16}$/.test(nik)) return bad("NIK harus 16 digit angka.");
      if (!WA.test(wa)) return bad("Nomor WhatsApp tidak valid (contoh: 08123456789).");

      const [dupN] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE nik = ? AND id <> ?",
        [nik, id]
      );
      if (dupN[0]) return bad("NIK sudah dipakai akun lain.", 409);

      if (nik !== (t.nik ?? "")) diff.push("NIK");
      if (wa !== (t.whatsapp ?? "")) diff.push("WhatsApp");

      await pool.execute(
        "UPDATE users SET nama = ?, email = ?, nik = ?, whatsapp = ? WHERE id = ?",
        [nama, email, nik, wa, id]
      );
    } else {
      await pool.execute("UPDATE users SET nama = ?, email = ? WHERE id = ?", [nama, email, id]);
    }

    if (diff.length === 0) return Response.json({ message: "Tidak ada perubahan data." });

    await catat(admin.id, { id, nama, role: t.role }, "ubah", `Diubah: ${diff.join(", ")}.`);
    return Response.json({ message: "Data akun diperbarui." });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return bad("Email atau NIK sudah dipakai akun lain.", 409);
    return serverError("Akun update", e);
  }
}

/* ===== Status aktif/nonaktif dan reset kata sandi ===== */
export async function PATCH(request: Request) {
  const admin = await adminOnly();
  if (!admin) return unauthorized();

  try {
    const b = await request.json();
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) return bad("Akun tidak valid.");

    const t = await getTarget(id);
    if (!t) return bad("Akun tidak ditemukan.", 404);

    if (b.action === "status") {
      const status = b.status;
      if (status !== "aktif" && status !== "nonaktif") return bad("Status tidak valid.");
      if (t.status === status) return bad(`Akun sudah berstatus ${status}.`, 409);

      if (t.role === "kepsek" && status === "nonaktif" && (await kepsekAktifLain(id)) < 1) {
        return bad("Tidak dapat dinonaktifkan. Harus ada minimal satu akun Kepala Sekolah yang aktif.", 409);
      }

      await pool.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
      await catat(admin.id, { id, nama: t.nama, role: t.role }, status === "aktif" ? "aktif" : "nonaktif");
      return Response.json({
        message: status === "aktif" ? "Akun diaktifkan kembali." : "Akun dinonaktifkan. Pemilik akun tidak dapat login.",
      });
    }

    if (b.action === "reset") {
      const es = errSandi(b.password);
      if (es) return bad(es);
      const hash = await bcrypt.hash(b.password as string, 12);
      await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hash, id]);
      await catat(admin.id, { id, nama: t.nama, role: t.role }, "reset_sandi");
      return Response.json({ message: "Kata sandi berhasil direset." });
    }

    return bad("Aksi tidak valid.");
  } catch (e) {
    return serverError("Akun patch", e);
  }
}

/* ===== Hapus akun ===== */
export async function DELETE(request: Request) {
  const admin = await adminOnly();
  if (!admin) return unauthorized();

  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return bad("Akun tidak valid.");

    const t = await getTarget(id);
    if (!t) return bad("Akun tidak ditemukan.", 404);

    const files: string[] = [];

    if (t.role === "calon_siswa") {
      const [sel] = await pool.query<RowDataPacket[]>(
        "SELECT dipublikasi FROM seleksi WHERE user_id = ?",
        [id]
      );
      if (Number(sel[0]?.dipublikasi ?? 0) === 1) {
        return bad("Hasil seleksi akun ini sudah dipublikasikan, jadi tidak dapat dihapus. Gunakan Nonaktifkan agar datanya tetap tersimpan.", 409);
      }

      const [pay] = await pool.query<RowDataPacket[]>("SELECT bukti_file FROM pembayaran WHERE user_id = ?", [id]);
      const [brk] = await pool.query<RowDataPacket[]>("SELECT file_name FROM berkas WHERE user_id = ?", [id]);
      for (const r of pay) if (r.bukti_file) files.push(path.join(BUKTI_DIR, path.basename(r.bukti_file)));
      for (const r of brk) files.push(path.join(BERKAS_DIR, path.basename(r.file_name)));
    } else {
      if ((await kepsekAktifLain(id)) < 1) {
        return bad("Tidak dapat dihapus. Harus ada minimal satu akun Kepala Sekolah yang aktif.", 409);
      }
      const [putus] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM persetujuan_hasil WHERE keputusan_oleh = ?",
        [id]
      );
      if (Number(putus[0]?.n ?? 0) > 0) {
        return bad("Akun ini pernah mengesahkan hasil seleksi, jadi tidak dapat dihapus. Gunakan Nonaktifkan.", 409);
      }
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    await Promise.all(files.map((f) => unlink(f).catch(() => {})));
    await catat(admin.id, { id, nama: t.nama, role: t.role }, "hapus", t.email);

    return Response.json({ message: "Akun berhasil dihapus permanen." });
  } catch (e) {
    return serverError("Akun delete", e);
  }
}