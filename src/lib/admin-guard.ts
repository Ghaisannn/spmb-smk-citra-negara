import { getCurrentSession } from "@/lib/auth";

export async function adminOnly() {
  const s = await getCurrentSession();
  return s && s.role === "admin" ? s : null;
}

export const unauthorized = () =>
  Response.json({ message: "Tidak diizinkan." }, { status: 401 });

export const bad = (message: string, status = 400) =>
  Response.json({ message }, { status });

export function serverError(tag: string, e: unknown) {
  console.error(tag, e);
  return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
}