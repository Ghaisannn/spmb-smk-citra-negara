import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import StatusChip from "@/components/admin/StatusChip";
import { requireRole } from "@/lib/auth";
import { getCounts, listPendaftar, type Filter } from "@/lib/admin-data";
import { buildQuery, initials, tglPendek } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { PROGRAM_ADMIN } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Verifikasi Berkas | SMK Citra Negara" };

const base = "/dashboard/admin";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

const TABS = {
  berkas: { filter: "berkas_menunggu" as Filter, label: "Berkas Menunggu" },
  pembayaran: { filter: "bayar_menunggu" as Filter, label: "Pembayaran Menunggu" },
  semua: { filter: "biodata" as Filter, label: "Semua Formulir Terkirim" },
};

const PAY = {
  belum_bayar: { t: "Belum Dibayar", c: "bg-pastel text-ink/65" },
  menunggu_verifikasi: { t: "Menunggu Verifikasi", c: "bg-[#fff1b8] text-[#8a5a00]" },
  lunas: { t: "Lunas", c: "bg-chip text-forest" },
  ditolak: { t: "Ditolak", c: "bg-red-100 text-[#c00000]" },
} as const;

export default async function VerifikasiAntrianPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;
  const tab = (sp.tab === "pembayaran" || sp.tab === "semua" ? sp.tab : "berkas") as keyof typeof TABS;
  const page = Math.max(Number(sp.page) || 1, 1);

  const [list, counts] = await Promise.all([
    listPendaftar({ filter: TABS[tab].filter, page, perPage: 10, order: "lama" }),
    getCounts(),
  ]);

  const n = {
    berkas: counts.berkas_menunggu,
    pembayaran: counts.bayar_menunggu,
    semua: counts.biodata,
  };
  const totalPages = Math.max(Math.ceil(list.total / list.perPage), 1);
  const hrefFor = (p: number) =>
    `${base}/verifikasi${buildQuery({ tab: tab === "berkas" ? undefined : tab, page: p > 1 ? p : undefined })}`;

  const grid = "grid min-w-[820px] grid-cols-[1.5fr_1.6fr_1.2fr_1.2fr_0.9fr] items-center gap-4";

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
        <ClipboardCheck size={14} />
        Loket Verifikasi
      </p>
      <h1 className="mt-1 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
        Verifikasi Berkas
      </h1>
      <p className="mt-1 max-w-[560px] text-[14.5px] leading-relaxed text-ink/75">
        Antrian pendaftar yang formulirnya sudah terkirim. Pilih pendaftar untuk memeriksa berkas dan pembayaran.
      </p>

      <section className={`${card} mt-6 p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => (
            <Link
              key={k}
              href={`${base}/verifikasi${k === "berkas" ? "" : `?tab=${k}`}`}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                tab === k ? "bg-forest text-white" : "bg-wash text-ink hover:bg-[#d9f0e0]"
              }`}
            >
              {TABS[k].label}
              <span className={`rounded-full px-1.5 text-[11px] ${tab === k ? "bg-white/20" : "bg-white text-ink/70"}`}>
                {n[k]}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className={`${grid} rounded-t-lg bg-wash px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink/75`}>
            <span>No. Registrasi</span>
            <span>Nama Calon Siswa</span>
            <span>Berkas Wajib</span>
            <span>Pembayaran</span>
            <span className="text-right">Aksi</span>
          </div>

          {list.rows.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-ink/60">
              Tidak ada pendaftar dalam antrian ini.
            </p>
          ) : (
            list.rows.map((r) => {
              const pay = PAY[r.payStatus as keyof typeof PAY] ?? PAY.belum_bayar;
              return (
                <div key={r.id} className={`${grid} border-b border-line/70 px-4 py-4`}>
                  <span className="leading-tight">
                    <span className="block text-[15px] font-medium text-ink">{nomorRegistrasi(r.id)}</span>
                    <span className="block text-[11.5px] text-ink/60">Tgl: {tglPendek(r.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-pastel text-[12px] font-bold text-forest">
                      {initials(r.nama)}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14.5px] font-medium text-ink">{r.nama}</span>
                      <span className="block text-[11.5px] text-ink/60">
                        {r.program ? PROGRAM_ADMIN[r.program as ProgramKode].singkat : "-"}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-start gap-1">
                    <StatusChip status={r.status} />
                    <span className="text-[11.5px] text-ink/60">
                      {r.nOk} diterima • {r.nWait} menunggu
                    </span>
                  </span>
                  <span>
                    <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${pay.c}`}>
                      {pay.t}
                    </span>
                  </span>
                  <span className="text-right">
                    <Link
                      href={`${base}/verifikasi/${r.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-forest px-3 text-[13px] font-semibold text-white transition hover:bg-brand-800"
                    >
                      Periksa
                      <ArrowRight size={14} />
                    </Link>
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-ink/70">
            Total <b className="text-ink">{list.total}</b> pendaftar dalam antrian
          </p>
          <Pagination page={list.page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>
      </section>
    </div>
  );
}