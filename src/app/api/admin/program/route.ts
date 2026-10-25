import pool from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";
import { getKuota } from "@/lib/admin-data";
import { PROGRAM_ADMIN, SISWA_PER_ROMBEL } from "@/lib/program-admin";
import { PROGRAM_KODE, type ProgramKode } from "@/lib/program-data";

type Item = { kode: ProgramKode; rombel: number; kepala?: string };

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return Response.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const raw: unknown[] = Array.isArray(body.items) ? body.items : [];
    const items: Item[] = [];

    for (const r of raw) {
      const it = r as Record<string, unknown>;
      const kode = String(it.kode ?? "");
      const rombel = Number(it.rombel);
      if (!PROGRAM_KODE.includes(kode)) {
        return Response.json({ message: "Program tidak valid." }, { status: 400 });
      }
      if (!Number.isInteger(rombel) || rombel < 1 || rombel > 10) {
        return Response.json(
          { message: "Jumlah rombongan belajar harus 1 sampai 10." },
          { status: 400 }
        );
      }
      const item: Item = { kode: kode as ProgramKode, rombel };
      if (typeof it.kepala === "string") {
        const k = it.kepala.trim();
        if (k.length < 3 || k.length > 100) {
          return Response.json(
            { message: "Nama kepala program harus 3 sampai 100 karakter." },
            { status: 400 }
          );
        }
        item.kepala = k;
      }
      items.push(item);
    }

    if (items.length === 0) {
      return Response.json({ message: "Tidak ada data untuk disimpan." }, { status: 400 });
    }

    // Kuota tidak boleh lebih kecil dari jumlah pendaftar yang sudah memilih.
    const kuota = await getKuota();
    for (const it of items) {
      const terisi = kuota.find((k) => k.kode === it.kode)?.terisi ?? 0;
      if (it.rombel * SISWA_PER_ROMBEL < terisi) {
        return Response.json(
          {
            message: `Kuota ${PROGRAM_ADMIN[it.kode].singkat} tidak boleh lebih kecil dari jumlah pendaftar (${terisi} siswa).`,
          },
          { status: 409 }
        );
      }
    }

    for (const it of items) {
      const kepalaBaru = it.kepala !== undefined;
      await pool.execute(
        `INSERT INTO program_kuota (kode, rombel, kepala) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE rombel = VALUES(rombel)${
           kepalaBaru ? ", kepala = VALUES(kepala)" : ""
         }`,
        [it.kode, it.rombel, it.kepala ?? PROGRAM_ADMIN[it.kode].kepala]
      );
    }

    return Response.json({ message: "Kuota program tersimpan." });
  } catch (error) {
    console.error("Admin program error:", error);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}