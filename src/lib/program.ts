import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { PROGRAM_KODE, type ProgramKode } from "./program-data";

export async function getProgramKode(userId: number): Promise<ProgramKode | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT program FROM pilihan_program WHERE user_id = ?",
    [userId]
  );
  const p = rows[0]?.program as string | undefined;
  return p && PROGRAM_KODE.includes(p) ? (p as ProgramKode) : null;
}