import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import {
  ALL_FIELDS,
  emptyBiodata,
  localWa,
  type BiodataData,
} from "./biodata-schema";

export type BiodataState = {
  profile: { id: number; nama: string; email: string; nik: string };
  data: BiodataData;
  stepSelesai: number;
  status: "draft" | "terkirim";
  submittedAt: string | null;
};

export async function getBiodataState(userId: number): Promise<BiodataState | null> {
  const cols = ALL_FIELDS.map((f) =>
    f === "tanggal_lahir"
      ? "DATE_FORMAT(b.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir"
      : `b.${f}`
  ).join(", ");

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.nama, u.email, u.nik, u.whatsapp AS wa_akun,
            ${cols}, b.step_selesai, b.status, b.submitted_at
     FROM users u
     LEFT JOIN biodata b ON b.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );

  const r = rows[0];
  if (!r) return null;

  const data = emptyBiodata();
  for (const f of ALL_FIELDS) data[f] = r[f] ?? "";
  // WhatsApp otomatis terisi dari nomor saat daftar akun.
  if (!data.whatsapp && r.wa_akun) data.whatsapp = localWa(String(r.wa_akun));

  return {
    profile: {
      id: r.id,
      nama: r.nama,
      email: r.email,
      nik: r.nik ?? "",
    },
    data,
    stepSelesai: Number(r.step_selesai ?? 0),
    status: r.status === "terkirim" ? "terkirim" : "draft",
    submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : null,
  };
}