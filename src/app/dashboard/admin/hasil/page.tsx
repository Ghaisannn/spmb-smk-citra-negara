import HasilBoard from "@/components/admin/HasilBoard";
import { requireRole } from "@/lib/auth";
import { getHasilCounts, listHasil } from "@/lib/hasil-admin";
import { JALUR } from "@/lib/admin-config";
import { PROGRAM_KODE } from "@/lib/program-data";

export const metadata = { title: "Hasil Seleksi | SMK Citra Negara" };

const TABS = ["semua", "diterima", "cadangan", "tidak_diterima"];

export default async function HasilAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; program?: string; jalur?: string; tab?: string; page?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;

  const filters = {
    q: (sp.q ?? "").slice(0, 100),
    program: PROGRAM_KODE.includes(sp.program ?? "") ? (sp.program as string) : "",
    jalur: (JALUR as readonly string[]).includes(sp.jalur ?? "") ? (sp.jalur as string) : "",
    tab: TABS.includes(sp.tab ?? "") ? (sp.tab as string) : "semua",
  };
  const page = Math.max(Number(sp.page) || 1, 1);

  const [list, counts] = await Promise.all([
    listHasil({ ...filters, page, perPage: 7 }),
    getHasilCounts(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <HasilBoard
        rows={list.rows}
        counts={counts}
        total={list.total}
        page={list.page}
        perPage={list.perPage}
        filters={filters}
      />
    </div>
  );
}