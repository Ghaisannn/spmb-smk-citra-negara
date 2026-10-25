import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
}) {
  const items: (number | "…")[] =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : page <= 3
        ? [1, 2, 3, "…", totalPages]
        : page >= totalPages - 2
          ? [1, "…", totalPages - 2, totalPages - 1, totalPages]
          : [1, "…", page - 1, page, page + 1, "…", totalPages];

  const arrow = "inline-flex size-8 items-center justify-center rounded-md text-ink/60";

  return (
    <nav className="flex items-center gap-1.5" aria-label="Halaman">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${arrow} hover:bg-wash`} aria-label="Sebelumnya">
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={`${arrow} opacity-40`}>
          <ChevronLeft size={16} />
        </span>
      )}

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-[13px] text-ink/50">
            …
          </span>
        ) : (
          <Link
            key={it}
            href={hrefFor(it)}
            aria-current={it === page ? "page" : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-[13px] font-medium transition ${
              it === page ? "bg-forest text-white" : "text-ink/80 hover:bg-wash"
            }`}
          >
            {it}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${arrow} hover:bg-wash`} aria-label="Berikutnya">
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${arrow} opacity-40`}>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}