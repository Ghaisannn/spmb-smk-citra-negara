import { DoorOpen, GraduationCap, UserPlus, Armchair } from "lucide-react";
import ProgramBoard from "@/components/admin/ProgramBoard";
import { requireRole } from "@/lib/auth";
import { getKuota } from "@/lib/admin-data";
import { PROGRAM_ADMIN, kapasitasOf } from "@/lib/program-admin";

export const metadata = { title: "Program Keahlian | SMK Citra Negara" };

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export default async function ProgramAdminPage() {
  await requireRole("admin");
  const items = await getKuota();

  const rombel = items.reduce((a, i) => a + i.rombel, 0);
  const kapasitas = items.reduce((a, i) => a + kapasitasOf(i.rombel), 0);
  const terisi = items.reduce((a, i) => a + i.terisi, 0);
  const pct = kapasitas > 0 ? Math.round((terisi / kapasitas) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-forest">
        <span className="size-1.5 rounded-full bg-forest" />
        Manajemen Kuota &amp; Jurusan
      </span>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
        Program Keahlian
      </h1>
      <p className="mt-1 max-w-[520px] text-[14.5px] leading-relaxed text-ink/75">
        Kelola daftar konsentrasi keahlian, kapasitas kuota penerimaan, dan pantau jumlah pendaftar per jurusan Tahun Ajaran 2026/2027.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} p-5`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">Total Pilihan Jurusan</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[34px] font-semibold leading-none text-ink">
              {Object.keys(PROGRAM_ADMIN).length}{" "}
              <span className="text-[13px] font-normal text-ink/65">Program Kejuruan</span>
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
              <GraduationCap size={20} />
            </span>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold leading-snug text-forest">
            Tersertifikasi LSP-P1 &amp; Industri
          </p>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">Total Kapasitas Kuota</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[34px] font-semibold leading-none text-ink">
              {kapasitas}{" "}
              <span className="text-[13px] font-normal text-ink/65">Siswa</span>
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
              <DoorOpen size={20} />
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-ink/65">
            {rombel} Rombongan Belajar (Rombel)
          </p>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">Total Pendaftar Masuk</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[34px] font-semibold leading-none text-ink">
              {terisi}{" "}
              <span className="text-[13px] font-normal text-ink/65">Calon Siswa</span>
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
              <UserPlus size={20} />
            </span>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold text-forest"> {pct}% Kuota Terisi</p>
        </div>

        <div className={`${card} p-5`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">Sisa Kuota Penerimaan</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[34px] font-semibold leading-none text-ink">
              {Math.max(kapasitas - terisi, 0)}{" "}
              <span className="text-[13px] font-normal text-ink/65">Kursi</span>
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
              <Armchair size={20} />
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-forest">Gelombang 1 Berlangsung</p>
        </div>
      </div>

      <div className="mt-2">
        <ProgramBoard items={items} />
      </div>
    </div>
  );
}