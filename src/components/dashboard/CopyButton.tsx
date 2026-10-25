"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      // abaikan jika browser menolak
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-wash px-3 text-[12px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
    >
      {done ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}