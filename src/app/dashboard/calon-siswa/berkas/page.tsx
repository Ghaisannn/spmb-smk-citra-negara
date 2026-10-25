import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  Clock,
  FileCheck2,
  Headset,
  Info,
  MessageSquare,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import BerkasUploader from "@/components/dashboard/BerkasUploader";
import { requireRole } from "@/lib/auth";
import { getBerkas } from "@/lib/berkas";
import {
  JENIS_BERKAS,
  MAX_BERKAS_MB,
  hitungWajib,
} from "@/lib/berkas-config";
import { getBiodataState } from "@/lib/biodata";
import { HELPDESK } from "@/lib/jadwal-config";

export const metadata = { title: "Berkas Pendaftaran | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export default async function BerkasPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);

  // Berkas hanya bisa diunggah setelah formulir biodata terkirim.
  if (!state || state.status !== "terkirim") redirect(`${base}/biodata`);

  const items = await getBerkas(session.id);
  const r = hitungWajib(items);
  const persen = Math.round((r.terunggah / r.total) * 100);
  const wajib = JENIS_BERKAS.filter((j) => j.wajib);

  const tips = [
    "Pindai atau foto dokumen asli dalam kondisi terang, tidak buram, dan tidak terpotong.",
    "Pastikan seluruh tulisan, stempel, dan tanda tangan terbaca jelas.",
    `Gunakan format JPG, PNG, atau PDF dengan ukuran maksimal ${MAX_BERKAS_MB} MB per file.`,
    "Pas foto menggunakan latar belakang merah atau biru dan hanya boleh JPG/PNG.",
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-forest">
        <ScanLine size={13} />
        Dokumen Administrasi
      </span>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
        Upload Dokumen Berkas
      </h1>
      <p className="mt-2 max-w-[640px] text-[16px] leading-relaxed text-ink/75">
        Unggah pindaian digital berkas persyaratan pendaftaran. Setiap berkas akan diperiksa oleh panitia SPMB dalam 1x24 jam kerja.
      </p>

      {/* Banner status */}
      {r.semuaDiterima ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-chip/70 px-5 py-4">
          <BadgeCheck size={22} className="mt-0.5 shrink-0 text-forest" />
          <div>
            <p className="text-[16px] font-semibold text-forest">
              Seluruh Berkas Wajib Telah Diverifikasi
            </p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/80">
              Berkas Anda dinyatakan lengkap dan sah. Silakan lanjutkan ke jadwal ujian seleksi.
            </p>
          </div>
        </div>
      ) : r.perbaikan > 0 ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-red-50 px-5 py-4">
          <TriangleAlert size={22} className="mt-0.5 shrink-0 text-[#c00000]" />
          <div>
            <p className="text-[16px] font-semibold text-[#c00000]">
              {r.perbaikan} Berkas Perlu Diperbaiki
            </p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/80">
              Periksa catatan panitia pada berkas yang ditandai merah, lalu unggah ulang berkas yang benar.
            </p>
          </div>
        </div>
      ) : r.lengkap ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-[#fff8d9] px-5 py-4">
          <Clock size={22} className="mt-0.5 shrink-0 text-[#8a5a00]" />
          <div>
            <p className="text-[16px] font-semibold text-[#8a5a00]">
              Seluruh Berkas Wajib Sudah Diunggah
            </p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/80">
              Berkas Anda sedang menunggu verifikasi panitia. Status akan diperbarui otomatis di halaman ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex gap-3 rounded-xl bg-wash px-5 py-4">
          <span className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-forest text-white">
            <Info size={12} strokeWidth={3} />
          </span>
          <p className="text-[13.5px] leading-relaxed text-ink/80">
            Lengkapi <strong>{r.total} berkas wajib</strong> di bawah ini. Piagam Prestasi bersifat opsional, namun dapat menjadi nilai tambah seleksi.
          </p>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <BerkasUploader items={items} />

        <aside className="space-y-4 lg:sticky lg:top-[90px]">
          {/* Progres */}
          <div className={`${card} p-5`}>
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-forest">
              <FileCheck2 size={18} />
              Kelengkapan Berkas
            </h3>

            <div className="mt-4 flex items-end justify-between">
              <p className="text-[13px] text-ink/70">Berkas wajib terunggah</p>
              <p className="text-[18px] font-bold text-forest">
                {r.terunggah}/{r.total}
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-pastel">
              <div
                className="h-2 rounded-full bg-forest transition-all"
                style={{ width: `${persen}%` }}
              />
            </div>

            <ul className="mt-4 space-y-2">
              {wajib.map((j) => {
                const it = items[j.kode];
                const tone = !it
                  ? "text-ink/50"
                  : it.status === "diterima"
                    ? "text-forest"
                    : it.status === "perlu_perbaikan"
                      ? "text-[#c00000]"
                      : "text-[#8a5a00]";
                const text = !it
                  ? "Belum diunggah"
                  : it.status === "diterima"
                    ? "Diterima"
                    : it.status === "perlu_perbaikan"
                      ? "Perbaiki"
                      : "Menunggu";
                return (
                  <li
                    key={j.kode}
                    className="flex items-center justify-between gap-2 rounded-md bg-[#eef5f0] px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-ink/85">{j.nama}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${tone}`}>
                      {it?.status === "diterima" && <CircleCheck size={13} />}
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tips */}
          <div className={`${card} p-5`}>
            <h3 className="text-[16px] font-semibold text-ink">Panduan Pemindaian</h3>
            <ul className="mt-3 space-y-2.5">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink/75">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-wash text-[11px] font-bold text-forest">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div className={`${card} p-5`}>
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Headset size={17} className="text-forest" />
              Kesulitan mengunggah?
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">
              Hubungi Helpdesk SPMB, Senin - Sabtu pukul 08.00 - 15.00 WIB.
            </p>
            <a
              href={HELPDESK.wa}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-wash text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
            >
              <MessageSquare size={15} />
              WhatsApp {HELPDESK.telp}
            </a>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <Link
          href={base}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>
        <Link
          href={`${base}/jadwal`}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800"
        >
          Lanjut ke Jadwal &amp; Tes
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}