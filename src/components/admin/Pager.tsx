"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const items: (number | "…")[] =
    total <= 7
      ? Array.from({ length: total }, (_, i) => i + 1)
      : page <= 3
        ? [1, 2, 3, "…", total]
        : page >= total - 2
          ? [1, "…", total - 2, total - 1, total]
          : [1, "…", page - 1, page, page + 1, "…", total];

  const arrow =
    "inline-flex size-8 items-center justify-center rounded-md text-ink/60 hover:bg-wash disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <nav className="flex items-center gap-1.5" aria-label="Halaman">
      <button type="button" className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Sebelumnya">
        <ChevronLeft size={16} />
      </button>
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-[13px] text-ink/50">…</span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={it === page ? "page" : undefined}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition ${
              it === page ? "bg-forest text-white" : "text-ink/80 hover:bg-wash"
            }`}
          >
            {it}
          </button>
        )
      )}
      <button type="button" className={arrow} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label="Berikutnya">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}