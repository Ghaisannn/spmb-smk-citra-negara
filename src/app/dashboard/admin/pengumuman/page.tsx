import PengumumanManager from "@/components/admin/PengumumanManager";
import { requireRole } from "@/lib/auth";
import { todayWib } from "@/lib/admin-config";
import { getPengumumanAdmin } from "@/lib/pengumuman";

export const metadata = { title: "Pengumuman | SMK Citra Negara" };

export default async function PengumumanAdminPage() {
  await requireRole("admin");
  const items = await getPengumumanAdmin();

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <PengumumanManager items={items} hariIni={todayWib()} />
    </div>
  );
}