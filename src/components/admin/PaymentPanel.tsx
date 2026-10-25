"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Wallet, X } from "lucide-react";

type Status = "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";

const UI: Record<Status, { label: string; cls: string }> = {
  belum_bayar: { label: "Belum Dibayar", cls: "bg-pastel text-ink/70" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-[#fff1b8] text-[#8a5a00]" },
  lunas: { label: "Lunas", cls: "bg-chip text-forest" },
  ditolak: { label: "Ditolak", cls: "bg-red-100 text-[#c00000]" },
};

export default function PaymentPanel({
  userId,
  status,
  nominal,
  bank,
  pengirim,
  waktu,
  catatan,
  adaBukti,
}: {
  userId: number;
  status: Status;
  nominal: string;
  bank: string;
  pengirim: string;
  waktu: string;
  catatan: string;
  adaBukti: boolean;
}) {
  const router = useRouter();
  const [tolak, setTolak] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (s: "lunas" | "ditolak") => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pembayaran", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: s, catatan: alasan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal memperbarui pembayaran.");
      setTolak(false);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const ui = UI[status];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[18px] font-medium text-ink">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-wash text-forest">
            <Wallet size={18} />
          </span>
          Verifikasi Pembayaran
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ui.cls}`}>
          {ui.label}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 rounded-lg bg-wash p-4 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink/65">Nominal</dt>
          <dd className="font-semibold text-ink">{nominal}</dd>
        </div>
        {status !== "belum_bayar" && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/65">Bank Pengirim</dt>
              <dd className="text-right font-semibold text-ink">{bank || "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/65">Nama Pengirim</dt>
              <dd className="text-right font-semibold text-ink">{pengirim || "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/65">Dikirim Pada</dt>
              <dd className="text-right font-semibold text-ink">{waktu}</dd>
            </div>
          </>
        )}
      </dl>

      {status === "belum_bayar" && (
        <p className="mt-3 text-[12.5px] text-ink/65">Siswa belum mengunggah bukti pembayaran.</p>
      )}
      {status === "ditolak" && catatan && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">
          Alasan penolakan: {catatan}
        </p>
      )}

      {adaBukti && (
        <a
          href={`/api/pembayaran/bukti?user=${userId}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-wash px-3 text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
        >
          <ExternalLink size={15} />
          Lihat Bukti Transfer
        </a>
      )}

      {status === "menunggu_verifikasi" && (
        <div className="mt-4">
          {tolak && (
            <input
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={255}
              placeholder="Alasan penolakan (contoh: Nominal tidak sesuai)"
              className="mb-3 h-10 w-full rounded-lg border border-transparent bg-wash px-3 text-[13px] outline-none placeholder:text-ink/40 focus:border-forest"
            />
          )}
          {error && (
            <p className="mb-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => send("lunas")}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-forest px-4 text-[13px] font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              <Check size={15} strokeWidth={3} />
              Terima Pembayaran
            </button>
            {tolak ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => send("ditolak")}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-red-100 px-4 text-[13px] font-semibold text-[#c00000] transition hover:bg-red-200 disabled:opacity-60"
              >
                <X size={15} strokeWidth={3} />
                Konfirmasi Tolak
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTolak(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-wash px-4 text-[13px] font-semibold text-[#c00000] transition hover:bg-red-50"
              >
                <X size={15} strokeWidth={3} />
                Tolak
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}