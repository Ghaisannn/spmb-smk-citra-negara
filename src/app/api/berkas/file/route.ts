import { readFile } from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getJenis } from "@/lib/berkas-config";
import { BERKAS_DIR, MIME } from "@/lib/berkas-files";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  const url = new URL(request.url);
  const jenis = getJenis(url.searchParams.get("jenis") ?? "");
  if (!jenis) {
    return Response.json({ message: "Jenis berkas tidak valid." }, { status: 400 });
  }

  let userId = session.id;
  if (session.role === "admin") {
    // Admin boleh melihat berkas siswa lain: ?jenis=kk&user=12
    const q = Number(url.searchParams.get("user"));
    if (Number.isInteger(q) && q > 0) userId = q;
  } else if (session.role !== "calon_siswa") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 403 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT file_name FROM berkas WHERE user_id = ? AND jenis = ?",
      [userId, jenis.kode]
    );
    const filename = rows[0]?.file_name as string | undefined;
    if (!filename) {
      return Response.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
    }

    const safe = path.basename(filename);
    const ext = safe.split(".").pop() ?? "";
    const buf = await readFile(path.join(BERKAS_DIR, safe));

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
  }
}