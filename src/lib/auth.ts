import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const COOKIE_NAME = "spmb_session";

export type Role = "calon_siswa" | "admin" | "kepsek";

export type Session = {
  id: number;
  nama: string;
  role: Role;
};

export function dashboardPath(role: Role) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "kepsek") return "/dashboard/kepsek";
  return "/dashboard/calon-siswa";
}

export async function getSession(token?: string): Promise<Session | null> {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    const role = payload.role;
    if (role !== "calon_siswa" && role !== "admin" && role !== "kepsek") {
      return null;
    }

    return {
      id: Number(payload.sub),
      nama: String(payload.nama ?? ""),
      role,
    };
  } catch {
    return null;
  }
}

// Sesi dari cookie, lalu dicocokkan ke database:
// akun harus masih ada, aktif, dan rolenya tidak berubah.
export async function getCurrentSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const s = await getSession(token);
  if (!s) return null;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT nama, role, status FROM users WHERE id = ?",
      [s.id]
    );
    const u = rows[0];
    if (!u || u.status !== "aktif" || u.role !== s.role) return null;
    return { id: s.id, nama: u.nama, role: s.role };
  } catch {
    return null;
  }
}

// Dipakai di setiap halaman dashboard.
export async function requireRole(allowed: Role): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) redirect("/portal");
  if (session.role !== allowed) redirect(dashboardPath(session.role));
  return session;
}