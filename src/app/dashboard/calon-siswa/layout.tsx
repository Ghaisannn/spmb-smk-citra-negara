import DashboardFrame from "@/components/dashboard/DashboardFrame";
import { requireRole } from "@/lib/auth";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { getRingkasNotif } from "@/lib/notifikasi";

export default async function CalonSiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("calon_siswa");
  const notif = await getRingkasNotif(session.id, 10);

  return (
    <DashboardFrame nama={session.nama} noReg={nomorRegistrasi(session.id)} notif={notif}>
      {children}
    </DashboardFrame>
  );
}