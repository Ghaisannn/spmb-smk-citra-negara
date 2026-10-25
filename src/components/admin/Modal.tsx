"use client";

import { X } from "lucide-react";

export const inputCls =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] outline-none placeholder:text-ink/40 focus:border-forest focus:ring-2 focus:ring-forest/15";

export default function Modal({
  title,
  subtitle,
  onClose,
  wide,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${
          wide ? "max-w-[640px]" : "max-w-[480px]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[12.5px] text-ink/65">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink/60 hover:bg-wash"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}