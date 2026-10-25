import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Headset,
  Lock,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Masuk ke Portal SPMB | SMK Citra Negara",
};

function PortalCard({
  icon,
  badge,
  title,
  desc,
  href,
  footer,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  desc: string;
  href: string;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
      <div className="flex items-start justify-between">
        <span className="inline-flex size-12 items-center justify-center rounded-lg bg-pastel text-forest">
          {icon}
        </span>
        <span className="rounded-full bg-pastel px-3 py-1 text-[11px] font-medium text-ink/70">
          {badge}
        </span>
      </div>

      <h2 className="mt-4 text-[20px] font-medium text-ink">{title}</h2>
      <p className="mt-1 min-h-[66px] text-[14px] leading-[22px] text-ink/70">
        {desc}
      </p>

      <Link
        href={href}
        className="mt-8 flex h-[38px] w-full items-center justify-center gap-1.5 rounded bg-pastel text-[14px] font-medium text-ink transition hover:bg-brand-200"
      >
        Masuk
        <ArrowRight size={15} />
      </Link>

      <p className="mt-3 text-center text-[12px] text-ink/70">{footer}</p>
    </div>
  );
}

export default function PortalPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Foto latar: jernih & tajam, tanpa overlay */}
      <Image
        src="/images/portal/bg-sekolah.jpg"
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
      />

      {/* Gradient hijau hanya di bagian bawah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#1fa97f]/95 via-[#2fb59a]/45 to-transparent" />

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Logo + badge */}
        <Image
          src="/images/logo/logo-smk-citra-negara.png"
          alt="Logo SMK Citra Negara"
          width={110}
          height={110}
          className="h-[100px] w-[100px] object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:h-[110px] sm:w-[110px]"
        />
        <span className="-mt-2 inline-flex items-center gap-1.5 rounded-full bg-pastel/95 px-3 py-1 text-[11px] font-bold tracking-wide text-brand-800">
          <span className="size-1.5 rounded-full bg-brand-800" />
          TAHUN AJARAN 2026/2027
        </span>

        {/* Judul */}
        <h1 className="mt-5 text-center text-[38px] font-bold leading-tight text-[#12d17f] drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-[54px]">
          Masuk ke Portal SPMB
        </h1>
        <p className="mt-3 text-center text-[15px] font-medium text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
          Silakan masuk untuk melanjutkan sesuai dengan peran Anda.
        </p>

        {/* Kartu */}
        <div className="mt-10 grid w-full max-w-[642px] gap-6 sm:grid-cols-2">
          <PortalCard
            icon={<GraduationCap size={22} />}
            badge="Pendaftar"
            title="Calon Siswa"
            desc="Untuk melakukan pendaftaran dan melihat status seleksi berkas serta pengumuman."
            href="/portal/siswa"
            footer={
              <>
                Belum punya akun?{" "}
                <Link href="/daftar" className="font-bold text-forest">
                  Daftar Akun Baru
                </Link>
              </>
            }
          />
          <PortalCard
            icon={<UserCheck size={22} />}
            badge="Operator"
            title="Staff"
            desc="Untuk mengelola dan memantau proses SPMB sebagai Admin Panitia atau Kepala Sekolah."
            href="/portal/staff"
            footer={
              <span className="inline-flex items-center gap-1">
                <Lock size={12} />
                Akses untuk Admin &amp; Kepala Sekolah
              </span>
            }
          />
        </div>

        {/* Bar bawah */}
        <div className="mt-10 flex w-full max-w-[896px] flex-wrap items-center justify-between gap-3 rounded-lg bg-white/90 px-6 py-3 backdrop-blur">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda Utama
          </Link>
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80">
            <Headset size={14} />
            Butuh bantuan terkait akses akun?{" "}
            <a href="#" className="font-bold text-forest">
              Hubungi Layanan SPMB
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}