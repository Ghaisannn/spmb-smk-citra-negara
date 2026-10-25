import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { MAX_BERKAS_MB, getJenis } from "@/lib/berkas-config";
import { BERKAS_DIR, detectType } from "@/lib/berkas-files";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

const MAX_BYTES = MAX_BERKAS_MB * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const state = await getBiodataState(session.id);
    if (!state || state.status !== "terkirim") {
      return Response.json(
        { message: "Kirim formulir biodata terlebih dahulu." },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const jenis = getJenis(String(form.get("jenis") ?? ""));
    const file = form.get("file");

    if (!jenis) {
      return Response.json({ message: "Jenis berkas tidak valid." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ message: "File wajib dipilih." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { message: `Ukuran file maksimal ${MAX_BERKAS_MB} MB.` },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT status, file_name FROM berkas WHERE user_id = ? AND jenis = ?",
      [session.id, jenis.kode]
    );
    const existing = rows[0];

    if (existing?.status === "diterima") {
      return Response.json(
        { message: "Berkas ini sudah diverifikasi dan tidak dapat diganti." },
        { status: 409 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = detectType(buf);
    if (!ext || !jenis.ext.includes(ext)) {
      return Response.json(
        {
          message: `Format file harus ${jenis.ext
            .map((e) => e.toUpperCase())
            .join(" / ")}.`,
        },
        { status: 400 }
      );
    }

    await mkdir(BERKAS_DIR, { recursive: true });
    const filename = `user-${session.id}-${jenis.kode}-${Date.now()}.${ext}`;
    await writeFile(path.join(BERKAS_DIR, filename), buf);

    const namaAsli = file.name.slice(0, 255) || `${jenis.kode}.${ext}`;

    await pool.execute(
      `INSERT INTO berkas (user_id, jenis, file_name, nama_asli, ukuran, status)
       VALUES (?, ?, ?, ?, ?, 'menunggu')
       ON DUPLICATE KEY UPDATE
         file_name = VALUES(file_name),
         nama_asli = VALUES(nama_asli),
         ukuran = VALUES(ukuran),
         status = 'menunggu',
         catatan = NULL,
         uploaded_at = NOW(),
         verified_at = NULL`,
      [session.id, jenis.kode, filename, namaAsli, file.size]
    );

    if (existing?.file_name) {
      await unlink(path.join(BERKAS_DIR, path.basename(existing.file_name))).catch(
        () => {}
      );
    }

    return Response.json({ message: "Berkas berhasil diunggah." });
  } catch (error) {
    console.error("Berkas upload error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const jenis = getJenis(new URL(request.url).searchParams.get("jenis") ?? "");
    if (!jenis) {
      return Response.json({ message: "Jenis berkas tidak valid." }, { status: 400 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT status, file_name FROM berkas WHERE user_id = ? AND jenis = ?",
      [session.id, jenis.kode]
    );
    const existing = rows[0];

    if (!existing) {
      return Response.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
    }
    if (existing.status === "diterima") {
      return Response.json(
        { message: "Berkas yang sudah diverifikasi tidak dapat dihapus." },
        { status: 409 }
      );
    }

    await pool.execute("DELETE FROM berkas WHERE user_id = ? AND jenis = ?", [
      session.id,
      jenis.kode,
    ]);
    await unlink(path.join(BERKAS_DIR, path.basename(existing.file_name))).catch(
      () => {}
    );

    return Response.json({ message: "Berkas dihapus." });
  } catch (error) {
    console.error("Berkas delete error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}