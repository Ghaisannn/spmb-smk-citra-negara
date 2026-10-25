import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { mulaiPercobaan } from "@/lib/cbt";

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const state = await getBiodataState(session.id);
    if (!state || state.status !== "terkirim") {
      return Response.json({ message: "Kirim formulir biodata terlebih dahulu." }, { status: 400 });
    }

    const r = await mulaiPercobaan(session.id);
    if (!r.ok) return Response.json({ message: r.message }, { status: r.status });
    return Response.json({ message: "Ujian dimulai." });
  } catch (error) {
    console.error("CBT mulai error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}