"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleCheck,
  FilePenLine,
  Globe,
  Gavel,
  History,
  ListChecks,
  Lock,
  Megaphone,
  Save,
  Printer,
  Users,
  Eye,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { card } from "./Ui";
import { jam, tglPendek } from "@/lib/admin-format";
import { formatTanggal } from "@/lib/biodata-schema";
import { ID_DRAFT, JAM_RILIS, SURAT, addDays, rentang, PROGRAM_LAPORAN } from "@/lib/kepsek-config";
import type { ProgramKode } from "@/lib/program-data";

type Rekap = { program: string; daftar: number; lolos: number; sisa: number; pct: number };

type Props = {
  draft: { judul: string; nomor: string; tanggal: string; sambutan: string; versi: number; status: "draft" | "terbit"; publishedAt: string | null };
  persetujuan: "menunggu" | "disetujui" | "revisi";
  rekap: Rekap[];
  kapasitas: number;
  diterima: number;
  terverifikasi: number;
  kepsekNama: string;
  log: { judul: string; detail: string; at: string }[];
  logTotal: number;
};

const field =
  "w-full rounded-lg border border-transparent bg-wash px-3.5 text-[14px] text-ink outline-none placeholder:text-ink/40 focus:border-forest focus:ring-2 focus:ring-forest/15 read-only:cursor-default";

