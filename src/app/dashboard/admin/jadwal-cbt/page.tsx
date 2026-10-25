import BankSoal from "@/components/admin/BankSoal";
import CbtControl from "@/components/admin/CbtControl";
import JadwalManager from "@/components/admin/JadwalManager";
import { requireRole } from "@/lib/auth";
import { PASSING_GRADE, todayWib } from "@/lib/admin-config";
import { countSoalAktif } from "@/lib/cbt";
import { countPeserta, getJadwalList } from "@/lib/jadwal-admin";
import { getSoalAll } from "@/lib/soal";

export const metadata = { title: "Jadwal Tes & Bank Soal CBT | SMK Citra Negara" };

export default async function JadwalCbtPage() {
  await requireRole("admin");
  const [rows, peserta, soal, aktif] = await Promise.all([
    getJadwalList(),
    countPeserta(),
    getSoalAll(),
    countSoalAktif(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-14">
      <JadwalManager rows={rows} peserta={peserta} hariIni={todayWib()} />
      <div className="space-y-8">
        <CbtControl sesi={rows.filter((r) => r.tipe === "cbt")} soalAktif={aktif} />
        <BankSoal items={soal} passingGrade={PASSING_GRADE} />
      </div>
    </div>
  );
}