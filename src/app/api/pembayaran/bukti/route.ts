import { readFile } from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

const DIR = path.join(process.cwd(), "storage", "bukti");

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  let userId = session.id;

  if (session.role === "admin") {
    // Admin boleh melihat bukti siswa lain: /api/pembayaran/bukti?user=12
    const q = Number(new URL(request.url).searchParams.get("user"));
    if (Number.isInteger(q) && q > 0) userId = q;
  } else if (session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT bukti_file FROM pembayaran WHERE user_id = ?",
      [userId]
    );
    const filename = rows[0]?.bukti_file as string | undefined;
    if (!filename) {
      return Response.json({ message: "Bukti tidak ditemukan." }, { status: 404 });
    }

    const safe = path.basename(filename);
    const ext = safe.split(".").pop() ?? "";
    const buf = await readFile(path.join(DIR, safe));

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ message: "Bukti tidak ditemukan." }, { status: 404 });
  }
}