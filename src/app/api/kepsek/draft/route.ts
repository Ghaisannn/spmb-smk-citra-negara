import pool from "@/lib/db";
import { bad, serverError, unauthorized } from "@/lib/admin-guard";
import { isValidDate } from "@/lib/admin-config";
import { kepsekOnly } from "@/lib/kepsek-guard";
import type { RowDataPacket } from "mysql2";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function PUT(request: Request) {
  if (!(await kepsekOnly())) return unauthorized();

  try {
    const b = await request.json();
    const judul = str(b.judul);
    const nomor = str(b.nomor);
    const tanggal = str(b.tanggal);
    const sambutan = str(b.sambutan);

    if (judul.length < 10 || judul.length > 150) return bad("Judul harus 10 sampai 150 karakter.");
    if (nomor.length < 5 || nomor.length > 60) return bad("Nomor surat harus 5 sampai 60 karakter.");
    if (!isValidDate(tanggal)) return bad("Tanggal publikasi tidak valid.");
    if (sambutan.length < 10 || sambutan.length > 1000) return bad("Pesan sambutan harus 10 sampai 1000 karakter.");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT judul, nomor_surat, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, sambutan, versi, status
       FROM draft_sk WHERE id = 1`
    );
    const cur = rows[0];
    if (!cur) return bad("Draf belum disiapkan. Jalankan database/kepsek.sql.", 500);
    if (cur.status === "terbit") return bad("Surat sudah dipublikasikan dan tidak dapat diubah.", 409);

    const diff: string[] = [];
    if (cur.judul !== judul) diff.push("Judul");
    if (cur.nomor_surat !== nomor) diff.push("Nomor Surat");
    if (cur.tanggal !== tanggal) diff.push("Tanggal Publikasi");
    if (cur.sambutan !== sambutan) diff.push("Pesan Sambutan");
    if (diff.length === 0) return Response.json({ message: "Tidak ada perubahan pada draf.", changed: false });

    const versi = Number(cur.versi) + 1;
    await pool.execute(
      "UPDATE draft_sk SET judul = ?, nomor_surat = ?, tanggal = ?, sambutan = ?, versi = ? WHERE id = 1",
      [judul, nomor, tanggal, sambutan, versi]
    );
    await pool.execute(
      "INSERT INTO kepsek_log (jenis, judul, detail) VALUES ('pengumuman', ?, ?)",
      [`Pembaruan Draf v${versi}.0`, `Perubahan pada: ${diff.join(", ")}.`]
    );

    return Response.json({ message: `Draf tersimpan sebagai v${versi}.0.`, changed: true });
  } catch (e) {
    return serverError("Kepsek draft", e);
  }
}