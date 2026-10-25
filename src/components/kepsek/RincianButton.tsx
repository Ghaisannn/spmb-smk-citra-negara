"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Modal from "@/components/admin/Modal";

export type Rincian = {
  nama: string;
  noReg: string;
  sekolah: string;
  program: string;
  cbt: number | null;
  skor: number | null;
  status: string;
  jalur: string;
  catatan: string;
  peringkat: number | null;
  total: number | null;
};

const f = (v: number | null) => (v === null ? "-" : v.toFixed(2));

export default function RincianButton({ r }: { r: Rincian }) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ["Nomor Registrasi", r.noReg],
    ["Asal Sekolah", r.sekolah || "-"],
    ["Program Pilihan", r.program || "-"],
    ["Nilai CBT (Nilai Akhir)", f(r.skor ?? r.cbt)],
    ["Peringkat", r.peringkat !== null && r.total !== null ? `${r.peringkat} dari ${r.total}` : "Belum dihitung"],
    ["Status Kelulusan", r.status],
    ["Jalur", r.jalur],
    ["Catatan", r.catatan || "-"],
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-forest hover:underline"
      >
        Rincian
        <ChevronRight size={14} />
      </button>
      {open && (
        <Modal title={r.nama} subtitle="Rincian asesmen peserta seleksi" onClose={() => setOpen(false)}>
          <dl className="divide-y divide-line rounded-lg bg-wash px-4">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
                <dt className="text-ink/65">{k}</dt>
                <dd className="text-right font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
}