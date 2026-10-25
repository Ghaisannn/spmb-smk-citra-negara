import { getCurrentSession } from "@/lib/auth";
import { HURUF } from "@/lib/cbt-config";
import { getPercobaanAktif, selesaikanPercobaan, simpanJawaban } from "@/lib/cbt";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const kiriman: Record<string, unknown> =
      body.jawaban && typeof body.jawaban === "object" ? body.jawaban : {};

    // Simpan jawaban terakhir dari browser (jika masih dalam batas waktu).
    const p = await getPercobaanAktif(session.id);
    if (p) {
      for (const [k, v] of Object.entries(kiriman)) {
        const soalId = Number(k);
        if (
          p.soalIds.includes(soalId) &&
          typeof v === "string" &&
          (HURUF as readonly string[]).includes(v)
        ) {
          await simpanJawaban(p.id, soalId, v);
        }
      }
    }

    await selesaikanPercobaan(session.id);
    return Response.json({ message: "Jawaban berhasil dikumpulkan." });
  } catch (error) {
    console.error("CBT selesai error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}