import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import {
  ALL_FIELDS,
  MAX_LEN,
  localWa,
  validateStep,
  type FieldName,
} from "@/lib/biodata-schema";

function toDb(field: FieldName, value: string) {
  if (value === "") return null;
  if (field === "tanggal_lahir" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }
  const state = await getBiodataState(session.id);
  return Response.json(state);
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const step: 1 | 2 | 3 | null =
      body.step === 1 || body.step === 2 || body.step === 3 ? body.step : null;
    const incoming: Record<string, unknown> =
      body.data && typeof body.data === "object" ? body.data : {};

    const state = await getBiodataState(session.id);
    if (!state) {
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }
    if (state.status === "terkirim") {
      return Response.json(
        { message: "Formulir sudah dikirim dan tidak dapat diubah." },
        { status: 409 }
      );
    }

    const merged = { ...state.data };
    for (const f of ALL_FIELDS) {
      const v = incoming[f];
      if (typeof v === "string") merged[f] = v.trim().slice(0, MAX_LEN[f]);
    }
    merged.whatsapp = localWa(merged.whatsapp);
    merged.whatsapp_ortu = localWa(merged.whatsapp_ortu);

    if (step) {
      const errors = validateStep(step, merged);
      if (Object.keys(errors).length > 0) {
        return Response.json(
          { message: "Periksa kembali data yang diisi.", errors },
          { status: 422 }
        );
      }
    }

    const cols = ALL_FIELDS.join(", ");
    const marks = ALL_FIELDS.map(() => "?").join(", ");
    const updates = ALL_FIELDS.map((f) => `${f} = VALUES(${f})`).join(", ");
    const values = ALL_FIELDS.map((f) => toDb(f, merged[f]));

    await pool.execute(
      `INSERT INTO biodata (user_id, ${cols}, step_selesai)
       VALUES (?, ${marks}, ?)
       ON DUPLICATE KEY UPDATE ${updates},
         step_selesai = GREATEST(step_selesai, VALUES(step_selesai))`,
      [session.id, ...values, step ?? 0]
    );

    return Response.json({ message: "Tersimpan." });
  } catch (error) {
    console.error("Biodata save error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}