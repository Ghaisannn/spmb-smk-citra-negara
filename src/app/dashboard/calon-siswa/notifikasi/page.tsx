import Link from "next/link";
import { Bell, RefreshCw } from "lucide-react";
import NotifFeed from "@/components/dashboard/NotifFeed";
import Pagination from "@/components/admin/Pagination";
import { requireRole } from "@/lib/auth";
import { buildQuery } from "@/lib/admin-format";
import { countNotifikasi, listNotifikasi } from "@/lib/notifikasi";
import { FILTERS, type NotifFilter } from "@/lib/notifikasi-config";

export const metadata = { title: "Notifikasi | SMK Citra Negara" };

const base = "/dashboard/calon-siswa/notifikasi";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export default async function NotifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const session = await requireRole("calon_siswa");
  const sp = await searchParams;

  const filter: NotifFilter = (FILTERS as readonly string[]).includes(sp.filter ?? "")
    ? (sp.filter as NotifFilter)
    : "semua";
  const page = Math.max(Number(sp.page) || 1, 1);

  const [c, list] = await Promise.all([
    countNotifikasi(session.id),
    listNotifikasi(session.id, { filter, page, perPage: 12 }),
  ]);

  const totalPages = Math.max(Math.ceil(list.total / list.perPage), 1);
  const href = (o: { filter?: string; page?: number }) =>
    `${base}${buildQuery({
      filter: (o.filter ?? filter) === "semua" ? undefined : (o.filter ?? filter),
      page: o.page && o.page > 1 ? o.page : undefined,
    })}`;

  const tabs: [NotifFilter, string, number][] = [
    ["semua", "Semua", c.semua],
    ["belum", "Belum Dibaca", c.belum],
    ["pendaftaran", "Pendaftaran", c.pendaftaran],
    ["ujian", "Ujian CBT", c.ujian],
    ["info", "Hasil & Info", c.info],
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-forest">
            <Bell size={13} />
            Pusat Notifikasi
          </span>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Notifikasi
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/75">
            Perkembangan pendaftaran Anda, mulai dari verifikasi berkas, pembayaran, sesi ujian, hingga hasil seleksi, tercatat di sini.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-3 py-1.5 text-[12px] font-medium text-ink/80">
          <RefreshCw size={13} className="text-forest" />
          Pembaruan Otomatis
        </span>
      </div>

      <section className={`${card} mt-6 p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map(([k, label, n]) => (
            <Link
              key={k}
              href={href({ filter: k, page: 1 })}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                filter === k ? "bg-forest text-white" : "bg-wash text-ink hover:bg-[#d9f0e0]"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  filter === k ? "bg-white/20" : "bg-white text-ink/70"
                }`}
              >
                {n}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-4">
          <NotifFeed
            items={list.rows}
            adaBelumDibaca={c.belum > 0}
            adaDibaca={c.semua - c.belum > 0}
          />
        </div>

        {list.total > list.perPage && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[12.5px] text-ink/70">
              Halaman <b className="text-ink">{list.page}</b> dari <b className="text-ink">{totalPages}</b>
            </p>
            <Pagination page={list.page} totalPages={totalPages} hrefFor={(p) => href({ page: p })} />
          </div>
        )}
      </section>
    </div>
  );
}