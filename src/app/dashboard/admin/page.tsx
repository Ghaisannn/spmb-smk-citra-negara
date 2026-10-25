import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  FileUp,
  History,
  ListChecks,
  UserPlus,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAktivitas, getDashboardStats, type Aktivitas } from "@/lib/admin-data";
import { relTime, tglPanjang } from "@/lib/admin-format";
import { getJenis } from "@/lib/berkas-config";
import { HELPDESK } from "@/lib/jadwal-config";
import { PROGRAM_ADMIN } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";

export const metadata = { title: "Dashboard Admin | SMK Citra Negara" };

const base = "/dashboard/admin";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Stat({
  label,
  icon,
  value,
  caption,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  caption: string;
}) {
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-ink/80">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
          {icon}
        </span>
      </div>
      <p className="mt-5 text-[30px] font-semibold leading-none text-ink">
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-2 text-[12.5px] text-ink/55">{caption}</p>
    </div>
  );
}

function Log({ a }: { a: Aktivitas }) {
  const jenis = a.jenis ? getJenis(a.jenis)?.nama : "";
  const prog = a.program ? PROGRAM_ADMIN[a.program as ProgramKode]?.singkat : "";

  const meta =
    a.kind === "baru"
      ? {
          icon: <UserPlus size={19} />,
          box: "bg-chip text-forest",
          title: `Pendaftar baru masuk: ${a.nama}`,
          body: a.sekolah ? (
            <>
              Asal sekolah <b className="font-medium text-ink">{a.sekolah}</b>
              {prog && (
                <>
                  , memilih peminatan <span className="text-forest">({prog})</span>
                </>
              )}
              .
            </>
          ) : (
            <>Membuat akun calon siswa dan belum melengkapi biodata.</>
          ),
        }
      : a.kind === "unggah"
        ? {
            icon: <FileUp size={19} />,
            box: "bg-pastel text-forest",
            title: `Berkas baru diunggah: ${a.nama}`,
            body: (
              <>
                Mengunggah lampiran dokumen <b className="font-medium text-ink">{jenis}</b>.
              </>
            ),
          }
        : {
            icon: <CircleCheck size={19} />,
            box: "bg-chip text-forest",
            title: `Berkas diverifikasi: ${a.nama}`,
            body: (
              <>
                Dokumen <b className="font-medium text-ink">{jenis}</b> dinyatakan sesuai dan disetujui panitia.
              </>
            ),
          };

  return (
    <Link
      href={`${base}/verifikasi/${a.userId}`}
      className="flex gap-3 rounded-lg bg-wash p-4 transition hover:bg-[#dcefe2]"
    >
      <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${meta.box}`}>
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3">
          <p className="text-[15px] font-medium text-ink">{meta.title}</p>
          <span className="text-[11.5px] text-ink/55">{relTime(a.at)}</span>
        </div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/70">{meta.body}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const [s, aktivitas] = await Promise.all([getDashboardStats(), getAktivitas()]);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[12px] font-medium text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Tahun Ajaran 2026/2027 • Gelombang 1 Aktif
          </span>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Selamat Datang, Admin Panitia
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/75">
            Kelola proses penerimaan peserta didik dari satu tempat. Pantau berkas masuk, verifikasi berkas, dan tindak lanjuti alur administrasi hari ini.
          </p>
        </div>
        <div className={`${card} flex items-center gap-3 px-4 py-3`}>
          <Calendar size={22} className="text-forest" />
          <span className="leading-tight">
            <span className="block text-[11px] uppercase tracking-wide text-ink/60">Hari Ini</span>
            <span className="block text-[14px] font-semibold text-ink">{tglPanjang()}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Pendaftar" icon={<Users size={20} />} value={s.total} caption="Calon Siswa Terdaftar" />
        <Stat label="Biodata Lengkap" icon={<ClipboardList size={20} />} value={s.biodata} caption="Siswa Mengisi Lengkap" />
        <Stat label="Menunggu Verifikasi" icon={<ClipboardCheck size={20} />} value={s.berkasMenunggu} caption="Berkas Perlu Diperiksa" />
        <Stat label="Diterima" icon={<CircleCheck size={20} />} value={s.diterima} caption="Siswa Lolos Berkas & Tes" />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Aktivitas */}
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
                <History size={19} />
              </span>
              <div>
                <h2 className="text-[19px] font-medium text-ink">Aktivitas Terbaru</h2>
                <p className="text-[12px] text-ink/65">Log aksi dan pendaftaran masuk secara waktu nyata</p>
              </div>
            </div>
            <span className="text-[11.5px] font-bold tracking-wide text-forest">LIVE LOG</span>
          </div>

          <div className="mt-4 space-y-3">
            {aktivitas.length === 0 ? (
              <p className="rounded-lg bg-wash p-6 text-center text-[13.5px] text-ink/65">
                Belum ada aktivitas pendaftaran.
              </p>
            ) : (
              aktivitas.map((a, i) => <Log key={`${a.kind}-${a.userId}-${i}`} a={a} />)
            )}
          </div>
        </section>

        {/* Tugas */}
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
                <ListChecks size={19} />
              </span>
              <div>
                <h2 className="text-[19px] font-medium text-ink">Tugas Hari Ini</h2>
                <p className="text-[12px] text-ink/65">Daftar tindakan langsung panitia SPMB</p>
              </div>
            </div>
            <span className="rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-medium text-ink/80">
              3 Tugas
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-[#f1f8f3] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-[16px] font-medium text-ink">
                  <span className="size-2 rounded-full bg-[#c00000]" />
                  Verifikasi berkas
                </p>
                <span className="rounded bg-pastel px-2 py-0.5 text-[11px] text-ink/70">Prioritas</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/75">
                Terdapat {s.berkasMenunggu} berkas baru masuk dari pendaftar online yang siap diperiksa kelengkapannya hari ini.
              </p>
              <Link
                href={`${base}/verifikasi`}
                className="mt-3 flex h-10 items-center justify-between rounded-md bg-forest px-4 text-[14px] font-semibold text-white transition hover:bg-brand-800"
              >
                Buka Loket Verifikasi
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="rounded-xl bg-[#f1f8f3] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-[16px] font-medium text-ink">
                  <span className="size-2 rounded-full bg-forest" />
                  Periksa pembayaran &amp; data pendaftar
                </p>
                <span className="rounded bg-pastel px-2 py-0.5 text-[11px] text-ink/70">Review</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/75">
                Ada {s.bayarMenunggu} bukti transfer menunggu pemeriksaan dan {s.belumBerkas} pendaftar berbiodata lengkap yang belum mengunggah berkas.
              </p>
              <Link
                href={`${base}/verifikasi?tab=pembayaran`}
                className="mt-3 flex h-10 items-center justify-between rounded-md bg-pastel px-4 text-[14px] font-medium text-ink transition hover:bg-[#d4e6d9]"
              >
                Lihat Data
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="rounded-xl bg-[#f1f8f3] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-[16px] font-medium text-ink">
                  <span className="size-2 rounded-full bg-ink/45" />
                  Publikasikan pengumuman
                </p>
                <span className="rounded bg-pastel px-2 py-0.5 text-[11px] text-ink/70">Informasi</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/75">
                Draft surat panduan teknis CBT Gelombang 1 telah disetujui koordinator dan siap diterbitkan ke portal siswa.
              </p>
              <Link
                href={`${base}/pengumuman`}
                className="mt-3 flex h-10 items-center justify-between rounded-md bg-pastel px-4 text-[14px] font-medium text-ink transition hover:bg-[#d4e6d9]"
              >
                Tinjau Draft
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f1f8f3] px-4 py-3 text-[12.5px] text-ink/75">
              <span className="flex items-center gap-2">
                <CircleHelp size={17} className="shrink-0" />
                Kendala teknis loket atau berkas calon siswa?
              </span>
              <a
                href={HELPDESK.wa}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-semibold text-forest"
              >
                Hubungi IT
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}