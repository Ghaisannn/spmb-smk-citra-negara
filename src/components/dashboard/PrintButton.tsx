"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-5 text-[14px] font-semibold text-forest transition hover:bg-[#d9f0e0] print:hidden"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}