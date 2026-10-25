import { unauthorized } from "@/lib/admin-guard";
import { JALUR } from "@/lib/admin-config";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { HASIL_KEPSEK, PROGRAM_LAPORAN } from "@/lib/kepsek-config";
import { getMatrix, listPenilaian } from "@/lib/kepsek-data";
import { kepsekOnly } from "@/lib/kepsek-guard";
import { PROGRAM_KODE, type ProgramKode } from "@/lib/program-data";

function cell(v: string) {
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await kepsekOnly())) return unauthorized();

  const sp = new URL(request.url).searchParams;
  const type = sp.get("type");
  const tgl = new Date().toISOString().slice(0, 10);
  let header: string[];
  let lines: string[][];
  let name: string;

  if (type === "laporan") {
    const m = await getMatrix();
    header = ["Kode", "Program Keahlian", "Pagu Total", "Pendaftar", "Lolos Administrasi", "Hadir CBT", "Usulan Diterima", "Cadangan", "Keketatan", "Sisa Kuota Gel. 2"];
    lines = m.map((r) => {
      const p = PROGRAM_LAPORAN[r.program as ProgramKode];
      return [
        p?.kode ?? r.program,
        p?.nama ?? r.program,
        String(r.pagu),
        String(r.pendaftar),
        String(r.lolosAdm),
        String(r.hadir),
        String(r.diterima),
        String(r.cadangan),
        r.diterima > 0 ? `1:${(r.pendaftar / r.diterima).toFixed(2)}` : "-",
        String(Math.max(r.pagu - r.diterima, 0)),
      ];
    });
    name = "laporan-penerimaan";
  } else {
    const program = PROGRAM_KODE.includes(sp.get("program") ?? "") ? (sp.get("program") as string) : "";
    const jalur = (JALUR as readonly string[]).includes(sp.get("jalur") ?? "") ? (sp.get("jalur") as string) : "";
    const { rows } = await listPenilaian({ program, jalur, q: sp.get("q") ?? "", all: true });
    header = ["No. Registrasi", "Nama", "Asal Sekolah", "Program", "Nilai CBT (Nilai Akhir)", "Status Kelulusan", "Jalur"];
    lines = rows.map((r) => [
      nomorRegistrasi(r.id),
      r.nama,
      r.sekolah,
      r.program ? (PROGRAM_LAPORAN[r.program as ProgramKode]?.tampil ?? r.program) : "",
      (r.skor ?? r.cbt) === null ? "" : (r.skor ?? r.cbt)!.toFixed(2),
      HASIL_KEPSEK[r.hasil],
      r.jalur,
    ]);
    name = "monitoring-seleksi";
  }

  const csv =
    "\uFEFFsep=;\r\n" +
    [header.map(cell).join(";"), ...lines.map((l) => l.map(cell).join(";"))].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${tgl}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}