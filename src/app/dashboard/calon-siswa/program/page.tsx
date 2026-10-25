import { redirect } from "next/navigation";
import ProgramPicker from "@/components/dashboard/ProgramPicker";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { getProgramKode } from "@/lib/program";

export const metadata = { title: "Program Keahlian | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";

export default async function ProgramPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);
  if (!state) redirect("/portal");

  const locked = state.status === "terkirim";
  if (!locked && state.stepSelesai < 3) {
    redirect(`${base}/biodata?step=${Math.min(state.stepSelesai + 1, 3)}`);
  }

  const saved = await getProgramKode(session.id);
  return <ProgramPicker saved={saved} locked={locked} />;
}