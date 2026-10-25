import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { LOKASI_ONLINE, isValidDate } from "@/lib/admin-config";
import type { RowDataPacket } from "mysql2";

const JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function parse(b: Record<string, unknown>) {
  const nama = str(b.nama);
  const gelombang = Number(b.gelombang);
  const tanggal = str(b.tanggal);
  const mulai = str(b.mulai);
  const selesai = str(b.selesai);
  const kuota = Number(b.kuota);
  const pengawas = str(b.pengawas);
  const durasi = b.durasi === undefined || b.durasi === "" ? 120 : Number(b.durasi);
  const jumlahSoal = b.jumlahSoal === undefined || b.jumlahSoal === "" ? 50 : Number(b.jumlahSoal);

  if (nama.length < 3 || nama.length > 150) return "Nama tes harus 3 sampai 150 karakter.";
  if (gelombang !== 1 && gelombang !== 2) return "Gelombang tidak valid.";
  if (!isValidDate(tanggal)) return "Tanggal pelaksanaan tidak valid.";
  if (!JAM.test(mulai) || !JAM.test(selesai)) return "Format waktu tidak valid.";
  if (selesai <= mulai) return "Waktu selesai harus setelah waktu mulai.";
  if (!Number.isInteger(kuota) || kuota < 1 || kuota > 1000) return "Kuota peserta harus 1 sampai 1000.";
  if (pengawas.length > 255) return "Nama proktor terlalu panjang.";
  if (!Number.isInteger(durasi) || durasi < 10 || durasi > 300) return "Durasi ujian harus 10 sampai 300 menit.";
  if (!Number.isInteger(jumlahSoal) || jumlahSoal < 1 || jumlahSoal > 200) return "Jumlah soal harus 1 sampai 200.";

  return { nama, gelombang, tanggal, mulai, selesai, kuota, durasi, jumlahSoal, pengawas: pengawas || null };
}

export async function POST(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const v = parse(await request.json());
    if (typeof v === "string") return bad(v);

    await pool.execute(
      `INSERT INTO jadwal_tes
        (nama, gelombang, tipe, tanggal, mulai, selesai, lokasi, kuota, pengawas, durasi_menit, jumlah_soal)
       VALUES (?, ?, 'cbt', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.nama, v.gelombang, v.tanggal, v.mulai, v.selesai, LOKASI_ONLINE, v.kuota, v.pengawas, v.durasi, v.jumlahSoal]
    );
    return Response.json({ message: "Jadwal seleksi berhasil ditambahkan." }, { status: 201 });
  } catch (e) {
    return serverError("Jadwal create", e);
  }
}

export async function PUT(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return bad("Jadwal tidak valid.");
    const v = parse(body);
    if (typeof v === "string") return bad(v);

    const [cur] = await pool.query<RowDataPacket[]>(
      `SELECT durasi_menit, jumlah_soal,
              (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = jadwal_tes.id) AS n
       FROM jadwal_tes WHERE id = ?`,
      [id]
    );
    if (!cur[0]) return bad("Jadwal tidak ditemukan.", 404);

    // Durasi dan jumlah soal dikunci setelah ada peserta.
    if (Number(cur[0].n) > 0) {
      v.durasi = Number(cur[0].durasi_menit);
      v.jumlahSoal = Number(cur[0].jumlah_soal);
    }

    await pool.execute(
      `UPDATE jadwal_tes SET nama=?, gelombang=?, tipe='cbt', tanggal=?, mulai=?, selesai=?,
         lokasi=?, kuota=?, pengawas=?, durasi_menit=?, jumlah_soal=? WHERE id = ?`,
      [v.nama, v.gelombang, v.tanggal, v.mulai, v.selesai, LOKASI_ONLINE, v.kuota, v.pengawas, v.durasi, v.jumlahSoal, id]
    );
    return Response.json({ message: "Jadwal seleksi diperbarui." });
  } catch (e) {
    return serverError("Jadwal update", e);
  }
}

export async function DELETE(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return bad("Jadwal tidak valid.");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cbt_status,
              (SELECT COUNT(*) FROM cbt_percobaan c WHERE c.sesi_id = jadwal_tes.id) AS n
       FROM jadwal_tes WHERE id = ?`,
      [id]
    );
    if (!rows[0]) return bad("Jadwal tidak ditemukan.", 404);
    if (rows[0].cbt_status === "dibuka") return bad("Tutup sesi CBT terlebih dahulu sebelum menghapus.", 409);
    if (Number(rows[0].n) > 0) return bad("Jadwal ini sudah memiliki peserta ujian dan tidak dapat dihapus.", 409);

    await pool.execute("DELETE FROM jadwal_tes WHERE id = ?", [id]);
    return Response.json({ message: "Jadwal dihapus." });
  } catch (e) {
    return serverError("Jadwal delete", e);
  }
}