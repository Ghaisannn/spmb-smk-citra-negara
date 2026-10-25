import type { Metadata } from "next";
import AuthHeader from "@/components/portal/AuthHeader";
import DaftarForm from "@/components/portal/DaftarForm";

export const metadata: Metadata = {
  title: "Daftar Akun Calon Siswa | SMK Citra Negara",
};

export default function DaftarPage() {
  return (
    <main className="min-h-screen bg-mint">
      <AuthHeader />

      <div className="mx-auto mt-8 w-full max-w-[663px] px-4 pb-16">
        <div className="overflow-hidden rounded-md border-t-[6px] border-forest bg-white p-6 pb-8 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-10 sm:pb-8">
          <h1 className="text-[24px] font-bold leading-tight text-ink">
            Daftar Akun Calon Siswa
          </h1>
          <p className="mt-1 text-[14px] text-ink/80">
            Buat akun untuk memulai proses pendaftaran SPMB.
          </p>
          <DaftarForm />
        </div>
      </div>
    </main>
  );
}