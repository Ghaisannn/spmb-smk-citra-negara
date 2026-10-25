import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { PROGRAM_KODE } from "@/lib/program-data";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const program = typeof body.program === "string" ? body.program : "";

    if (!PROGRAM_KODE.includes(program)) {
      return Response.json({ message: "Program keahlian tidak valid." }, { status: 400 });
    }

    const state = await getBiodataState(session.id);
    if (!state) {
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }
    if (state.status === "terkirim") {
      return Response.json(
        { message: "Formulir sudah dikirim, pilihan program tidak dapat diubah." },
        { status: 409 }
      );
    }
    if (state.stepSelesai < 3) {
      return Response.json(
        { message: "Lengkapi biodata Tahap 1 sampai 3 terlebih dahulu." },
        { status: 400 }
      );
    }

    await pool.execute(
      `INSERT INTO pilihan_program (user_id, program) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE program = VALUES(program)`,
      [session.id, program]
    );

    return Response.json({ message: "Pilihan program tersimpan." });
  } catch (error) {
    console.error("Program save error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}