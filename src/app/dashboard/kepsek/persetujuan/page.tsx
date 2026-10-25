import Link from "next/link";
import { CircleCheck, FileText, Search, ShieldCheck, UserCheck, UserRoundCheck, Users } from "lucide-react";
import LogPlenoButton from "@/components/kepsek/LogPlenoButton";
import PersetujuanPanel from "@/components/kepsek/PersetujuanPanel";
import { StatCard, card } from "@/components/kepsek/Ui";
import { requireRole } from "@/lib/auth";
import { buildQuery } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { KEPSEK_NIP, PROGRAM_LAPORAN } from "@/lib/kepsek-config";
import { getDraft, getLog, getPersetujuan, listPleno } from "@/lib/kepsek-data";
import { getKuota } from "@/lib/admin-data";
import { kapasitasOf } from "@/lib/program-admin";
import { PROGRAM_KODE, type ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Persetujuan Hasil | SMK Citra Negara" };

const base = "/dashboard/kepsek/persetujuan";

export default async function PersetujuanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; program?: string; page?: string }>;
}) {
  const session = await requireRole("kepsek");
  const sp = await searchParams;
  const program = PROGRAM_KODE.includes(sp.program ?? "") ? (sp.program as string) : "";
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(Number(sp.page) || 1, 1);

  const [pers, draft, log, pleno, kuota, pleno0] = await Promise.all([
    getPersetujuan(),
    getDraft(),
    getLog("persetujuan"),
    listPleno({ q, program, page, perPage: 6 }),
    getKuota(),
    listPleno({ page: 1, perPage: 1 }),
  ]);

  const totalPages = Math.max(Math.ceil(pleno.total / pleno.perPage), 1);
  const offset = (pleno.page - 1) * pleno.perPage;
  const totalKap = kuota.reduce((a, k) => a + kapasitasOf(k.rombel), 0);
  const href = (o: { program?: string; page?: number }) =>
    `${base}${buildQuery({ q, program: o.program === undefined ? program : o.program, page: o.page && o.page > 1 ? o.page : undefined })}`;

  const statusChip =
    draft.status === "terbit"
      ? { t: "Hasil Telah Disahkan & Dipublikasikan", c: "bg-chip text-forest", d: "bg-forest" }
      : pers.status === "disetujui"
        ? { t: "Hasil Disahkan Kepala Sekolah", c: "bg-chip text-forest", d: "bg-forest" }
        : pers.status === "revisi"
          ? { t: "Dikembalikan ke Panitia untuk Revisi", c: "bg-red-100 text-[#c00000]", d: "bg-[#c00000]" }
          : { t: "Dokumen Pleno Menunggu Persetujuan Kepala Sekolah", c: "bg-chip text-forest", d: "bg-forest" };

  const tabs: { k: string; label: string; n: number }[] = [
    { k: "", label: "Semua", n: pleno0.total },
    ...(PROGRAM_KODE as readonly ProgramKode[]).map((k) => ({ k, label: PROGRAM_LAPORAN[k].tampil, n: pleno.tabCounts[k] ?? 0 })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${statusChip.c}`}>
          <span className={`size-1.5 rounded-full ${statusChip.d}`} />
          {statusChip.t}
        </span>
        <span className="rounded bg-pastel px-2.5 py-1 text-ink/70">No. Berkas: {pers.noBerkas}</span>
      </div>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Persetujuan Penetapan Hasil Seleksi</h1>
      <p className="mt-1 max-w-[640px] text-[14.5px] leading-relaxed text-ink/75">Validasi dan sahkan penetapan daftar kelulusan calon siswa baru Gelombang 1 sebelum diumumkan secara publik ke portal calon siswa.</p>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Link href="/dashboard/kepsek/pengumuman" className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-[15px] font-medium text-forest shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash">
          <FileText size={17} />
          Pratinjau Draf SK (.pdf)
        </Link>
        <LogPlenoButton items={log.items} />
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_1fr_1.7fr]">
        <StatCard label="Total Usulan Lolos" icon={<UserRoundCheck size={19} />} value={pleno.diterima} unit="Calon Siswa" valueClass="text-forest">
          <p className="rounded-lg bg-wash p-3 text-[11.5px]">Rekomendasi Utama Gel. 1 <b className="ml-1 text-forest">{pleno.pctValid}% Memenuhi Syarat</b></p>
        </StatCard>
        <StatCard label="Total Cadangan" icon={<Users size={19} />} value={pleno.cadangan} unit="Calon Siswa">
          <p className="rounded-lg bg-wash p-3 text-[11.5px]">Prioritas Pengganti <b className="ml-1 text-ink">3 Peringkat Tertinggi</b></p>
        </StatCard>
        <section className={`${card} p-5`}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex items-start gap-2 text-[18px] font-medium leading-snug text-ink"><CircleCheck size={18} className="mt-1 text-forest" />Keterisian Kuota Rombel ({kuota.length} Program Keahlian)</h2>
            <span className="shrink-0 text-right text-[11px] text-ink/60">Total Kapasitas: {totalKap} Siswa</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kuota.map((k) => {
              const kap = kapasitasOf(k.rombel);
              const p = kap > 0 ? Math.round((k.terisi / kap) * 100) : 0;
              return (
                <div key={k.kode} className="rounded-lg bg-wash p-2.5">
                  <div className="flex justify-between text-[12px]"><span className="font-medium text-ink">{PROGRAM_LAPORAN[k.kode as ProgramKode].tampil}</span><b className="text-forest">{p}%</b></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white"><div className="h-1.5 rounded-full bg-forest" style={{ width: `${Math.min(p, 100)}%` }} /></div>
                  <p className="mt-1.5 text-[10.5px] text-ink/60">{k.terisi} / {kap} Siswa</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div>
          <section className={`${card} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <Link key={t.k || "semua"} href={href({ program: t.k, page: 1 })} className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${program === t.k ? "bg-forest text-white" : "bg-pastel text-ink hover:bg-[#d4e6d9]"}`}>
                    {t.label} ({t.n})
                  </Link>
                ))}
              </div>
              <form method="get" className="flex h-10 min-w-[170px] items-center gap-2 rounded-lg bg-wash px-3">
                <Search size={15} className="text-ink/55" />
                <input name="q" defaultValue={q} placeholder="Cari nama / NISN..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink/45" />
                {program && <input type="hidden" name="program" value={program} />}
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="bg-wash text-[10.5px] font-semibold uppercase leading-snug tracking-wide text-ink/75">
                    <th className="px-4 py-3">No</th><th className="px-2 py-3">No. Registrasi</th><th className="px-2 py-3">Nama Calon Siswa</th>
                    <th className="px-2 py-3">Jurusan</th><th className="px-2 py-3">Nilai Akhir</th><th className="px-2 py-3">Rekomendasi Panitia</th><th className="px-3 py-3">Asal Sekolah</th>
                  </tr>
                </thead>
                <tbody>
                  {pleno.rows.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-[14px] text-ink/60">Belum ada peserta berstatus Diterima atau Cadangan.</td></tr>
                  )}
                  {pleno.rows.map((r, i) => (
                    <tr key={r.id} className="border-b border-line/70 align-middle">
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/60">{String(offset + i + 1).padStart(2, "0")}</td>
                      <td className="px-2 font-mono text-[11px] font-bold leading-snug text-forest">{nomorRegistrasi(r.id)}</td>
                      <td className="px-2 text-[13.5px] font-medium leading-snug text-ink">
                        <span className="inline-flex items-center gap-1.5">{r.nama}{r.hasil === "diterima" && <ShieldCheck size={14} className="shrink-0 text-forest" />}</span>
                      </td>
                      <td className="px-2"><span className="rounded bg-pastel px-2 py-1 text-[11.5px] font-semibold text-forest">{r.program ? (PROGRAM_LAPORAN[r.program as ProgramKode]?.tampil ?? r.program) : "-"}</span></td>
                      <td className="px-2 font-mono text-[12.5px] font-bold text-forest">{r.skor?.toFixed(2) ?? "-"}</td>
                      <td className="px-2">
                        {r.hasil === "diterima" ? (
                          <span className="inline-flex rounded-lg bg-[#c9f2d6] px-2.5 py-1.5 text-[11.5px] font-semibold leading-tight text-forest">Rekomendasi<br />Utama</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-pastel px-2.5 py-1.5 text-[11.5px] font-semibold leading-tight text-ink/75"><span className="size-1.5 rounded-full bg-ink/45" />Cadangan<br />Prioritas {r.prioritas ?? "-"}</span>
                        )}
                      </td>
                      <td className="px-3 text-[12px] leading-snug text-ink/70">{r.sekolah || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-wash px-4 py-3 text-[12px] text-ink/70">
              <span>Menampilkan {pleno.rows.length} dari {pleno.total} calon siswa dalam daftar pleno</span>
              <span className="flex items-center gap-2">
                {pleno.page > 1 ? <Link href={href({ page: pleno.page - 1 })} className="rounded bg-white px-3 py-1.5 font-medium text-ink">Sebelumnya</Link> : <span className="rounded bg-white/60 px-3 py-1.5 text-ink/40">Sebelumnya</span>}
                <span className="rounded bg-white px-3 py-1.5 font-semibold text-forest">Hal {pleno.page} dari {totalPages}</span>
                {pleno.page < totalPages ? <Link href={href({ page: pleno.page + 1 })} className="rounded bg-white px-3 py-1.5 font-medium text-ink">Selanjutnya</Link> : <span className="rounded bg-white/60 px-3 py-1.5 text-ink/40">Selanjutnya</span>}
              </span>
            </div>
          </section>

          <section className="mt-4 flex items-start gap-3 rounded-2xl bg-wash p-5">
            <ShieldCheck size={26} className="mt-0.5 shrink-0 text-forest" />
            <div>
              <p className="text-[17px] font-medium text-ink">Integritas Dokumen Digital</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink/70">Persetujuan menggunakan sistem tanda tangan digital tersertifikasi (Digital Signature Certificate) yang otomatis mengunci data seleksi Gelombang 1.</p>
            </div>
          </section>
        </div>

        <PersetujuanPanel
          status={pers.status}
          terbit={draft.status === "terbit"}
          diajukanAt={pers.diajukanAt}
          diajukanOleh={pers.diajukanOleh}
          jabatan={pers.jabatan}
          catatan={pers.catatan}
          keputusanAt={pers.keputusanAt}
          catatanRevisi={pers.catatanRevisi}
          kepsekNama={session.nama}
          nip={KEPSEK_NIP}
          diterima={pleno.diterima}
        />
      </div>
    </div>
  );
}