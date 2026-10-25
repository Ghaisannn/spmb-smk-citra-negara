import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { BIAYA_PENDAFTARAN } from "./pembayaran-config";

export type StatusBayar =
  | "belum_bayar"
  | "menunggu_verifikasi"
  | "lunas"
  | "ditolak";

export type Pembayaran = {
  jumlah: number;
  status: StatusBayar;
  bankPengirim: string;
  namaPengirim: string;
  adaBukti: boolean;
  catatan: string;
  paidAt: string | null;
  verifiedAt: string | null;
};

export async function getPembayaran(userId: number): Promise<Pembayaran> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT jumlah, bank_pengirim, nama_pengirim, bukti_file, status,
            catatan, paid_at, verified_at
     FROM pembayaran WHERE user_id = ?`,
    [userId]
  );

  const r = rows[0];
  if (!r) {
    return {
      jumlah: BIAYA_PENDAFTARAN,
      status: "belum_bayar",
      bankPengirim: "",
      namaPengirim: "",
      adaBukti: false,
      catatan: "",
      paidAt: null,
      verifiedAt: null,
    };
  }

  return {
    jumlah: Number(r.jumlah),
    status: r.status as StatusBayar,
    bankPengirim: r.bank_pengirim ?? "",
    namaPengirim: r.nama_pengirim ?? "",
    adaBukti: Boolean(r.bukti_file),
    catatan: r.catatan ?? "",
    paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
    verifiedAt: r.verified_at ? new Date(r.verified_at).toISOString() : null,
  };
}