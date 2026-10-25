import KepsekFrame from "@/components/kepsek/KepsekFrame";
import { requireRole } from "@/lib/auth";

export default async function KepsekLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("kepsek");
  return <KepsekFrame nama={session.nama}>{children}</KepsekFrame>;
}