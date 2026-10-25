import pool from "@/lib/db";
import { adminOnly, bad, serverError, unauthorized } from "@/lib/admin-guard";
import { countSoalAktif, getPesertaSesi, resetPercobaan, tutupSesi } from "@/lib/cbt";
import { idsBelumCbt, notifyMany } from "@/lib/notifikasi";
import { NOTIF_HREF } from "@/lib/notifikasi-config";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  if (!(await adminOnly())) return unauthorized();
  try {
    const id = Number(new URL(request.url).searchParams.get("sesi"));
    if (!Number.isInteger(id) || id <= 0) return bad("Sesi tidak valid.");
    return Response.json({ peserta: await getPesertaSesi(id) });
  } catch (e) {
    return serverError("Admin CBT get", e);
  }
}

export async function PATCH(request: Request) {
  if (!(await adminOnly())) return unauthorized();

  try {
    const b = await request.json();

    if (b.action === "reset") {
      const userId = Number(b.userId);
      if (!Number.isInteger(userId) || userId <= 0) return bad("Peserta tidak valid.");
      await resetPercobaan(userId);
      return Response.json({ message: "Percobaan peserta direset. Siswa dapat mengerjakan ulang." });
    }

    const sesiId = Number(b.sesiId);
    if (!Number.isInteger(sesiId) || sesiId <= 0) return bad("Sesi tidak valid.");

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nama, tipe, cbt_status, jumlah_soal, durasi_menit FROM jadwal_tes WHERE id = ?",
      [sesiId]
    );
    const s = rows[0];
    if (!s) return bad("Jadwal tidak ditemukan.", 404);
    if (s.tipe !== "cbt") return bad("Hanya sesi bertipe Tes CBT yang dapat dibuka.");

    if (b.action === "buka") {
      if (s.cbt_status === "dibuka") return bad("Sesi ini sudah dibuka.", 409);

      const [lain] = await pool.query<RowDataPacket[]>(
        "SELECT nama FROM jadwal_tes WHERE cbt_status = 'dibuka' AND id <> ? LIMIT 1",
        [sesiId]
      );
      if (lain[0]) {
        return bad(`Tutup sesi "${lain[0].nama}" terlebih dahulu. Hanya satu sesi CBT yang boleh dibuka.`, 409);
      }

      const aktif = await countSoalAktif();
      if (aktif < Number(s.jumlah_soal)) {
        return bad(
          `Butir soal aktif baru ${aktif} dari ${s.jumlah_soal} yang dibutuhkan. Tambah soal di Bank Soal atau kurangi jumlah soal sesi.`,
          409
        );
      }

      await pool.execute("UPDATE jadwal_tes SET cbt_status = 'dibuka' WHERE id = ?", [sesiId]);

      const penerima = await idsBelumCbt();
      await notifyMany(penerima, {
        jenis: "cbt",
        tone: "tindakan",
        judul: "Sesi ujian CBT telah dibuka",
        isi: `${s.nama} sudah bisa dikerjakan: ${s.jumlah_soal} soal dalam ${s.durasi_menit} menit. Pastikan koneksi stabil, lalu mulai sekarang.`,
        href: NOTIF_HREF.jadwal,
      });

      return Response.json({
        message: `Sesi CBT dibuka. Siswa kini dapat memulai tes (${penerima.length} siswa diberi notifikasi).`,
      });
    }

    if (b.action === "tutup") {
      if (s.cbt_status !== "dibuka") return bad("Sesi ini tidak sedang dibuka.", 409);
      const n = await tutupSesi(sesiId);
      return Response.json({
        message: n > 0 ? `Sesi CBT ditutup. ${n} peserta yang masih mengerjakan dikumpulkan otomatis.` : "Sesi CBT ditutup.",
      });
    }

    return bad("Aksi tidak valid.");
  } catch (e) {
    return serverError("Admin CBT patch", e);
  }
}