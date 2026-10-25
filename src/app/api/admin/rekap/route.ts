import { getCurrentSession } from "@/lib/auth";
import { listPendaftar, type Filter } from "@/lib/admin-data";
import { STATUS_LABEL, tglPendek } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { PROGRAM_ADMIN } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";

const FILTERS: Filter[] = ["semua", "biodata", "menunggu", "terverifikasi"];

// Cegah formula injection saat file dibuka di Excel.
function cell(v: string) {
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const f = sp.get("filter") as Filter;

  const { rows } = await listPendaftar({
    q: sp.get("q") ?? "",
    filter: FILTERS.includes(f) ? f : "semua",
    program: sp.get("program") ?? "",
    all: true,
  });

  const header = [
    "No. Registrasi",
    "Nama",
    "NIK",
    "NISN",
    "Asal Sekolah",
    "Program Keahlian",
    "Status",
    "Tanggal Daftar",
  ];

  const lines = rows.map((r) =>
    [
      nomorRegistrasi(r.id),
      r.nama,
      r.nik,
      r.nisn,
      r.namaSekolah,
      r.program ? PROGRAM_ADMIN[r.program as ProgramKode]?.singkat ?? r.program : "",
      STATUS_LABEL[r.status],
      tglPendek(r.createdAt),
    ]
      .map((v) => cell(String(v)))
      .join(";")
  );

  const csv = "\uFEFFsep=;\r\n" + [header.map(cell).join(";"), ...lines].join("\r\n");
  const tgl = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rekap-pendaftar-${tgl}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}