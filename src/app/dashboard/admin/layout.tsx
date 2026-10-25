import AdminFrame from "@/components/admin/AdminFrame";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <AdminFrame>{children}</AdminFrame>;
}