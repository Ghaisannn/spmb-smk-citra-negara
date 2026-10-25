import Link from "next/link";
import {
  ArrowUpDown,
  Award,
  CircleCheck,
  ClipboardCheck,
  Filter,
  ListFilter,
  RotateCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import MonitoringSync from "@/components/kepsek/MonitoringSync";
import RincianButton from "@/components/kepsek/RincianButton";
import { Avatar, StatCard, card } from "@/components/kepsek/Ui";
import Pagination from "@/components/admin/Pagination";
import { requireRole } from "@/lib/auth";
import { JALUR, PASSING_GRADE } from "@/lib/admin-config";
import { buildQuery, initials } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { HASIL_KEPSEK, PROGRAM_LAPORAN } from "@/lib/kepsek-config";
import { getMonitoring, listPenilaian } from "@/lib/kepsek-data";
import { PROGRAM_KODE, type ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Monitoring Seleksi | SMK Citra Negara" };

const base = "/dashboard/kepsek/monitoring";
const SORTS = ["tertinggi", "terendah", "terbaru"] as const;
const SORT_LABEL = { tertinggi: "Skor Tertinggi", terendah: "Skor Terendah", terbaru: "Terbaru" };
const pct1 = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");

const CHIP = {
  diterima: "bg-chip text-forest",
  cadangan: "bg-pastel text-ink/75",
  tidak_diterima: "bg-red-100 text-[#c00000]",
  belum: "bg-white text-ink/55 ring-1 ring-line",
} as const;

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; jalur?: string; q?: string; sort?: string; page?: string }>;
}) {
  await requireRole("kepsek");
  const sp = await searchParams;
  const program = PROGRAM_KODE.includes(sp.program ?? "") ? (sp.program as string) : "";
  const jalur = (JALUR as readonly string[]).includes(sp.jalur ?? "") ? (sp.jalur as string) : "";
  const q = (sp.q ?? "").slice(0, 100);
  const sort = (SORTS as readonly string[]).includes(sp.sort ?? "") ? (sp.sort as (typeof SORTS)[number]) : "tertinggi";
  const page = Math.max(Number(sp.page) || 1, 1);

  const [m, list] = await Promise.all([
    getMonitoring({ program, jalur }),
    listPenilaian({ program, jalur, q, sort, page, perPage: 10 }),
  ]);

  const dist = Object.fromEntries(m.distribusi.map((d) => [d.program, d])) as Record<string, { ok: number; cad: number; tdk: number }>;
  const totalPages = Math.max(Math.ceil(list.total / list.perPage), 1);
  const offset = (list.page - 1) * list.perPage;
  const nextSort = SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length];
  const href = (o: { sort?: string; page?: number }) =>
    `${base}${buildQuery({ program, jalur, q, sort: (o.sort ?? sort) === "tertinggi" ? undefined : (o.sort ?? sort), page: o.page && o.page > 1 ? o.page : undefined })}`;

  const sel = "h-11 w-full appearance-none rounded-lg bg-wash px-3.5 text-[14px] text-ink outline-none focus:ring-2 focus:ring-forest/15";

  const Seg = ({ k, big }: { k: string; big: boolean }) => {
    const d = dist[k] ?? { ok: 0, cad: 0, tdk: 0 };
    const tot = d.ok + d.cad + d.tdk;
    const w = (v: number) => (tot > 0 ? (v / tot) * 100 : 0);
    const p = PROGRAM_LAPORAN[k as ProgramKode];
    return (
      <div>
        <div className="flex items-end justify-between gap-2">
          <p className={big ? "text-[16px] text-ink" : "text-[12.5px] text-ink"}>
            <b className="font-semibold">{p.tampil}</b>{" "}
            {big && p.sub ? <span className="text-[12px] text-ink/65">({p.sub})</span> : <span className="text-ink/65">({tot} Siswa)</span>}
          </p>
          <p className="text-[12px] font-semibold text-ink">{big ? `${tot} Peserta` : <span className="text-forest">{d.ok} Lolos Utama</span>}</p>
        </div>
        <div className={`mt-1.5 flex overflow-hidden rounded-full bg-[#dde9e1] ${big ? "h-[26px]" : "h-3"}`}>
          {d.ok > 0 && <div className="flex items-center justify-center bg-[#005c34] text-[11px] font-medium text-white" style={{ width: `${w(d.ok)}%` }}>{big && `${d.ok} Lolos`}</div>}
          {d.cad > 0 && <div className="flex items-center justify-center bg-[#6dd89b] text-[11px] font-medium text-ink" style={{ width: `${w(d.cad)}%` }}>{big && d.cad}</div>}
          {d.tdk > 0 && <div className="flex items-center justify-center text-[11px] text-ink/70" style={{ width: `${w(d.tdk)}%` }}>{big && d.tdk}</div>}
        </div>
      </div>
    );
  };

  const grid = "grid min-w-[900px] grid-cols-[1.3fr_2fr_1fr_1fr_1.5fr_1fr_0.8fr] items-center gap-3";

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest"><ShieldCheck size={14} />Tinjauan Eksekutif Kepala Sekolah</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Monitoring &amp; Pengawasan Seleksi SPMB</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">Pantau pergerakan seleksi akademik CBT secara komprehensif lintas jurusan dan jalur masuk.</p>
        </div>
        <MonitoringSync exportHref={`/api/kepsek/export${buildQuery({ type: "monitoring", program, jalur, q })}`} />
      </div>

      <form method="get" className={`${card} mt-6 flex flex-wrap items-end gap-3 p-4 print:hidden`}>
        <p className="flex h-11 items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink"><ListFilter size={17} />Filter Evaluasi</p>
        <label className="min-w-[170px] flex-1 text-[11.5px] font-medium text-ink/70">Periode Pendaftaran
          <select disabled className={`${sel} mt-1`}><option>Gelombang 1 (Reguler)</option></select>
        </label>
        <label className="min-w-[150px] flex-1 text-[11.5px] font-medium text-ink/70">Jalur Masuk
          <select name="jalur" defaultValue={jalur} className={`${sel} mt-1`}>
            <option value="">Semua Jalur</option>
            {JALUR.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </label>
        <label className="min-w-[190px] flex-1 text-[11.5px] font-medium text-ink/70">Program Keahlian
          <select name="program" defaultValue={program} className={`${sel} mt-1`}>
            <option value="">Semua Program ({PROGRAM_KODE.length} Jurusan)</option>
            {(PROGRAM_KODE as readonly ProgramKode[]).map((k) => <option key={k} value={k}>{PROGRAM_LAPORAN[k].tampil}</option>)}
          </select>
        </label>
        <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800"><Filter size={15} />Terapkan</button>
        <Link href={base} aria-label="Atur ulang filter" className="inline-flex size-11 items-center justify-center rounded-lg bg-wash text-ink/70 hover:bg-[#d9f0e0]"><RotateCcw size={17} /></Link>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jumlah Peserta Teruji" icon={<Users size={19} />} value={m.teruji} unit="Siswa">
          <p>Mengikuti ujian CBT</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-forest"><CircleCheck size={14} />{pct1(m.teruji, m.total)}% dari formulir terkirim</p>
        </StatCard>
        <StatCard label="Lulus Administrasi" icon={<ClipboardCheck size={19} />} value={m.lulusAdm} unit="Siswa">
          <p>{pct1(m.lulusAdm, m.total)}% verifikasi berkas sah &amp; absah</p>
          <div className="mt-2 h-1.5 rounded-full bg-pastel"><div className="h-1.5 rounded-full bg-forest" style={{ width: `${pct1(m.lulusAdm, m.total)}%` }} /></div>
        </StatCard>
        <StatCard label="Lulus Passing Grade" icon={<Award size={19} />} value={m.lulusPg} unit="Siswa" tone="bg-chip text-forest" valueClass="text-forest">
          <p>Nilai tes CBT ≥ {PASSING_GRADE.toFixed(2)}</p>
          <p className="mt-2 flex justify-between"><span>Rasio Kelulusan Mutu</span><b className="text-forest">{pct1(m.lulusPg, m.teruji)}%</b></p>
        </StatCard>
        <StatCard label="Di Bawah Passing Grade" icon={<TriangleAlert size={19} />} value={m.bawah} unit="Siswa" tone="bg-red-100 text-[#c00000]" valueClass="text-[#c00000]">
          <p>Nilai CBT &lt; {PASSING_GRADE.toFixed(2)} (butuh evaluasi)</p>
          <p className="mt-2 flex justify-between"><span>Rasio Tidak Lolos CBT</span><b className="text-[#c00000]">{pct1(m.bawah, m.teruji)}%</b></p>
        </StatCard>
      </div>

      <section className={`${card} mt-6 p-5 sm:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="max-w-[360px] text-[22px] font-medium leading-snug text-ink">Distribusi Hasil Seleksi per Program Keahlian</h2>
            <p className="mt-1 text-[12.5px] text-ink/65">Komparasi peserta lolos kuota utama, cadangan, dan tidak memenuhi kriteria minimum.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink/80">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#005c34]" />Lolos Utama</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#6dd89b]" />Cadangan</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#cfdcd3]" />Tidak Lolos</span>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {(["PPLG", "DKV", "TJKT", "MPLB"] as const).map((k) => <Seg key={k} k={k} big />)}
          <div className="grid gap-5 sm:grid-cols-2">
            <Seg k="PEMASARAN" big={false} />
            <Seg k="PERHOTELAN" big={false} />
          </div>
        </div>
      </section>

      <section className={`${card} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="text-[22px] font-medium text-ink">Hasil Penilaian Peserta Terkini</h2>
            <p className="mt-1 max-w-[360px] text-[12.5px] text-ink/65">Tinjauan skor tes CBT peserta terdaftar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <form method="get" className="flex h-11 min-w-[220px] items-center gap-2 rounded-lg bg-wash px-3.5">
              <Search size={16} className="text-ink/55" />
              <input name="q" defaultValue={q} placeholder="Cari nama atau No. Pendaftaran..." className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink/45" />
              {program && <input type="hidden" name="program" value={program} />}
              {jalur && <input type="hidden" name="jalur" value={jalur} />}
              {sort !== "tertinggi" && <input type="hidden" name="sort" value={sort} />}
            </form>
            <Link href={href({ sort: nextSort })} className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-4 text-[13px] font-semibold text-ink hover:bg-[#d9f0e0]"><ArrowUpDown size={15} />{SORT_LABEL[sort]}</Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className={`${grid} bg-wash px-5 py-3.5 text-[10.5px] font-semibold uppercase leading-snug tracking-wide text-ink/75`}>
            <span>No. Pendaftaran</span><span>Nama Siswa &amp; Asal Sekolah</span><span>Program Pilihan</span>
            <span className="text-center">Nilai CBT</span>
            <span>Status Kelulusan</span><span>Jalur</span><span className="text-right">Asesmen</span>
          </div>

          {list.rows.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-ink/60">Belum ada peserta yang sudah dinilai. Nilai CBT masuk otomatis setelah siswa mengerjakan ujian.</p>
          ) : (
            list.rows.map((r) => {
              const nilai = r.skor ?? r.cbt;
              const bad = nilai !== null && nilai < PASSING_GRADE;
              const noReg = nomorRegistrasi(r.id);
              return (
                <div key={r.id} className={`${grid} border-b border-line/70 px-5 py-4`}>
                  <span className={`text-[13.5px] font-medium ${r.hasil === "diterima" ? "text-forest" : "text-ink"}`}>{noReg}</span>
                  <span className="flex items-center gap-2.5"><Avatar text={initials(r.nama)} bad={bad} /><span className="min-w-0 leading-tight"><span className="block truncate text-[14.5px] font-medium text-ink">{r.nama}</span><span className="block truncate text-[11.5px] text-ink/60">{r.sekolah || "-"}</span></span></span>
                  <span>{r.program ? <span className="rounded bg-pastel px-2 py-1 text-[12px] font-medium text-forest">{PROGRAM_LAPORAN[r.program as ProgramKode]?.tampil ?? r.program}</span> : "-"}</span>
                  <span className={`text-center text-[15px] font-semibold ${bad ? "text-[#c00000]" : "text-forest"}`}>{nilai?.toFixed(2) ?? "-"}</span>
                  <span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-tight ${CHIP[r.hasil]}`}><span className="size-1.5 shrink-0 rounded-full bg-current" />{HASIL_KEPSEK[r.hasil]}</span></span>
                  <span className="text-[12.5px] leading-snug text-ink/75">{r.jalur}</span>
                  <span className="text-right print:hidden">
                    <RincianButton r={{ nama: r.nama, noReg, sekolah: r.sekolah, program: r.program ? (PROGRAM_LAPORAN[r.program as ProgramKode]?.nama ?? r.program) : "", cbt: r.cbt, skor: r.skor, status: HASIL_KEPSEK[r.hasil], jalur: r.jalur, catatan: r.catatan, peringkat: r.peringkat, total: r.totalPeserta }} />
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <p className="text-[12.5px] text-ink/70">Menampilkan <b className="text-ink">{list.total === 0 ? 0 : offset + 1} - {offset + list.rows.length}</b> dari <b className="text-ink">{list.total}</b> peserta seleksi</p>
          <Pagination page={list.page} totalPages={totalPages} hrefFor={(p) => href({ page: p })} />
        </div>
      </section>
    </div>
  );
}