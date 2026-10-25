"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck, ChevronRight, Trash2 } from "lucide-react";
import { jam, relTime, tglPendek } from "@/lib/admin-format";
import { JENIS_LABEL, type NotifItem } from "@/lib/notifikasi-config";
import { JENIS_ICON, TONE_CLS } from "./notif-ui";

const zona = { timeZone: "Asia/Jakarta" } as const;

function labelHari(iso: string) {
  const kunci = (d: Date) => d.toLocaleDateString("en-CA", zona);
  const k = kunci(new Date(iso));
  if (k === kunci(new Date())) return "Hari Ini";
  if (k === kunci(new Date(Date.now() - 86400000))) return "Kemarin";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...zona,
  });
}

export default function NotifFeed({
  items,
  adaBelumDibaca,
  adaDibaca,
}: {
  items: NotifItem[];
  adaBelumDibaca: boolean;
  adaDibaca: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const panggil = async (method: "PATCH" | "DELETE", body?: unknown, query = "") => {
    const res = await fetch(`/api/notifikasi${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: (json.message as string) || "" };
  };

  const buka = async (n: NotifItem) => {
    if (!n.dibaca) await panggil("PATCH", { id: n.id }).catch(() => {});
    router.push(n.href);
  };

  const tandaiSemua = async () => {
    setBusy(true);
    const r = await panggil("PATCH", { all: true }).catch(() => null);
    setMsg(r?.message ?? "Gagal memproses permintaan.");
    setBusy(false);
    router.refresh();
  };

  const hapusDibaca = async () => {
    if (!window.confirm("Hapus semua notifikasi yang sudah dibaca?")) return;
    setBusy(true);
    const r = await panggil("DELETE", undefined, "?dibaca=1").catch(() => null);
    setMsg(r?.message ?? "Gagal memproses permintaan.");
    setBusy(false);
    router.refresh();
  };

  const grup: { label: string; rows: NotifItem[] }[] = [];
  for (const n of items) {
    const label = labelHari(n.at);
    const last = grup[grup.length - 1];
    if (last && last.label === label) last.rows.push(n);
    else grup.push({ label, rows: [n] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={!adaBelumDibaca || busy}
          onClick={tandaiSemua}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-wash px-4 text-[13px] font-semibold text-forest transition enabled:hover:bg-[#d9f0e0] disabled:opacity-45"
        >
          <CheckCheck size={15} />
          Tandai Semua Dibaca
        </button>
        <button
          type="button"
          disabled={!adaDibaca || busy}
          onClick={hapusDibaca}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-[#c00000] transition enabled:hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 size={15} />
          Hapus yang Sudah Dibaca
        </button>
      </div>

      {msg && <p className="mt-3 rounded-lg bg-[#e8f4ec] px-4 py-2.5 text-[13px] text-forest">{msg}</p>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-wash text-forest">
            <BellOff size={26} />
          </span>
          <p className="mt-4 text-[16px] font-semibold text-ink">Tidak ada notifikasi</p>
          <p className="mt-1 text-[13px] text-ink/60">
            Belum ada notifikasi pada tampilan ini.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {grup.map((g) => (
            <section key={g.label}>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink/55">
                {g.label}
              </h3>
              <ul className="space-y-2">
                {g.rows.map((n) => {
                  const Icon = JENIS_ICON[n.jenis];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => buka(n)}
                        className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition hover:border-[#b9d9c4] hover:bg-[#f7fbf8] ${
                          n.dibaca
                            ? "border-line bg-white"
                            : "border-[#c9e8d3] bg-[#f3fbf6]"
                        }`}
                      >
                        <span
                          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLS[n.tone]}`}
                        >
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[15px] leading-snug ${
                                n.dibaca ? "font-medium text-ink/85" : "font-semibold text-ink"
                              }`}
                            >
                              {n.judul}
                            </span>
                            {!n.dibaca && (
                              <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Baru
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-[13.5px] leading-relaxed text-ink/75">
                            {n.isi}
                          </span>
                          <span
                            suppressHydrationWarning
                            className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink/50"
                          >
                            <span className="rounded bg-pastel px-1.5 py-0.5 font-semibold text-ink/65">
                              {JENIS_LABEL[n.jenis]}
                            </span>
                            {tglPendek(n.at)}, {jam(new Date(n.at))} WIB • {relTime(n.at)}
                          </span>
                        </span>
                        <ChevronRight size={18} className="mt-3 shrink-0 text-ink/35" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}