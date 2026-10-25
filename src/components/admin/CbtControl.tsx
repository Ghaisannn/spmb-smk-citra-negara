"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Laptop, Play, Square, TriangleAlert } from "lucide-react";
import CbtMonitor from "./CbtMonitor";
import { cbtCall } from "./cbt-client";
import { hariTanggal } from "@/lib/admin-config";
import type { JadwalRow } from "@/lib/jadwal-admin";

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

const CHIP = {
  dibuka: { t: "Sedang Dibuka", c: "bg-chip text-forest", d: "bg-forest animate-pulse" },
  tertutup: { t: "Belum Dibuka", c: "bg-pastel text-ink/70", d: "bg-ink/40" },
  ditutup: { t: "Sudah Ditutup", c: "bg-pastel text-ink/55", d: "bg-ink/30" },
} as const;

export default function CbtControl({
  sesi,
  soalAktif,
}: {
  sesi: JadwalRow[];
  soalAktif: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mon, setMon] = useState<{ id: number; nama: string } | null>(null);

  const dibuka = sesi.find((s) => s.cbtStatus === "dibuka");

  const toggle = async (s: JadwalRow) => {
    const tutup = s.cbtStatus === "dibuka";
    if (tutup && !window.confirm("Tutup sesi CBT? Peserta yang masih mengerjakan akan otomatis dikumpulkan.")) return;
    setBusy(s.id);
    setMsg(null);
    try {
      const r = await cbtCall({ action: tutup ? "tutup" : "buka", sesiId: s.id });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={`${card} p-5 sm:p-6 print:hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-chip text-forest">
            <Laptop size={20} />
          </span>
          <div>
            <h2 className="text-[20px] font-medium leading-tight text-ink">Kontrol Ujian CBT</h2>
            <p className="text-[12.5px] text-ink/65">
              Buka sesi agar siswa dapat memulai tes. Nilai masuk otomatis ke menu Hasil Seleksi.
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${dibuka ? "bg-chip text-forest" : "bg-pastel text-ink/70"}`}>
          <span className={`size-1.5 rounded-full ${dibuka ? "bg-forest animate-pulse" : "bg-ink/40"}`} />
          {dibuka ? "Ada Sesi yang Sedang Dibuka" : "Tidak Ada Sesi Dibuka"}
        </span>
      </div>

      <p className="mt-4 rounded-lg bg-wash px-4 py-2.5 text-[13px] text-ink/80">
        Bank soal aktif: <b className="text-forest">{soalAktif} butir</b> (soal diacak untuk tiap siswa, tiap sesi memakai jumlah soal sesuai pengaturan jadwal).
      </p>

      {msg && (
        <p className={`mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-[13px] ${msg.ok ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"}`}>
          {!msg.ok && <TriangleAlert size={16} className="mt-0.5 shrink-0" />}
          {msg.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {sesi.length === 0 && (
          <p className="rounded-lg bg-wash p-6 text-center text-[13.5px] text-ink/60">
            Belum ada jadwal bertipe Tes CBT. Buat di form Tambah Jadwal Seleksi di atas.
          </p>
        )}
        {sesi.map((s) => {
          const chip = CHIP[s.cbtStatus];
          const siap = soalAktif >= s.jumlahSoal;
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-wash p-4">
              <div className="min-w-[220px] flex-1">
                <p className="text-[14.5px] font-medium leading-snug text-ink">{s.nama}</p>
                <p className="mt-0.5 text-[12px] text-ink/65">
                  {hariTanggal(s.tanggal)} • {s.mulai.replace(":", ".")} - {s.selesai.replace(":", ".")} WIB • Online
                </p>
                <p className="mt-0.5 text-[12px] text-ink/65">
                  {s.jumlahSoal} soal • {s.durasi} menit • {s.nJalan} mengerjakan • {s.nSelesai} selesai
                  {!siap && s.cbtStatus !== "dibuka" && (
                    <span className="ml-2 font-semibold text-[#c00000]">Soal aktif belum cukup</span>
                  )}
                </p>
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${chip.c}`}>
                <span className={`size-1.5 rounded-full ${chip.d}`} />
                {chip.t}
              </span>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMon({ id: s.id, nama: s.nama })}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-3.5 text-[13px] font-semibold text-forest shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:bg-chip"
                >
                  <Eye size={15} />
                  Monitoring
                </button>
                <button
                  type="button"
                  disabled={busy === s.id}
                  onClick={() => toggle(s)}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold text-white transition disabled:opacity-60 ${
                    s.cbtStatus === "dibuka" ? "bg-[#c00000] hover:opacity-90" : "bg-forest hover:bg-brand-800"
                  }`}
                >
                  {s.cbtStatus === "dibuka" ? <Square size={14} /> : <Play size={14} />}
                  {busy === s.id ? "Memproses..." : s.cbtStatus === "dibuka" ? "Tutup CBT" : s.cbtStatus === "ditutup" ? "Buka Kembali" : "Buka CBT Sekarang"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {mon && <CbtMonitor sesi={mon} onClose={() => setMon(null)} />}
    </section>
  );
}