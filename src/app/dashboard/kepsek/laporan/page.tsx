import {
  ArrowLeftRight,
  CircleCheck,
  FileSpreadsheet,
  FileText,
  Hourglass,
  ListFilter,
  PieChart,
  Printer,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { CumLine, ProgramBars } from "@/components/kepsek/Charts";
import PrintLink from "@/components/dashboard/PrintLink";
import { StatCard, card } from "@/components/kepsek/Ui";
import { requireRole } from "@/lib/auth";
import { PASSING_GRADE } from "@/lib/admin-config";
import { tglPendek, jam } from "@/lib/admin-format";
import { formatTanggal } from "@/lib/biodata-schema";
import { DOC_NO, KEPSEK_NIP, PROGRAM_LAPORAN, addDays } from "@/lib/kepsek-config";
import { getDraft, getMatrix, getRingkasan, getTren } from "@/lib/kepsek-data";
import type { ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Laporan Penerimaan | SMK Citra Negara" };

const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");
const rasio = (a: number, b: number) => (b > 0 ? `1:${(a / b).toFixed(2)}` : "-");

export default async function LaporanPage() {
  const session = await requireRole("kepsek");
  const [r, matrix, tren, draft] = await Promise.all([getRingkasan(), getMatrix(), getTren(8), getDraft()]);
  const now = new Date();

  const sum = (f: (m: (typeof matrix)[number]) => number) => matrix.reduce((a, m) => a + f(m), 0);
  const tot = { pagu: sum((m) => m.pagu), pend: sum((m) => m.pendaftar), adm: sum((m) => m.lolosAdm), hadir: sum((m) => m.hadir), ok: sum((m) => m.diterima), cad: sum((m) => m.cadangan) };

  const cumA: number[] = [];
  const cumB: number[] = [];
  let a = tren.baseDaftar;
  let b = tren.baseKirim;
  tren.daftar.forEach((v, i) => {
    a += v;
    b += tren.kirim[i];
    cumA.push(a);
    cumB.push(b);
  });

  const favorit = [...matrix].sort((x, y) => y.pendaftar - x.pendaftar)[0];
  const batasCad = addDays(draft.tanggal, 6);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-wash px-4 py-3 text-[12px]">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="rounded bg-chip px-2 py-0.5 font-bold text-forest">RESMI &amp; TERVERIFIKASI</span>
          <span className="text-ink/75">No. Dokumen: <b className="font-mono text-ink">{DOC_NO}</b></span>
          <span className="text-ink/55">• Diperbarui: {tglPendek(now)}, {jam(now)} WIB</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium text-forest"><ShieldCheck size={15} />Arsip Sah Eksekutif Yayasan &amp; Disdik</span>
      </div>

      <section className={`${card} mt-4 p-6 text-center sm:p-8`}>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-chip/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-forest"><CircleCheck size={14} />Dokumen Eksekutif Resmi • T.A. 2026/2027</span>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">Pusat Laporan Eksekutif Penerimaan Siswa Baru</h1>
        <p className="mx-auto mt-2 max-w-[560px] text-[14px] leading-relaxed text-ink/75">Laporan komprehensif penerimaan peserta didik baru tahun ajaran 2026/2027 untuk pelaporan dinas pendidikan, evaluasi yayasan, dan arsip SMK Citra Negara.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-line pt-5 print:hidden">
          <a href="/api/kepsek/export?type=laporan" className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-4 text-[13.5px] font-medium text-ink transition hover:bg-[#d9f0e0]"><FileSpreadsheet size={16} />Export Data Excel (.xlsx)</a>
          <PrintLink className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-4 text-[13.5px] font-medium text-ink transition hover:bg-[#d9f0e0]"><Printer size={16} />Cetak Laporan Resmi</PrintLink>
          <PrintLink className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-4 text-[13.5px] font-semibold text-white transition hover:bg-brand-800"><FileText size={16} />Export PDF Laporan Lengkap</PrintLink>
        </div>
      </section>

      <section className={`${card} mt-3 flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
          <span className="flex items-center gap-2 font-semibold text-ink"><ListFilter size={16} />Parameter Laporan:</span>
          <span className="rounded-lg bg-wash px-3 py-2"><span className="mr-2 text-[11px] text-ink/50">T.A.</span>2026/2027 (Berjalan)</span>
          <span className="rounded-lg bg-wash px-3 py-2"><span className="mr-2 text-[11px] text-ink/50">JALUR</span>Semua Jalur (Reguler, Prestasi, Afirmasi)</span>
          <span className="rounded-lg bg-wash px-3 py-2"><span className="mr-2 text-[11px] text-ink/50">PERIODE</span>Gelombang 1</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded bg-wash px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-forest"><span className="size-1.5 rounded-full bg-forest" />Data Terverifikasi Kepala Sekolah</span>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pendaftar Masuk" icon={<UserPlus size={19} />} value={r.semua} unit="Calon Siswa">
          <p className="font-medium text-forest">Dari basis berkas terverifikasi: {r.terverifikasi}</p>
          <div className="mt-2 h-1.5 rounded-full bg-pastel"><div className="h-1.5 rounded-full bg-forest" style={{ width: `${Math.min(Number(pct(r.semua, r.kapasitas)), 100)}%` }} /></div>
          <p className="mt-1.5 flex justify-between text-[11px]"><span>Target Pagu: {r.kapasitas}</span><span>Keterisian: {pct(r.semua, r.kapasitas)}%</span></p>
        </StatCard>
        <StatCard label="Calon Siswa Diterima" icon={<UserCheck size={19} />} value={r.diterima} unit="Siswa" tone="bg-chip text-forest" valueClass="text-forest">
          <p className="flex items-center gap-1.5 font-medium text-forest"><CircleCheck size={14} />Rasio Penerimaan: {pct(r.diterima, r.semua)}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-pastel"><div className="h-1.5 rounded-full bg-forest" style={{ width: `${Math.min(Number(pct(r.diterima, r.semua)), 100)}%` }} /></div>
          <p className="mt-1.5 flex justify-between text-[11px]"><span>Sesuai SK Penetapan</span><span>Lolos Seleksi CBT</span></p>
        </StatCard>
        <StatCard label="Tidak Lolos Seleksi" icon={<UserX size={19} />} value={r.tidak} unit="Siswa" tone="bg-red-100 text-[#c00000]">
          <p className="flex items-center gap-1.5 font-medium text-[#c00000]"><ArrowLeftRight size={13} />Persentase Gugur: {pct(r.tidak, r.semua)}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-pastel"><div className="h-1.5 rounded-full bg-[#c00000]" style={{ width: `${Math.min(Number(pct(r.tidak, r.semua)), 100)}%` }} /></div>
          <p className="mt-1.5 flex justify-between text-[11px]"><span>Nilai di bawah passing grade</span><span>Ambang Batas: {PASSING_GRADE.toFixed(1)}</span></p>
        </StatCard>
        <StatCard label="Cadangan Terdaftar" icon={<Hourglass size={19} />} value={r.cadangan} unit="Siswa" tone="bg-pastel text-ink/70">
          <p className="flex items-center gap-1.5 font-medium text-ink"><ArrowLeftRight size={13} />Rasio Cadangan: {pct(r.cadangan, r.semua)}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-pastel"><div className="h-1.5 rounded-full bg-[#6dd89b]" style={{ width: `${Math.min(Number(pct(r.cadangan, r.semua)), 100)}%` }} /></div>
          <p className="mt-1.5 flex justify-between text-[11px]"><span>Menunggu daftar ulang utama</span><span>Batas: {formatTanggal(batasCad)}</span></p>
        </StatCard>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="text-[22px] font-medium text-ink">Penerimaan per Program Keahlian</h2>
          <p className="mt-0.5 text-[12.5px] text-ink/65">Komparasi jumlah berkas pendaftar valid vs kuota calon siswa diterima</p>
          <div className="mt-2 inline-flex items-center gap-4 rounded-lg bg-wash px-3 py-1.5 text-[11.5px]">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#005c34]" />Diterima ({tot.ok})</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#7bd8a0]" />Pendaftar ({tot.pend})</span>
          </div>
          <div className="mt-3"><ProgramBars rows={matrix.map((m) => ({ label: PROGRAM_LAPORAN[m.program as ProgramKode].kode.split("-")[0], pendaftar: m.pendaftar, diterima: m.diterima }))} /></div>
          <p className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-wash px-3.5 py-2.5 text-[12px] text-ink/75">
            <span>Jurusan Paling Diminati: <b className="text-forest">{favorit ? PROGRAM_LAPORAN[favorit.program as ProgramKode].label : "-"}</b></span>
            <span>Tingkat Keketatan: <b className="text-ink">{favorit ? rasio(favorit.pendaftar, favorit.diterima) : "-"}</b></span>
          </p>
        </section>

        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[22px] font-medium leading-snug text-ink">Tren Pendaftaran &amp; Kehadiran</h2>
            <TrendingUp size={19} className="shrink-0 text-forest" />
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink/65">Distribusi kumulatif mingguan pendaftar dan formulir terkirim (8 minggu terakhir).</p>
          <div className="mt-4"><CumLine labels={tren.labels} a={cumA} b={cumB} /></div>
          <div className="mt-3 space-y-2 border-t border-line pt-3 text-[12.5px]">
            <p className="flex items-center justify-between"><span className="flex items-center gap-2 text-ink/75"><span className="h-0.5 w-4 bg-[#005c34]" />Pendaftar Terkumpul</span><b className="text-ink">{r.semua} Peserta</b></p>
            <p className="flex items-center justify-between"><span className="flex items-center gap-2 text-ink/75"><span className="h-0.5 w-4 border-t-2 border-dashed border-[#7bd8a0]" />Tingkat Kehadiran Tes CBT</span><b className="text-forest">{pct(r.hadir, r.biodata)}% ({r.hadir} Hadir)</b></p>
          </div>
        </section>
      </div>

      <section className={`${card} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-3 bg-wash px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-[22px] font-medium text-ink">Matriks Rekapitulasi Penerimaan Siswa Baru per Jurusan</h2>
            <p className="mt-0.5 text-[12.5px] text-ink/65">Rincian pagu, daya tampung, seleksi administrasi, pelaksanaan CBT, hingga sisa kuota untuk Gelombang 2</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-forest"><PieChart size={15} />Status Kuota: Aktif (Gel. 1 Selesai)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="bg-wash text-[10.5px] font-semibold uppercase leading-snug tracking-wide text-ink/75">
                <th className="px-5 py-3">Kode</th><th className="px-2 py-3">Nama Program Keahlian</th>
                <th className="px-2 py-3 text-center">Pagu Total</th><th className="px-2 py-3 text-center">Pendaftar</th>
                <th className="px-2 py-3 text-center">Lolos Adm.</th><th className="px-2 py-3 text-center">Hadir CBT</th>
                <th className="bg-chip/60 px-2 py-3 text-center">Usulan Diterima</th><th className="px-2 py-3 text-center">Cadangan</th>
                <th className="px-2 py-3 text-center">Keketatan</th><th className="px-4 py-3 text-center">Sisa Kuota G2</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((m) => {
                const p = PROGRAM_LAPORAN[m.program as ProgramKode];
                return (
                  <tr key={m.program} className="border-b border-line/70 align-middle">
                    <td className="px-5 py-4 font-mono text-[11.5px] font-bold leading-snug text-forest">{p.kode}</td>
                    <td className="px-2 py-4"><p className="text-[14px] font-medium leading-snug text-ink">{p.nama}</p><p className="mt-0.5 text-[11.5px] leading-snug text-ink/55">{p.ringkas}</p></td>
                    <td className="px-2 text-center text-[14px] text-ink">{m.pagu}</td>
                    <td className="px-2 text-center text-[14px] text-ink/80">{m.pendaftar}</td>
                    <td className="px-2 text-center text-[14px] text-forest">{m.lolosAdm}</td>
                    <td className="px-2 text-center text-[14px] text-ink/80">{m.hadir}</td>
                    <td className="bg-chip/30 px-2 text-center text-[15px] font-semibold text-forest">{m.diterima}</td>
                    <td className="px-2 text-center text-[14px] text-ink">{m.cadangan}</td>
                    <td className="px-2 text-center"><span className="rounded bg-pastel px-1.5 py-0.5 font-mono text-[11px] text-ink/75">{rasio(m.pendaftar, m.diterima)}</span></td>
                    <td className="px-4 text-center text-[14px] text-ink">{Math.max(m.pagu - m.diterima, 0)}</td>
                  </tr>
                );
              })}
              <tr className="bg-wash text-[18px] font-semibold text-forest">
                <td colSpan={2} className="px-5 py-4 text-[13px] font-bold uppercase leading-snug text-ink">Total Keseluruhan (Gelombang 1)</td>
                <td className="px-2 text-center">{tot.pagu}</td><td className="px-2 text-center text-ink">{tot.pend}</td>
                <td className="px-2 text-center">{tot.adm}</td><td className="px-2 text-center text-ink">{tot.hadir}</td>
                <td className="bg-nav px-2 py-4 text-center text-white">{tot.ok}</td><td className="px-2 text-center text-ink">{tot.cad}</td>
                <td className="px-2 text-center font-mono text-[15px]">{rasio(tot.pend, tot.ok)}</td>
                <td className="px-4 text-center">{Math.max(tot.pagu - tot.ok, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-chip/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-0.5 shrink-0 text-forest" />
            <div>
              <p className="text-[15px] font-medium text-ink">Legalitas &amp; Autentikasi Sistem</p>
              <p className="mt-0.5 max-w-[460px] text-[12px] leading-snug text-ink/65">Dokumen ini dibuat otomatis oleh Sistem SPMB SMK Citra Negara, disahkan untuk keperluan pelaporan resmi Kepala Sekolah.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink/55">Mengetahui &amp; Menyetujui:</p>
            <p className="text-[16px] font-semibold text-ink">{session.nama}</p>
            <p className="text-[11px] font-medium text-forest">NIP. {KEPSEK_NIP}</p>
          </div>
        </div>
      </section>
    </div>
  );
}