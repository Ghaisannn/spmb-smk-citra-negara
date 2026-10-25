import { ShieldCheck } from "lucide-react";
import PengumumanEditor from "@/components/kepsek/PengumumanEditor";
import { requireRole } from "@/lib/auth";
import { getMatrix, getDraft, getLog, getPersetujuan, getRingkasan } from "@/lib/kepsek-data";

export const metadata = { title: "Pengumuman Final Hasil Seleksi | SMK Citra Negara" };

export default async function PengumumanKepsekPage() {
  const session = await requireRole("kepsek");
  const [draft, pers, matrix, r, log] = await Promise.all([
    getDraft(),
    getPersetujuan(),
    getMatrix(),
    getRingkasan(),
    getLog("pengumuman", 10),
  ]);

  const rekap = matrix.map((m) => ({
    program: m.program,
    daftar: m.pendaftar,
    lolos: m.diterima,
    sisa: Math.max(m.pagu - m.diterima, 0),
    pct: m.pagu > 0 ? (m.diterima / m.pagu) * 100 : 0,
  }));

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[620px]">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <ShieldCheck size={14} />
            Tahap Finalisasi Eksekutif
          </p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Pengumuman Final Hasil Seleksi SPMB</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">Pengelolaan draf surat pengumuman resmi dan aktivasi rilis hasil seleksi kelulusan calon siswa baru SMK Citra Negara ke portal publik.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-pastel px-3.5 py-2.5 text-[12px] font-medium leading-tight text-ink/80">
          <span className="size-1.5 rounded-full bg-forest" />
          TA 2026/2027<br />Gelombang 1
        </span>
      </div>

      <PengumumanEditor
        draft={draft}
        persetujuan={pers.status}
        rekap={rekap}
        kapasitas={matrix.reduce((a, m) => a + m.pagu, 0)}
        diterima={r.diterima}
        terverifikasi={r.terverifikasi}
        kepsekNama={session.nama}
        log={log.items}
        logTotal={log.total}
      />
    </div>
  );
}