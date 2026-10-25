import { redirect } from "next/navigation";
import CbtExam from "@/components/dashboard/CbtExam";
import { requireRole } from "@/lib/auth";
import { getPercobaan, getSesiById, getSoalUjian } from "@/lib/cbt";

export const metadata = { title: "Ujian CBT | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";

export default async function UjianPage() {
  const session = await requireRole("calon_siswa");
  const p = await getPercobaan(session.id);
  if (!p || p.status !== "berjalan") redirect(`${base}/jadwal`);

  const [soal, sesi] = await Promise.all([getSoalUjian(p), getSesiById(p.sesiId)]);
  if (soal.length === 0) redirect(`${base}/jadwal`);

  return (
    <CbtExam
      judul={sesi?.nama ?? "Tes Kemampuan Dasar & Pemetaan Minat Bakat (CBT)"}
      soal={soal}
      sisaDetik={p.sisaDetik}
    />
  );
}