import { getCurrentSession } from "@/lib/auth";
import { HURUF } from "@/lib/cbt-config";
import { getPercobaanAktif, simpanJawaban } from "@/lib/cbt";

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const soalId = Number(body.soalId);
    const jawaban = body.jawaban === null ? null : String(body.jawaban);

    if (!Number.isInteger(soalId) || soalId <= 0) {
      return Response.json({ message: "Soal tidak valid." }, { status: 400 });
    }
    if (jawaban !== null && !(HURUF as readonly string[]).includes(jawaban)) {
      return Response.json({ message: "Jawaban tidak valid." }, { status: 400 });
    }

    const p = await getPercobaanAktif(session.id);
    if (!p) {
      return Response.json({ message: "Waktu ujian sudah habis atau ujian telah selesai." }, { status: 409 });
    }
    if (!p.soalIds.includes(soalId)) {
      return Response.json({ message: "Soal tidak termasuk dalam ujian Anda." }, { status: 400 });
    }

    await simpanJawaban(p.id, soalId, jawaban);
    return Response.json({ message: "Tersimpan." });
  } catch (error) {
    console.error("CBT jawab error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}