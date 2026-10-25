import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { MAX_FILE_MB, parseExcel, simpanSoal } from "@/lib/soal-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await adminOnly())) return unauthorized();

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return bad("Pilih file Excel (.xlsx) terlebih dahulu.");
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return bad(`Ukuran file maksimal ${MAX_FILE_MB} MB.`);
    }

    const buf = Buffer.from(await file.arrayBuffer());
    // File .xlsx adalah arsip ZIP (diawali "PK").
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return bad("Format file tidak dikenali. Gunakan file .xlsx (Excel 2007 ke atas), bukan .xls atau .csv.");
    }

    const parsed = await parseExcel(buf);

    if (!parsed.ok) {
      const n = parsed.errors.length;
      return Response.json(
        {
          message:
            parsed.fatal ??
            `${n} baris perlu diperbaiki. Belum ada soal yang diimpor. Perbaiki file lalu unggah ulang.`,
          errors: parsed.errors.slice(0, 50),
          totalErrors: n,
        },
        { status: 422 }
      );
    }

    const perKategori = await simpanSoal(parsed.rows);
    return Response.json(
      { message: `${parsed.rows.length} butir soal berhasil diimpor.`, perKategori },
      { status: 201 }
    );
  } catch (e) {
    return serverError("Soal import", e);
  }
}