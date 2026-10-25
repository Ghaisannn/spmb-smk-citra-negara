"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { jam, tglPendek } from "@/lib/admin-format";

export default function LogPlenoButton({
  items,
}: {
  items: { judul: string; detail: string; at: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-pastel px-4 text-[15px] font-medium text-ink/80 transition hover:bg-[#d4e6d9]"
      >
        <ScrollText size={17} />
        Log Rapat Pleno
      </button>

      {open && (
        <Modal wide title="Log Rapat Pleno" subtitle="Riwayat pengajuan dan keputusan penetapan hasil seleksi." onClose={() => setOpen(false)}>
          <ol className="space-y-3">
            {items.length === 0 && <p className="text-[13.5px] text-ink/60">Belum ada catatan.</p>}
            {items.map((l, i) => (
              <li key={i} className="rounded-lg bg-wash p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[14.5px] font-semibold text-ink">{l.judul}</p>
                  <span className="text-[11.5px] text-ink/60">
                    {tglPendek(l.at)}, {jam(new Date(l.at))} WIB
                  </span>
                </div>
                {l.detail && <p className="mt-1 text-[13px] leading-relaxed text-ink/75">{l.detail}</p>}
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </>
  );
}