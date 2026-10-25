import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import AuthHeader from "@/components/portal/AuthHeader";
import SiswaLoginForm from "@/components/portal/SiswaLoginForm";

export const metadata: Metadata = {
  title: "Masuk Calon Siswa | SMK Citra Negara",
};

export default async function SiswaLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <main className="min-h-screen bg-mint">
      <AuthHeader />

      <div className="mx-auto mt-10 w-full max-w-[480px] px-4 pb-16 sm:mt-24">
        <div className="overflow-hidden rounded-md border-t-[6px] border-forest bg-white px-8 pb-12 pt-8 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <h1 className="mt-3 text-[24px] font-semibold leading-tight text-ink">
            Masuk ke Calon Siswa
          </h1>
          <p className="mt-1 text-[14px] leading-[22px] text-ink/80">
            Silakan masuk untuk melanjutkan proses pendaftaran atau memantau
            status seleksi berkas Anda.
          </p>

          {registered === "1" && (
            <div className="mt-5 flex items-start gap-2 rounded bg-[#e8f4ec] px-3 py-2.5 text-[13px] text-forest">
              <CircleCheck size={18} className="mt-0.5 shrink-0" />
              Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi Anda.
            </div>
          )}

          <SiswaLoginForm />
        </div>
      </div>
    </main>
  );
}