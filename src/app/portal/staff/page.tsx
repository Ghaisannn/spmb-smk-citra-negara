import type { Metadata } from "next";
import AuthHeader from "@/components/portal/AuthHeader";
import StaffLoginForm from "@/components/portal/StaffLoginForm";

export const metadata: Metadata = {
  title: "Login Staff | SMK Citra Negara",
};

export default function StaffLoginPage() {
  return (
    <main className="min-h-screen bg-mint">
      <AuthHeader />

      <div className="mx-auto mt-10 w-full max-w-[478px] px-4 pb-16 sm:mt-16">
        <div className="overflow-hidden rounded-md border-t-[6px] border-forest bg-white p-8 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
          <h1 className="text-[20px] font-bold text-ink">Login Staff</h1>
          <p className="mt-1 text-[14px] text-ink/80">
            Kelola dan pantau proses SPMB sesuai akses Anda.
          </p>
          <StaffLoginForm />
        </div>
      </div>
    </main>
  );
}