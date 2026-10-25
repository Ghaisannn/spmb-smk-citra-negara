import Link from "next/link";
import { Download, FolderOpen, RefreshCw, Search, UserCheck, X } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import StatusChip from "@/components/admin/StatusChip";
import { PROGRAM_ICON } from "@/components/dashboard/program-icons";
import { requireRole } from "@/lib/auth";
import { getCounts, getKuota, listPendaftar, type Filter } from "@/lib/admin-data";
import { buildQuery, initials, jam, tglPendek } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { PROGRAM_ADMIN, kapasitasOf } from "@/lib/program-admin";
import { PROGRAM_KODE, type ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Data Pendaftar | SMK Citra Negara" };

const base = "/dashboard/admin";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";
const FILTERS: Filter[] = ["semua", "biodata", "menunggu", "terverifikasi"];

export default async function DataPendaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; program?: string; page?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;

  const filter = FILTERS.includes(sp.filter as Filter) ? (sp.filter as Filter) : "semua";
  const program = PROGRAM_KODE.includes(sp.program ?? "") ? sp.program : undefined;
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(Number(sp.page) || 1, 1);

  const [list, counts, kuota] = await Promise.all([
    listPendaftar({ q, filter, program, page, perPage: 7 }),
    getCounts(),
    getKuota(),
  ]);

  const totalPages = Math.max(Math.ceil(list.total / list.perPage), 1);
  const kapasitas = kuota.reduce((a, k) => a + kapasitasOf(k.rombel), 0);
  const terisi = kuota.reduce((a, k) => a + k.terisi, 0);
  const offset = (list.page - 1) * list.perPage;

  const href = (o: { filter?: string; page?: number; program?: string | null; q?: string }) =>
    `${base}/data-pendaftar${buildQuery({
      q: o.q ?? q,
      filter: (o.filter ?? filter) === "semua" ? undefined : (o.filter ?? filter),
      program: o.program === null ? undefined : (o.program ?? program),
      page: o.page && o.page > 1 ? o.page : undefined,
    })}`;

  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "semua", label: "Semua", n: counts.semua },
    { key: "biodata", label: "Biodata Lengkap", n: counts.biodata },
    { key: "menunggu", label: "Menunggu Verifikasi", n: counts.menunggu },
    { key: "terverifikasi", label: "Terverifikasi", n: counts.terverifikasi },
  ];

  const grid = "grid min-w-[880px] grid-cols-[1.55fr_1.5fr_1.35fr_0.95fr_1.15fr] items-center gap-4";

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <p className="flex flex-wrap items-center gap-3 text-ink/65">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 font-medium text-forest">
            <RefreshCw size={12} />
            Sinkronisasi Aktif
          </span>
          Pembaruan terakhir: {jam()} WIB
        </p>
        <p className="text-ink/70">
          Periode Gelombang:{" "}
          <span className="font-semibold text-forest">Gelombang 1 (Januari - Mei 2026)</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <FolderOpen size={14} />
            Modul Loket Pendaftaran
          </p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Data Pendaftar
          </h1>
          <p className="mt-1 max-w-[520px] text-[14.5px] leading-relaxed text-ink/75">
            Daftar seluruh calon siswa yang terdaftar dalam SPMB SMK Citra Negara Tahun Ajaran 2026/2027.
          </p>
        </div>
        <div className={`${card} flex items-center gap-3 px-4 py-3`}>
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
            <UserCheck size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-[10.5px] font-medium uppercase tracking-wide text-ink/60">
              Total Kuota Masuk
            </span>
            <span className="block text-[26px] font-semibold text-ink">
              {terisi}{" "}
              <span className="text-[13px] font-normal text-ink/65">/ {kapasitas} Siswa</span>
            </span>
          </span>
        </div>
      </div>

      <section className={`${card} mt-6 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex h-11 min-w-[240px] flex-1 items-center gap-3 rounded-lg bg-wash px-4">
            <Search size={18} className="text-ink/55" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama siswa, nomor pendaftaran, atau asal sekolah..."
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/45"
            />
            {filter !== "semua" && <input type="hidden" name="filter" value={filter} />}
            {program && <input type="hidden" name="program" value={program} />}
          </form>
          <a
            href={`/api/admin/rekap${buildQuery({ q, filter, program })}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-5 text-[14px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
          >
            <Download size={16} />
            Unduh Rekap Excel
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={href({ filter: t.key, page: 1 })}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                  filter === t.key
                    ? "bg-forest text-white"
                    : "bg-wash text-ink hover:bg-[#d9f0e0]"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    filter === t.key ? "bg-white/20" : "bg-white text-ink/70"
                  }`}
                >
                  {t.n}
                </span>
              </Link>
            ))}
            {program && (
              <Link
                href={href({ program: null, page: 1 })}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1b8] px-3 py-1.5 text-[12.5px] font-semibold text-[#8a5a00]"
              >
                Program: {PROGRAM_ADMIN[program as ProgramKode].singkat}
                <X size={13} />
              </Link>
            )}
          </div>
          <p className="text-[12px] text-ink/65">
            Tersaring: <b className="text-ink">{list.rows.length} siswa</b> ditampilkan
          </p>
        </div>

        {/* Tabel */}
        <div className="mt-4 overflow-x-auto">
          <div className={`${grid} rounded-t-lg bg-wash px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink/75`}>
            <span>No. &amp; ID Registrasi</span>
            <span>Nama Calon Siswa</span>
            <span>Asal Sekolah</span>
            <span>Program Keahlian</span>
            <span className="text-center">Status</span>
          </div>

          {list.rows.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-ink/60">
              Tidak ada pendaftar yang cocok dengan pencarian.
            </p>
          ) : (
            list.rows.map((r, i) => {
              const Icon = r.program ? PROGRAM_ICON[r.program as ProgramKode] : null;
              return (
                <Link
                  key={r.id}
                  href={`${base}/verifikasi/${r.id}`}
                  className={`${grid} border-b border-line/70 px-4 py-4 transition hover:bg-[#f4faf6]`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-[11.5px] text-ink/55">
                      {String(offset + i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[16px] font-medium text-ink">
                        {nomorRegistrasi(r.id)}
                      </span>
                      <span className="block text-[11.5px] text-ink/60">
                        Tgl: {tglPendek(r.createdAt)}
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-pastel text-[12px] font-bold text-forest">
                      {initials(r.nama)}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[15px] font-medium text-ink">{r.nama}</span>
                      <span className="block text-[11.5px] text-ink/60">
                        NISN: {r.nisn || "-"}
                      </span>
                    </span>
                  </span>

                  <span className="leading-tight">
                    <span className="block text-[14px] text-ink">{r.namaSekolah || "-"}</span>
                    {r.namaSekolah && (
                      <span className="block text-[11.5px] text-ink/60">Kota Depok</span>
                    )}
                  </span>

                  <span>
                    {r.program && Icon ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-pastel px-2 py-1 text-[12px] font-medium text-forest">
                        <Icon size={13} />
                        {PROGRAM_ADMIN[r.program as ProgramKode].singkat}
                      </span>
                    ) : (
                      <span className="text-[12px] text-ink/45">-</span>
                    )}
                  </span>

                  <span className="text-center">
                    <StatusChip status={r.status} />
                  </span>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-ink/70">
            Menampilkan{" "}
            <b className="text-ink">
              {list.total === 0 ? 0 : offset + 1}–{offset + list.rows.length}
            </b>{" "}
            dari <b className="text-ink">{list.total}</b> pendaftar
          </p>
          <Pagination
            page={list.page}
            totalPages={totalPages}
            hrefFor={(p) => href({ page: p })}
          />
        </div>
      </section>
    </div>
  );
}