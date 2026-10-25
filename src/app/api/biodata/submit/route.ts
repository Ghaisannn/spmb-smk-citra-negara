import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { validateStep } from "@/lib/biodata-schema";
import { notifyBatch } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";
import { BIAYA_PENDAFTARAN, formatRupiah } from "@/lib/pembayaran-config";
import { getProgramKode } from "@/lib/program";

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const state = await getBiodataState(session.id);
    if (!state) {
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }
    if (state.status === "terkirim") {
      return Response.json({ message: "Formulir sudah pernah dikirim." }, { status: 409 });
    }
    if (state.stepSelesai < 3) {
      return Response.json(
        { message: "Lengkapi semua tahap biodata terlebih dahulu." },
        { status: 400 }
      );
    }

    for (const step of [1, 2, 3] as const) {
      if (Object.keys(validateStep(step, state.data)).length > 0) {
        return Response.json(
          { message: `Data pada Tahap ${step} belum lengkap atau tidak valid.` },
          { status: 422 }
        );
      }
    }

    if (!(await getProgramKode(session.id))) {
      return Response.json(
        { message: "Pilih program keahlian terlebih dahulu sebelum mengirim formulir." },
        { status: 400 }
      );
    }

    await pool.execute(
      "UPDATE biodata SET status = 'terkirim', submitted_at = NOW() WHERE user_id = ?",
      [session.id]
    );

    // Urutan: yang terakhir dibuat tampil paling atas.
    await notifyBatch([
      {
        userId: session.id,
        jenis: "formulir",
        tone: "sukses",
        judul: "Formulir pendaftaran berhasil dikirim",
        isi: "Data Anda sudah terkunci dan masuk antrean verifikasi panitia SPMB.",
        href: NOTIF_HREF.formulir,
      },
      {
        userId: session.id,
        jenis: "berkas",
        tone: "info",
        judul: "Unggah berkas persyaratan",
        isi: "Siapkan dan unggah 5 berkas wajib: KK, Akta Kelahiran, Ijazah/SKL, Pas Foto 3x4, dan Rapor Semester 1–5.",
        href: NOTIF_HREF.berkas,
      },
      {
        userId: session.id,
        jenis: "pembayaran",
        tone: "tindakan",
        judul: "Selesaikan pembayaran pendaftaran",
        isi: `Transfer biaya pendaftaran ${formatRupiah(BIAYA_PENDAFTARAN)} lalu unggah bukti transfer agar berkas dapat diproses.`,
        href: NOTIF_HREF.pembayaran,
      },
    ]);

    return Response.json({ message: "Formulir pendaftaran berhasil dikirim." });
  } catch (error) {
    console.error("Biodata submit error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}