"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/portal");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-pastel px-4 text-[13px] font-semibold text-forest transition hover:bg-brand-200"
    >
      <LogOut size={15} />
      Keluar
    </button>
  );
}