import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { JENIS_BERKAS, KODE_BERKAS, getJenis } from "@/lib/berkas-config";
import { notifyBatch } from "@/lib/notifikasi";
import { NOTIF_HREF, type NotifInput } from "@/lib/notifikasi-config";
import type { RowDataPacket } from "mysql2";

const DEFAULT_CATATAN =
  "Berkas perlu diperbaiki. Mohon unggah ulang berkas yang jelas dan sesuai ketentuan.";

const WAJIB = JENIS_BERKAS.filter((j) => j.wajib).map((j) => j.kode);

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return Response.json({ message: "Pendaftar tidak valid." }, { status: 400 });
    }

    const decisions: Record<string, unknown> =
      body.decisions && typeof body.decisions === "object" ? body.decisions : {};
    const entries = Object.entries(decisions).filter(
      ([k, v]) =>
        KODE_BERKAS.includes(k) && (v === "diterima" || v === "perlu_perbaikan")
    ) as [string, "diterima" | "perlu_perbaikan"][];

    if (entries.length === 0) {
      return Response.json({ message: "Tidak ada keputusan untuk disimpan." }, { status: 400 });
    }

    const catatan =
      (typeof body.catatan === "string" ? body.catatan.trim() : "").slice(0, 255) ||
      DEFAULT_CATATAN;

    const [u] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? AND role = 'calon_siswa'",
      [userId]
    );
    if (!u[0]) {
      return Response.json({ message: "Pendaftar tidak ditemukan." }, { status: 404 });
    }

    const state = await getBiodataState(userId);
    if (!state || state.status !== "terkirim") {
      return Response.json({ message: "Siswa belum mengirim formulir." }, { status: 400 });
    }

    const [ada] = await pool.query<RowDataPacket[]>(
      "SELECT jenis, status, catatan FROM berkas WHERE user_id = ?",
      [userId]
    );
    const sebelum = new Map(
      ada.map((r) => [
        r.jenis as string,
        { status: r.status as string, catatan: (r.catatan ?? "") as string },
      ])
    );
    const hilang = entries.filter(([k]) => !sebelum.has(k));
    if (hilang.length > 0) {
      return Response.json(
        { message: "Ada berkas yang belum diunggah siswa." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [jenis, status] of entries) {
        if (status === "diterima") {
          await conn.execute(
            `UPDATE berkas SET status = 'diterima', catatan = NULL, verified_at = NOW()
             WHERE user_id = ? AND jenis = ?`,
            [userId, jenis]
          );
        } else {
          await conn.execute(
            `UPDATE berkas SET status = 'perlu_perbaikan', catatan = ?, verified_at = NULL
             WHERE user_id = ? AND jenis = ?`,
            [catatan, userId, jenis]
          );
        }
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // ===== Notifikasi: hanya untuk yang benar-benar berubah =====
    const akhir = new Map<string, string>([...sebelum].map(([k, v]) => [k, v.status]));
    for (const [k, s] of entries) akhir.set(k, s);

    const okSebelum = WAJIB.filter((k) => sebelum.get(k)?.status === "diterima").length;
    const okSesudah = WAJIB.filter((k) => akhir.get(k) === "diterima").length;

    const baru: (NotifInput & { userId: number })[] = [];

    const diterimaBaru = entries
      .filter(([k, s]) => s === "diterima" && sebelum.get(k)?.status !== "diterima")
      .map(([k]) => getJenis(k)!.nama);

    if (diterimaBaru.length > 0) {
      baru.push({
        userId,
        jenis: "berkas",
        tone: "sukses",
        judul:
          diterimaBaru.length === 1
            ? `Berkas ${diterimaBaru[0]} diterima`
            : `${diterimaBaru.length} berkas diterima`,
        isi:
          diterimaBaru.length === 1
            ? "Dokumen Anda sudah diverifikasi dan dinyatakan sesuai oleh panitia."
            : `${diterimaBaru.join(", ")} dinyatakan sesuai oleh panitia.`,
        href: NOTIF_HREF.berkas,
      });
    }

    for (const [k, s] of entries) {
      const prev = sebelum.get(k);
      if (s === "perlu_perbaikan" && (prev?.status !== "perlu_perbaikan" || prev.catatan !== catatan)) {
        baru.push({
          userId,
          jenis: "berkas",
          tone: "bahaya",
          judul: `${getJenis(k)!.nama} perlu diperbaiki`,
          isi: `${catatan} Silakan unggah ulang berkas yang benar.`,
          href: NOTIF_HREF.berkas,
        });
      }
    }

    if (okSebelum < WAJIB.length && okSesudah >= WAJIB.length) {
      baru.push({
        userId,
        jenis: "berkas",
        tone: "sukses",
        judul: "Seluruh berkas wajib terverifikasi",
        isi: "Dokumen persyaratan Anda lengkap dan sah. Pantau jadwal ujian pada menu Jadwal & Tes.",
        href: NOTIF_HREF.jadwal,
      });
    }

    await notifyBatch(baru);

    return Response.json({ message: "Keputusan verifikasi tersimpan." });
  } catch (error) {
    console.error("Admin berkas error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}