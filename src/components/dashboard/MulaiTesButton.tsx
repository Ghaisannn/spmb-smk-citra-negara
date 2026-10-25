"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, ListChecks, TriangleAlert } from "lucide-react";
import Modal from "@/components/admin/Modal";

export type ModeTes = "mulai" | "lanjut" | "selesai" | "tunggu" | "ditutup" | "penuh" | "kosong";

const LABEL: Record<ModeTes, string> = {
  mulai: "Mulai Tes Sekarang",
  lanjut: "Lanjutkan Ujian",
  selesai: "Ujian Sudah Dikerjakan",
  tunggu: "Menunggu Sesi Dibuka",
  ditutup: "Sesi Telah Ditutup",
  penuh: "Kuota Sesi Penuh",
  kosong: "Belum Ada Jadwal CBT",
};

const UJIAN = "/dashboard/calon-siswa/jadwal/ujian";

export default function MulaiTesButton({
  mode,
  jumlahSoal,
  durasi,
}: {
  mode: ModeTes;
  jumlahSoal: number;
  durasi: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aktif = mode === "mulai" || mode === "lanjut";

  const mulai = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/cbt/mulai", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal memulai ujian.");
      router.push(UJIAN);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={!aktif}
        onClick={() => (mode === "lanjut" ? router.push(UJIAN) : setOpen(true))}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {LABEL[mode]}
        {aktif && <ArrowRight size={16} />}
      </button>

      {open && (
        <Modal title="Mulai Ujian CBT?" subtitle="Baca ketentuan berikut sebelum melanjutkan." onClose={() => !loading && setOpen(false)}>
          <ul className="space-y-3 text-[13.5px] text-ink/85">
            <li className="flex gap-3 rounded-lg bg-wash p-3">
              <ListChecks size={18} className="mt-0.5 shrink-0 text-forest" />
              <span><b>{jumlahSoal} soal</b> pilihan ganda (A sampai E) yang diacak khusus untuk Anda.</span>
            </li>
            <li className="flex gap-3 rounded-lg bg-wash p-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-forest" />
              <span>Waktu <b>{durasi} menit</b>. Timer langsung berjalan dan <b>tidak bisa dijeda</b>, bahkan jika halaman ditutup.</span>
            </li>
            <li className="flex gap-3 rounded-lg bg-[#fff1b8] p-3 text-[#8a5a00]">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>Ujian hanya dapat dikerjakan <b>satu kali</b>. Pastikan koneksi internet stabil.</span>
            </li>
          </ul>

          {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={loading} onClick={() => setOpen(false)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">
              Batal
            </button>
            <button type="button" disabled={loading} onClick={mulai} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {loading ? "Menyiapkan soal..." : "Ya, Mulai Sekarang"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}