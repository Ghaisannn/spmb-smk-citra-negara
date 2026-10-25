"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { jam } from "@/lib/admin-format";

export default function MonitoringSync({ exportHref }: { exportHref: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap justify-end gap-2">
        <a
          href={exportHref}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
        >
          <Download size={16} />
          Export Data Monitoring
        </a>
        <button
          type="button"
          onClick={() => {
            router.refresh();
            setMsg(`Disinkronkan pukul ${jam()} WIB`);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-4 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800"
        >
          <RefreshCw size={15} />
          Sinkronisasi CBT Real-Time
        </button>
      </div>
      {msg && <p className="text-[12px] font-medium text-forest">{msg}</p>}
    </div>
  );
}