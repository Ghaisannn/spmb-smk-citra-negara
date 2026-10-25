import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  CirclePause,
  ClipboardCheck,
  FilePenLine,
  FileUp,
  PieChart,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Avatar, StatCard, card } from "@/components/kepsek/Ui";
import { TrenChart } from "@/components/kepsek/Charts";
import { requireRole } from "@/lib/auth";
import { getAktivitas } from "@/lib/admin-data";
import { jam, relTime } from "@/lib/admin-format";
import { getJenis } from "@/lib/berkas-config";
import { PROGRAM_LAPORAN } from "@/lib/kepsek-config";
import { getDraft, getPersetujuan, getRingkasan, getTren } from "@/lib/kepsek-data";
import { kapasitasOf } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Dashboard Kepala Sekolah | SMK Citra Negara" };

const base = "/dashboard/kepsek";
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default async function KepsekDashboard() {
  await requireRole("kepsek");
  const [r, tren, aktivitas, pers, draft] = await Promise.all([
    getRingkasan(),
    getTren(8),
    getAktivitas(),
    getPersetujuan(),
    getDraft(),
  ]);

  const weekly = tren.labels.map((label, i) => ({ label, n: tren.daftar[i] }));
  const avg = weekly.reduce((a, w) => a + w.n, 0) / weekly.length;
  const peak = weekly.reduce((m, w, i) => (w.n > weekly[m].n ? i : m), 0);
  const kirimPct = pct(r.biodata, r.semua);
  const verifPct = pct(r.terverifikasi, r.biodata);
  const cbtPct = pct(r.hadir, r.biodata);
  const terisiTotal = r.kuota.reduce((a, k) => a + k.terisi, 0);

  type St = "done" | "active" | "todo";
  const alur: { t: string; s: string; st: St }[] = [
    { t: "Pendaftaran Formulir Gel. 1", s: r.biodata > 0 ? "Selesai" : "Belum Ada", st: r.biodata > 0 ? "done" : "todo" },
    { t: "Verifikasi Dokumen Fisik/Online", s: verifPct >= 100 ? "100% Selesai" : `${verifPct}% Selesai`, st: verifPct >= 100 && r.biodata > 0 ? "done" : "todo" },
    { t: "Ujian CBT Akademik & Minat Bakat", s: cbtPct >= 100 ? "Selesai" : `${cbtPct}% Selesai`, st: cbtPct >= 100 && r.biodata > 0 ? "done" : "todo" },
    {
      t: "Sidang Pelno & Persetujuan".replace("Pelno", "Pleno"),
      s: pers.status === "disetujui" ? "Selesai" : pers.status === "revisi" ? "Direvisi" : r.diterima > 0 ? "Siap Ditinjau" : "Belum Siap",
      st: pers.status === "disetujui" ? "done" : r.diterima > 0 && pers.status === "menunggu" ? "active" : "todo",
    },
    { t: "Pengumuman Terbuka Kelulusan", s: draft.status === "terbit" ? "Terbit" : "Menunggu Approval", st: draft.status === "terbit" ? "done" : "todo" },
  ];

  const cta =
    pers.status === "disetujui" && draft.status === "terbit"
      ? { t: "Hasil Seleksi Telah Terbit", d: "Pengumuman sudah dipublikasikan ke portal siswa.", b: "Lihat Pengumuman", h: `${base}/pengumuman` }
      : pers.status === "disetujui"
        ? { t: "Hasil Disahkan, Siap Diumumkan", d: "Terbitkan surat pengumuman agar siswa dapat melihat hasilnya.", b: "Buka Pengumuman Final", h: `${base}/pengumuman` }
        : pers.status === "revisi"
          ? { t: "Menunggu Revisi Panitia", d: `Usulan dikembalikan: ${pers.catatanRevisi}`, b: "Lihat Detail Usulan", h: `${base}/persetujuan` }
          : { t: `${r.diterima} Siswa Menunggu Pengesahan`, d: "Hasil rapat komite seleksi dan rekomendasi jurusan sudah final. Anda dapat meninjau rincian nilai siswa sebelum menandatangani SK.", b: "Tinjau Usulan Pleno Sekarang", h: `${base}/persetujuan` };

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1 text-[12px] font-semibold text-forest">
        <span className="size-1.5 rounded-full bg-forest" />
        Tahun Ajaran 2026/2027 • Gelombang 1 Aktif
      </span>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Dashboard Eksekutif Kepala Sekolah</h1>
      <p className="mt-1 max-w-[600px] text-[14.5px] leading-relaxed text-ink/75">
        Pantau rekapitulasi pendaftaran, progres evaluasi tes seleksi, dan kesiapan penetapan kelulusan calon siswa baru SMK Citra Negara secara real-time dan terstruktur.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pendaftar" icon={<UserPlus size={20} />} value={r.semua} unit="Siswa">
          <span className="inline-flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded bg-chip px-1.5 py-0.5 text-[11px] font-bold text-forest"><TrendingUp size={11} />{kirimPct}%</span>formulir sudah terkirim</span>
        </StatCard>
        <StatCard label="Terverifikasi" icon={<ClipboardCheck size={20} />} value={r.terverifikasi} unit="Siswa">
          <span className="inline-flex items-center gap-2"><span className="rounded bg-chip px-1.5 py-0.5 text-[11px] font-bold text-forest">{verifPct}%</span>berkas valid administrasi</span>
        </StatCard>
        <StatCard label="Usulan Diterima" icon={<UserCheck size={20} />} value={r.diterima} unit="Siswa" tone="bg-chip text-forest" valueClass="text-forest">
          Keterisian kuota tahap <b className="text-forest">{pct(r.diterima, r.kapasitas)}%</b>
        </StatCard>
        <StatCard label="Total Cadangan" icon={<CirclePause size={20} />} value={r.cadangan} unit="Siswa" tone="bg-pastel text-ink/60">
          Standby kuota rombel Gelombang 1
        </StatCard>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-medium text-ink">Tren Pendaftaran Mingguan</h2>
              <p className="text-[12.5px] text-ink/65">8 minggu terakhir (akun calon siswa baru)</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-ink/75">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-forest" />Pendaftar</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#22a06b]" />Rerata</span>
            </div>
          </div>
          <div className="mt-3"><TrenChart data={weekly} /></div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-wash px-4 py-2.5 text-[12.5px] text-ink/75">
            <span className="flex items-center gap-2"><TrendingUp size={15} />Minggu tersibuk: {weekly[peak].label} ({weekly[peak].n} pendaftar)</span>
            <span className="font-semibold text-forest">Rata-rata: {avg.toFixed(1)} / mg</span>
          </div>
        </section>

        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-medium text-ink">Pilihan Program Keahlian</h2>
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink/65">Keterisian kuota {r.kuota.length} Jurusan (Total: {r.kapasitas} Kursi / {r.kuota.reduce((a, k) => a + k.rombel, 0)} Rombel)</p>
            </div>
            <PieChart size={20} className="shrink-0 text-ink/50" />
          </div>
          <div className="mt-4 space-y-3.5">
            {r.kuota.map((k, i) => {
              const kap = kapasitasOf(k.rombel);
              const p = pct(k.terisi, kap);
              return (
                <div key={k.kode}>
                  <div className="flex items-end justify-between gap-2 text-[12.5px]">
                    <span className="font-medium leading-snug text-ink">{PROGRAM_LAPORAN[k.kode as ProgramKode].label}</span>
                    <span className="shrink-0 text-right text-[11.5px] text-ink/65"><b className="text-forest">{k.terisi}</b> / {kap} ({p}%)</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-pastel">
                    <div className={`h-2.5 rounded-full ${i < 3 ? "bg-forest" : i === 3 ? "bg-[#3d8a63]" : "bg-[#9db5a6]"}`} style={{ width: `${Math.min(p, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
            <span className="text-ink/70">Akumulasi Kuota Terpenuhi</span>
            <span className="font-semibold text-ink">{terisiTotal} / {r.kapasitas} Kursi ({pct(terisiTotal, r.kapasitas)}%)</span>
          </div>
        </section>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[20px] font-medium text-ink"><FilePenLine size={19} className="text-forest" />Aktivitas Terkini Panitia SPMB</h2>
            <span className="text-[11.5px] text-ink/60">Diperbarui: {jam()} WIB</span>
          </div>
          <div className="mt-4 space-y-4">
            {aktivitas.length === 0 && <p className="rounded-lg bg-wash p-6 text-center text-[13.5px] text-ink/60">Belum ada aktivitas.</p>}
            {aktivitas.map((a, i) => {
              const jenis = a.jenis ? getJenis(a.jenis)?.nama : "";
              const m =
                a.kind === "baru"
                  ? { icon: <UserPlus size={18} />, box: "bg-chip text-forest", t: `Pendaftar Baru: ${a.nama}`, d: a.sekolah ? `Asal sekolah ${a.sekolah}.` : "Membuat akun calon siswa.", by: "Sistem Pendaftaran" }
                  : a.kind === "unggah"
                    ? { icon: <FileUp size={18} />, box: "bg-pastel text-forest", t: `Berkas Diunggah: ${a.nama}`, d: `Mengunggah dokumen ${jenis}.`, by: "Sistem Berkas" }
                    : { icon: <ShieldCheck size={18} />, box: "bg-pastel text-forest", t: `Berkas Diverifikasi: ${a.nama}`, d: `Dokumen ${jenis} dinyatakan sesuai dan disetujui.`, by: "Verifikator Loket" };
              return (
                <div key={i} className="flex gap-3">
                  <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${m.box}`}>{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3">
                      <p className="text-[14px] font-semibold text-ink">{m.t}</p>
                      <span className="text-[11.5px] text-ink/55">{relTime(a.at)}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink/70">{m.d}</p>
                    <p className="mt-0.5 text-[11.5px] font-medium text-forest">{m.by}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href={`${base}/monitoring`} className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest hover:underline">
            Lihat seluruh rekam audit aktivitas panitia <ArrowRight size={14} />
          </Link>
        </section>

        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="flex items-center gap-2 text-[20px] font-medium text-ink"><CircleCheck size={19} className="text-forest" />Status Alur Seleksi Gelombang 1</h2>
          <p className="mt-1 text-[12.5px] leading-snug text-ink/65">Tahapan verifikasi teknis selesai. Tahap krusial berikutnya adalah persetujuan pleno oleh Kepala Sekolah.</p>
          <div className="mt-4 space-y-2">
            {alur.map((a) => (
              <div key={a.t} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] ${a.st === "active" ? "bg-chip font-semibold text-forest" : a.st === "done" ? "bg-wash text-ink" : "bg-wash/60 text-ink/55"}`}>
                {a.st === "todo" ? <span className="size-[18px] shrink-0 rounded-full border-2 border-ink/25" /> : <CircleCheck size={18} className="shrink-0 text-forest" />}
                <span className="flex-1 leading-snug">{a.t}</span>
                <span className={`shrink-0 text-[11.5px] ${a.st === "active" ? "rounded-full bg-white px-2 py-0.5 font-bold" : "font-medium"}`}>{a.s}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-nav p-4 text-white">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[16px] font-semibold leading-snug">{cta.t}</p>
              <ClipboardCheck size={22} className="shrink-0" />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/85">{cta.d}</p>
            <Link href={cta.h} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-[14px] font-semibold text-forest transition hover:bg-wash">
              {cta.b} <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}