export default function PengumumanEditor(p: Props) {
  const router = useRouter();
  const [judul, setJudul] = useState(p.draft.judul);
  const [nomor, setNomor] = useState(p.draft.nomor);
  const [tanggal, setTanggal] = useState(p.draft.tanggal);
  const [sambutan, setSambutan] = useState(p.draft.sambutan);
  const [busy, setBusy] = useState<"save" | "pub" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const terbit = p.draft.status === "terbit";
  const dirty =
    judul !== p.draft.judul || nomor !== p.draft.nomor || tanggal !== p.draft.tanggal || sambutan !== p.draft.sambutan;
  const canPublish = p.persetujuan === "disetujui" && !terbit;

  const banner = terbit
    ? { t: "Telah Dipublikasikan", c: "bg-chip text-forest", d: "bg-forest", vis: "Visibilitas: Terbuka untuk Publik" }
    : p.persetujuan === "disetujui"
      ? { t: "Disahkan • Siap Dipublikasikan", c: "bg-chip text-forest", d: "bg-forest", vis: "Visibilitas: Terkunci hingga Otorisasi" }
      : p.persetujuan === "revisi"
        ? { t: "Dikembalikan ke Panitia untuk Revisi", c: "bg-red-100 text-[#c00000]", d: "bg-[#c00000]", vis: "Visibilitas: Terkunci hingga Otorisasi" }
        : { t: "Menunggu Pengesahan Akhir Kepala Sekolah", c: "bg-[#fff1b8] text-[#8a5a00]", d: "bg-orange-500", vis: "Visibilitas: Terkunci hingga Otorisasi" };

  const save = async () => {
    const res = await fetch("/api/kepsek/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judul, nomor, tanggal, sambutan }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, text: (json.message as string) || "Gagal menyimpan draf." };
  };

  const onSave = async () => {
    setBusy("save");
    setMsg(null);
    try {
      const r = await save();
      setMsg(r);
      if (r.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusy(null);
    }
  };

  const onPublish = async () => {
    if (!window.confirm("Publikasikan pengumuman sekarang? Hasil seleksi akan langsung tampil di portal siswa.")) return;
    setBusy("pub");
    setMsg(null);
    try {
      if (dirty) {
        const s = await save();
        if (!s.ok) return setMsg(s);
      }
      const res = await fetch("/api/kepsek/publikasi", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: json.message || (res.ok ? "Berhasil." : "Gagal mempublikasikan.") });
      if (res.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusy(null);
    }
  };

  const mulai = addDays(tanggal, 1);
  const selesai = addDays(tanggal, 6);
  const totalDaftar = p.rekap.reduce((a, r) => a + r.daftar, 0);

  return (
    <div>
      {/* Banner status */}
      <section className={`${card} mt-4 flex flex-wrap items-center justify-between gap-4 p-5 print:hidden`}>
        <div className="flex items-center gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
            <Gavel size={23} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${banner.c}`}>
                <span className={`size-1.5 rounded-full ${banner.d}`} />
                {banner.t}
              </span>
              <span className="text-ink/55">ID Draf: {ID_DRAFT}</span>
            </div>
            <p className="mt-1 text-[19px] font-medium text-ink">
              Rencana Rilis Publikasi: <span className="text-forest">{formatTanggal(tanggal)} • Pukul {JAM_RILIS} WIB</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-wash px-3.5 py-2.5 text-[12.5px] font-medium text-forest">
          <Eye size={16} />
          {banner.vis}
        </span>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
        {/* KIRI */}
        <div className="space-y-6 print:hidden">
          <section className={`${card} p-5`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[19px] font-medium text-ink">
                <FilePenLine size={19} className="text-forest" />
                Metadata Surat &amp; Publikasi
              </h2>
              <span className="rounded bg-pastel px-2 py-0.5 text-[11px] text-ink/70">Draf v{p.draft.versi}.0</span>
            </div>

            <div className="mt-4 space-y-3.5">
              <label className="block text-[12.5px] font-medium text-ink">
                Judul Pengumuman Resmi
                <input value={judul} readOnly={terbit} maxLength={150} onChange={(e) => setJudul(e.target.value)} className={`${field} mt-1 h-11`} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[12.5px] font-medium text-ink">
                  Nomor Surat Resmi
                  <input value={nomor} readOnly={terbit} maxLength={60} onChange={(e) => setNomor(e.target.value)} className={`${field} mt-1 h-11`} />
                </label>
                <label className="block text-[12.5px] font-medium text-ink">
                  Tanggal Publikasi
                  <input type="date" value={tanggal} readOnly={terbit} onChange={(e) => setTanggal(e.target.value)} className={`${field} mt-1 h-11`} />
                </label>
              </div>
              <div>
                <p className="text-[12.5px] font-medium text-ink">Target Audiens Portal</p>
                <div className="mt-1 flex h-11 items-center gap-2.5 rounded-lg bg-wash px-3.5 text-[14px] text-ink">
                  <Globe size={17} className="text-forest" />
                  <span className="flex-1">Seluruh Calon Siswa &amp; Publik</span>
                  <Lock size={15} className="text-ink/50" />
                </div>
              </div>
              <label className="block text-[12.5px] font-medium text-ink">
                <span className="flex items-center justify-between">
                  Pesan Sambutan Kepala Sekolah
                  <span className="text-[11px] font-normal text-ink/55">Sambutan Draf Digital</span>
                </span>
                <textarea value={sambutan} readOnly={terbit} maxLength={1000} rows={6} onChange={(e) => setSambutan(e.target.value)} className={`${field} mt-1 resize-none py-3 leading-relaxed`} />
              </label>
            </div>
          </section>

          <section className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="flex items-start gap-2 text-[19px] font-medium leading-snug text-ink">
                <History size={19} className="mt-0.5 text-forest" />
                Riwayat Revisi<br />Pengumuman
              </h2>
              <span className="text-[11.5px] text-ink/60">{p.logTotal} Pembaruan</span>
            </div>
            <ol className="mt-4 space-y-2">
              {p.log.slice(0, 3).map((l, i) => (
                <li key={i} className={`flex gap-3 rounded-lg p-3 ${i === 0 ? "bg-wash" : ""}`}>
                  <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${i === 0 ? "bg-forest text-white" : "bg-pastel text-ink/70"}`}>
                    R{p.logTotal - i}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-2">
                      <p className="text-[13px] font-semibold text-ink">{l.judul}</p>
                      <span className="text-[11px] text-ink/55">{tglPendek(l.at)}, {jam(new Date(l.at))}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink/70">{l.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${card} p-5`}>
            <h2 className="flex items-center gap-2 text-[17px] font-medium text-ink">
              <CircleCheck size={18} className="text-forest" />
              Otorisasi Resmi Kepala Sekolah
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink/70">
              Penerbitan surat ini secara otomatis membuka akses pengecekan status mandiri calon siswa pada portal web publik dan mengirimkan notifikasi resmi via WhatsApp/Email.
            </p>

            {msg && (
              <p className={`mt-3 rounded px-3 py-2 text-[12.5px] ${msg.ok ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"}`}>{msg.text}</p>
            )}

            <button
              type="button"
              disabled={!canPublish || busy !== null}
              onClick={onPublish}
              className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-lg bg-forest px-4 text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition enabled:hover:bg-brand-800 disabled:bg-[#7fad94] disabled:shadow-none"
            >
              <Megaphone size={19} />
              {terbit ? "Sudah Dipublikasikan" : busy === "pub" ? "Memproses..." : "Publikasikan Pengumuman Sekarang"}
            </button>
            {!canPublish && !terbit && (
              <p className="mt-2 text-center text-[11.5px] text-ink/60">
                Sahkan hasil seleksi di menu <Link href="/dashboard/kepsek/persetujuan" className="font-semibold text-forest hover:underline">Persetujuan Hasil</Link> terlebih dahulu.
              </p>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={terbit || !dirty || busy !== null}
                onClick={onSave}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-wash text-[13px] font-semibold text-ink transition enabled:hover:bg-[#d9f0e0] disabled:opacity-50"
              >
                <Save size={15} />
                {busy === "save" ? "Menyimpan..." : "Simpan Draf"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-wash text-[13px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
              >
                <Printer size={15} />
                Unduh Draf PDF
              </button>
            </div>
          </section>
        </div>

        {/* KANAN: PRATINJAU SURAT */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
              <span className="size-2 rounded-full bg-forest" />
              Pratinjau Otentik Lembar Surat Resmi
            </p>
            <span className="text-[11.5px] text-ink/60">Skala: 100% (Standar A4 Formal)</span>
          </div>

          <article className={`${card} p-6 sm:p-9 print:shadow-none`}>
            <header className="flex items-start gap-4">
              <Image src="/images/logo/logo-smk-citra-negara.png" alt="Logo" width={60} height={60} className="h-[60px] w-[60px] shrink-0 object-contain" />
              <div className="flex-1 text-center">
                <p className="text-[11px] font-bold tracking-wide text-forest">{SURAT.yayasan}</p>
                <p className="mt-0.5 text-[22px] font-bold leading-tight text-ink">{SURAT.sekolah}</p>
                <p className="mt-1 text-[11.5px] text-ink/75">{SURAT.bidang}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-ink/45">{SURAT.alamat}</p>
              </div>
            </header>
            <div className="mt-3 h-[3px] bg-forest" />
            <div className="mt-0.5 h-px bg-forest/40" />

            <div className="mt-5 text-center">
              <span className="inline-block rounded-full bg-chip/60 px-3 py-0.5 text-[10.5px] font-bold tracking-wide text-forest">SURAT KEPUTUSAN KEPALA SEKOLAH</span>
              <h3 className="mx-auto mt-2.5 max-w-[460px] text-[17px] font-bold leading-snug text-ink">
                PENGUMUMAN KELULUSAN SELEKSI PENERIMAAN MURID BARU (SPMB) GELOMBANG 1
              </h3>
              <p className="mt-1 font-mono text-[11px] text-ink/70">Nomor: {nomor || "-"}</p>
            </div>

            <p className="mt-5 text-[13.5px] leading-relaxed text-ink/85">
              Berdasarkan hasil rekapitulasi evaluasi berkas administrasi dan nilai Ujian Berbasis Komputer (CBT) calon peserta didik, Panitia SPMB SMK Citra Negara Tahun Ajaran 2026/2027 dengan ini menetapkan:
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-lg bg-wash p-3.5">
              <Users size={30} className="shrink-0 text-forest" />
              <div className="leading-tight">
                <p className="text-[22px] font-semibold text-forest">{p.diterima} Siswa</p>
                <p className="text-[11.5px] text-ink/70">Dinyatakan DITERIMA dari {p.terverifikasi} Pendaftar Terverifikasi</p>
              </div>
            </div>

            <p className="mt-4 text-[13.5px] italic leading-relaxed text-ink/75">“{sambutan}”</p>

            <div className="mt-5 flex items-end justify-between gap-2">
              <p className="text-[11px] font-bold uppercase leading-snug tracking-wide text-ink">Rekapitulasi Kuota Kelulusan per Jurusan (Gelombang 1)</p>
              <p className="shrink-0 text-[10.5px] text-ink/55">Target Daya Tampung: {p.kapasitas}</p>
            </div>
            <div className="mt-2 overflow-x-auto rounded-lg bg-wash">
              <table className="w-full min-w-[400px] text-left text-[12px]">
                <thead>
                  <tr className="text-[10.5px] font-bold uppercase text-ink/75">
                    <th className="px-3 py-2.5">Program Keahlian</th>
                    <th className="px-2 py-2.5 text-center">Daftar</th>
                    <th className="px-2 py-2.5 text-center">Lolos</th>
                    <th className="px-2 py-2.5 text-center">Sisa Kuota Gel. 2</th>
                    <th className="px-3 py-2.5 text-right">Keterisian</th>
                  </tr>
                </thead>
                <tbody>
                  {p.rekap.map((r) => (
                    <tr key={r.program} className="border-t border-white/70">
                      <td className="px-3 py-2.5 font-medium text-ink">{PROGRAM_LAPORAN[r.program as ProgramKode]?.label ?? r.program}</td>
                      <td className="px-2 text-center text-ink/70">{r.daftar}</td>
                      <td className="px-2 text-center font-bold text-forest">{r.lolos}</td>
                      <td className="px-2 text-center text-ink/70">{r.sisa} kursi</td>
                      <td className="px-3 text-right font-semibold text-forest">{r.pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white bg-chip/30 font-semibold text-ink">
                    <td className="px-3 py-2.5">Total</td>
                    <td className="px-2 text-center">{totalDaftar}</td>
                    <td className="px-2 text-center text-forest">{p.diterima}</td>
                    <td className="px-2 text-center">{Math.max(p.kapasitas - p.diterima, 0)} kursi</td>
                    <td className="px-3 text-right text-forest">{p.kapasitas > 0 ? ((p.diterima / p.kapasitas) * 100).toFixed(1) : "0.0"}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 rounded-lg bg-chip/30 p-4 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-forest"><CalendarDays size={14} />Jadwal Wajib Daftar Ulang</p>
                <ul className="mt-2 space-y-1.5 text-[11.5px] leading-snug text-ink/80">
                  <li className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-forest" /><span><b>{rentang(mulai, selesai)}</b> ({SURAT.jamDaftarUlang})</span></li>
                  <li className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-forest" />Lokasi: {SURAT.lokasi}</li>
                  <li className="flex gap-2 text-[#c00000]"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#c00000]" />Calon siswa yang tidak hadir dianggap mengundurkan diri.</li>
                </ul>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-forest"><ListChecks size={14} />Berkas Wajib Dibawa</p>
                <ul className="mt-2 space-y-1.5 text-[11.5px] leading-snug text-ink/80">
                  {SURAT.berkas.map((b) => (
                    <li key={b} className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-forest" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-[220px] text-[10px] leading-snug text-ink/50">
                <p className="font-semibold text-ink/70">Dokumen Verifikasi Digital SPMB</p>
                Otentikasi terenkripsi resmi terdaftar pada Pangkalan Data Pokok SMK.
              </div>
              <div className="text-right text-[12px] text-ink">
                <p>Depok, {formatTanggal(tanggal)}</p>
                <p className="font-semibold">Kepala SMK Citra Negara,</p>
                <svg viewBox="0 0 160 56" className="ml-auto mt-1 h-12 w-36" fill="none" stroke="#0f5530" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M4 38 C 20 8, 34 6, 30 28 S 44 46, 58 20 S 76 4, 82 24 S 100 44, 112 18 C 122 2, 134 30, 156 14" />
                  <path d="M20 48 C 60 40, 100 54, 150 44" />
                </svg>
                <p className="font-semibold underline">{p.kepsekNama}</p>
              </div>
            </div>
          </article>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-wash px-4 py-3 text-[12.5px] text-ink/80 print:hidden">
            <span className="flex items-center gap-2">
              <CircleHelp size={16} className="text-forest" />
              Butuh penyesuaian lampiran daftar nama calon siswa yang diterima?
            </span>
            <Link href="/dashboard/kepsek/persetujuan" className="font-semibold text-forest hover:underline">
              Buka Master Data Kelulusan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}