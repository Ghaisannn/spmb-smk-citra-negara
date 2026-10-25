import { getCurrentSession } from "@/lib/auth";

export async function kepsekOnly() {
  const s = await getCurrentSession();
  return s && s.role === "kepsek" ? s : null;
}