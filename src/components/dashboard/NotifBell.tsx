"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { relTime } from "@/lib/admin-format";
import { NOTIF_HREF, type NotifItem } from "@/lib/notifikasi-config";
import { JENIS_ICON, TONE_CLS } from "./notif-ui";

type Ringkas = { unread: number; items: NotifItem[] };

export default function NotifBell({ initial }: { initial: Ringkas }) {
  const router = useRouter();
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState(initial.items);
  const [unread, setUnread] = useState(initial.unread);
  const [open, setOpen] = useState(false);

  // Data baru dari server (setelah router.refresh).
  useEffect(() => {
    setItems(initial.items);
    setUnread(initial.unread);
  }, [initial]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifikasi?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as Ringkas;
      setItems(j.items);
      setUnread(j.unread);
    } catch {
      // abaikan, dicoba lagi pada polling berikutnya
    }
  }, []);

  // Muat ulang setiap pindah halaman.
  useEffect(() => {
    load();
  }, [pathname, load]);

  // Polling 30 detik + saat tab kembali aktif.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Tutup saat klik di luar atau tekan Esc.
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const buka = (n: NotifItem) => {
    setOpen(false);
    if (!n.dibaca) {
      setItems((p) => p.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifikasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    router.push(n.href);
  };

  const tandaiSemua = () => {
    setItems((p) => p.map((x) => ({ ...x, dibaca: true })));
    setUnread(0);
    fetch("/api/notifikasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
      .then(() => router.refresh())
      .catch(() => {});
  };

  return (
    <div ref={box} className="sm:relative print:hidden">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex size-10 items-center justify-center rounded-full border transition ${
          open
            ? "border-forest bg-wash text-forest"
            : "border-line bg-white text-ink/80 hover:bg-wash"
        }`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[#d92d20] px-1 text-[10.5px] font-bold leading-[16px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifikasi"
          className="absolute inset-x-3 top-[78px] z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(15,31,23,0.18)] sm:inset-x-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[400px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-ink">Notifikasi</h2>
              {unread > 0 && (
                <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-forest">
                  {unread} baru
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={unread === 0}
              onClick={tandaiSemua}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-forest transition hover:underline disabled:cursor-not-allowed disabled:text-ink/35 disabled:no-underline"
            >
              <CheckCheck size={14} />
              Tandai semua dibaca
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-wash text-forest">
                <BellOff size={22} />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">Belum ada notifikasi</p>
              <p className="mt-1 text-[12.5px] text-ink/60">
                Perkembangan pendaftaran Anda akan tampil di sini.
              </p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-line/70 overflow-y-auto">
              {items.map((n) => {
                const Icon = JENIS_ICON[n.jenis];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => buka(n)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-wash ${
                        n.dibaca ? "" : "bg-[#f3fbf6]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLS[n.tone]}`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[13.5px] leading-snug ${
                              n.dibaca ? "font-medium text-ink/85" : "font-semibold text-ink"
                            }`}
                          >
                            {n.judul}
                          </span>
                          {!n.dibaca && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-forest" />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink/70">
                          {n.isi}
                        </span>
                        <span
                          suppressHydrationWarning
                          className="mt-1 block text-[11px] text-ink/50"
                        >
                          {relTime(n.at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href={NOTIF_HREF.notifikasi}
            onClick={() => setOpen(false)}
            className="block border-t border-line bg-wash px-4 py-3 text-center text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      )}
    </div>
  );
}