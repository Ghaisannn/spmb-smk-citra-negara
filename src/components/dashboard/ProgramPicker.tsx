"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Circle,
  CircleCheck,
  GraduationCap,
  Lightbulb,
  Lock,
} from "lucide-react";
import { PROGRAM, getProgramInfo, type ProgramKode } from "@/lib/program-data";
import { PROGRAM_ICON } from "./program-icons";

const base = "/dashboard/calon-siswa";

export default function ProgramPicker({
  saved,
  locked,
}: {
  saved: ProgramKode | null;
  locked: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProgramKode | null>(saved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = selected ? getProgramInfo(selected) : null;

  const confirm = async () => {
    if (!selected) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program: selected }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Gagal menyimpan pilihan.");
        return;
      }
      router.push(`${base}/biodata/review`);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-forest">
            <GraduationCap size={13} />
            Tahap 3 • Minat Kejuruan
          </span>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Pilih Program Keahlian
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/75">
            Pilih satu program keahlian kejuruan yang sesuai dengan minat dan bakatmu di SMK Citra Negara.
          </p>
        </div>

        <div className="flex max-w-[290px] items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-chip text-forest">
            <Lightbulb size={19} />
          </span>
          <span className="leading-snug">
            <span className="block text-[13px] font-bold text-ink">Pilihan Fleksibel</span>
            <span className="block text-[12px] text-ink/70">
              Dapat ditinjau ulang sebelum verifikasi akhir
            </span>
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PROGRAM.map((p) => {
          const Icon = PROGRAM_ICON[p.kode];
          const active = selected === p.kode;
          return (
            <article
              key={p.kode}
              className={`flex flex-col rounded-2xl border-2 bg-white p-6 shadow-[0_4px_16px_rgba(20,114,57,0.06)] transition ${
                active ? "border-forest" : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex size-12 items-center justify-center rounded-lg bg-wash text-forest">
                  <Icon size={22} />
                </span>
                {active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-0.5 text-[11.5px] font-semibold text-forest">
                    <span className="size-1.5 rounded-full bg-forest" />
                    Dipilih
                  </span>
                )}
              </div>

              <p className="mt-5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
                {p.label}
              </p>
              <h2 className="mt-1 text-[19px] font-medium leading-snug text-ink">{p.nama}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{p.desc}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-pastel px-2 py-0.5 text-[11.5px] font-medium text-ink/80"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button
                type="button"
                disabled={locked}
                onClick={() => setSelected(p.kode)}
                aria-pressed={active}
                className={`mt-auto flex h-10 w-full items-center justify-center gap-2 rounded text-[14px] font-semibold transition disabled:cursor-not-allowed ${
                  active
                    ? "bg-nav text-white"
                    : "bg-wash text-ink hover:bg-[#d9f0e0] disabled:opacity-60"
                }`}
                style={{ marginTop: "1.5rem" }}
              >
                {active ? <CircleCheck size={17} /> : <Circle size={17} />}
                {active ? "Dipilih" : "Pilih Jurusan Ini"}
              </button>
            </article>
          );
        })}
      </div>

      {locked ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-wash text-forest">
            <Lock size={20} />
          </span>
          <p className="text-[14px] leading-relaxed text-ink/80">
            Pilihan program keahlian terkunci karena formulir pendaftaran sudah dikirim. Perubahan hanya dapat diajukan melalui panitia.
          </p>
        </div>
      ) : (
        current && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
                <BadgeCheck size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-forest">
                  Konfirmasi Pilihan Program Keahlian
                </p>
                <p className="mt-0.5 text-[18px] font-medium leading-snug text-ink">
                  Apakah kamu yakin memilih {current.singkatan} — {current.nama} sebagai pilihan utama?
                </p>
                <p className="mt-1 text-[12px] text-ink/70">
                  Pilihan ini akan dicantumkan pada Kartu Peserta Ujian dan berkas penempatan minat seleksi.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(saved);
                    setError("");
                  }}
                  className="inline-flex h-11 items-center rounded bg-wash px-8 text-[14px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={loading}
                  className="inline-flex h-11 items-center gap-2 rounded bg-forest px-6 text-[14px] font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CircleCheck size={16} />
                  {loading ? "Menyimpan..." : "Konfirmasi Pilihan"}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>
            )}
          </div>
        )
      )}
    </div>
  );
}