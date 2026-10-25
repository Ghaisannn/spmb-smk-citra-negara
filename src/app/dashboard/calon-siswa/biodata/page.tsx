import { redirect } from "next/navigation";
import BiodataWizard from "@/components/dashboard/BiodataWizard";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";

export const metadata = { title: "Biodata | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";

export default async function BiodataPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await requireRole("calon_siswa");
  const { step } = await searchParams;

  const state = await getBiodataState(session.id);
  if (!state) redirect("/portal");
  if (state.status === "terkirim") redirect(`${base}/biodata/review`);

  // Tahap tidak bisa dilompati: maksimal satu tahap setelah yang sudah selesai.
  const maxStep = Math.min(state.stepSelesai + 1, 3);
  const requested = Number(step);
  const initialStep = ([1, 2, 3].includes(requested)
    ? Math.min(requested, maxStep)
    : maxStep) as 1 | 2 | 3;

  return (
    <BiodataWizard
      initial={state.data}
      nama={state.profile.nama}
      nik={state.profile.nik}
      email={state.profile.email}
      initialStep={initialStep}
    />
  );
}