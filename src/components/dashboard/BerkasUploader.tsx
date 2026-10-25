"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Contact,
  ExternalLink,
  FileText,
  FileUp,
  Landmark,
  Lock,
  RefreshCw,
  ScrollText,
  Trash2,
  TriangleAlert,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  JENIS_BERKAS,
  MAX_BERKAS_MB,
  labelFormat,
  ukuranText,
  type BerkasItem,
  type BerkasMap,
  type Ext,
  type JenisBerkas,
  type StatusBerkas,
} from "@/lib/berkas-config";

const ICON: Record<string, LucideIcon> = {
  kk: Users,
  akta: Landmark,
  ijazah: ScrollText,
  foto: Contact,
  rapor: BookOpen,
  piagam: Trophy,
};

const MIME_OK: Record<Ext, string[]> = {
  jpg: ["image/jpeg"],
  png: ["image/png"],
  pdf: ["application/pdf"],
};

const STATUS_UI: Record<StatusBerkas, { label: string; cls: string }> = {
  menunggu: { label: "Menunggu Verifikasi", cls: "bg-[#fff1b8] text-[#8a5a00]" },
  diterima: { label: "Diterima", cls: "bg-chip text-forest" },
  perlu_perbaikan: { label: "Perlu Perbaikan", cls: "bg-red-100 text-[#c00000]" },
};

function tanggal(iso: string) {
  return (
    new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function Card({
  j,
  item,
  busy,
  error,
  onPick,
  onDelete,
}: {
  j: JenisBerkas;
  item?: BerkasItem;
  busy: boolean;
  error?: string;
  onPick: (f: File | null) => void;
  onDelete: () => void;
}) {
  const Icon = ICON[j.kode] ?? FileText;
  const accept = j.ext.map((e) => (e === "jpg" ? ".jpg,.jpeg" : `.${e}`)).join(",");
  const locked = item?.status === "diterima";
  const ui = item ? STATUS_UI[item.status] : null;

  const picker = (label: string, primary: boolean) => (
    <label
      className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-[13.5px] font-semibold transition ${
        primary
          ? "bg-forest text-white hover:bg-brand-800"
          : "bg-wash text-forest hover:bg-[#d9f0e0]"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      {primary ? <FileUp size={16} /> : <RefreshCw size={15} />}
      {busy ? "Mengunggah..." : label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </label>
  );

  return (
    <article
      className={`rounded-2xl border-2 bg-white p-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)] transition ${
        item?.status === "perlu_perbaikan"
          ? "border-[#e9b4b4]"
          : item?.status === "diterima"
            ? "border-[#b9e5c8]"
            : "border-transparent"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex size-12 shrink-0 items-center justify-center rounded-lg ${
            item ? "bg-chip text-forest" : "bg-wash text-forest"
          }`}
        >
          <Icon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[17px] font-semibold leading-snug text-ink">{j.nama}</h3>
            <span
              className={`text-[11.5px] font-semibold ${
                j.wajib ? "text-forest" : "text-ink/60"
              }`}
            >
              {j.wajib ? "Wajib" : "Opsional"}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{j.desc}</p>
          <p className="mt-1.5 text-[11.5px] text-ink/55">
            Format {labelFormat(j.ext)} • Maks. {MAX_BERKAS_MB} MB
          </p>
        </div>
      </div>

      {item && ui ? (
        <div className="mt-4 rounded-xl bg-wash p-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-forest">
              <FileText size={19} />
            </span>
            <div className="min-w-0 flex-1 leading-snug">
              <p className="truncate text-[14px] font-medium text-ink">{item.namaAsli}</p>
              <p className="text-[11.5px] text-ink/65">
                {ukuranText(item.ukuran)} • {tanggal(item.uploadedAt)}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ui.cls}`}>
              {ui.label}
            </span>
          </div>

          {item.status === "perlu_perbaikan" && (
            <div className="mt-3 flex gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-[#c00000]">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>
                {item.catatan || "Berkas tidak dapat diverifikasi."} Silakan unggah ulang berkas yang benar.
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={`/api/berkas/file?jenis=${j.kode}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[13.5px] font-semibold text-forest shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition hover:bg-chip"
            >
              <ExternalLink size={15} />
              Lihat
            </a>
            {!locked && picker("Ganti File", false)}
            {!locked && (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13.5px] font-semibold text-[#c00000] transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={15} />
                Hapus
              </button>
            )}
            {locked && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-forest">
                <Lock size={14} />
                Terkunci karena sudah diverifikasi panitia
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-dashed border-[#b9d9c4] px-4 py-4">
          <span className="text-[13px] text-ink/70">Belum ada file yang diunggah.</span>
          {picker("Pilih File", true)}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">{error}</p>
      )}
    </article>
  );
}

export default function BerkasUploader({ items }: { items: BerkasMap }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = (kode: string, msg: string) =>
    setErrors((p) => ({ ...p, [kode]: msg }));

  const upload = async (j: JenisBerkas, f: File | null) => {
    setError(j.kode, "");
    if (!f) return;

    const allowed = j.ext.flatMap((e) => MIME_OK[e]);
    if (!allowed.includes(f.type)) {
      return setError(j.kode, `Format file harus ${labelFormat(j.ext)}.`);
    }
    if (f.size > MAX_BERKAS_MB * 1024 * 1024) {
      return setError(j.kode, `Ukuran file maksimal ${MAX_BERKAS_MB} MB.`);
    }

    setBusy(j.kode);
    try {
      const fd = new FormData();
      fd.append("jenis", j.kode);
      fd.append("file", f);
      const res = await fetch("/api/berkas", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.kode, json.message || "Gagal mengunggah berkas.");
        return;
      }
      router.refresh();
    } catch {
      setError(j.kode, "Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (j: JenisBerkas) => {
    if (!window.confirm(`Hapus berkas "${j.nama}"?`)) return;
    setError(j.kode, "");
    setBusy(j.kode);
    try {
      const res = await fetch(`/api/berkas?jenis=${j.kode}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.kode, json.message || "Gagal menghapus berkas.");
        return;
      }
      router.refresh();
    } catch {
      setError(j.kode, "Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {JENIS_BERKAS.map((j) => (
        <Card
          key={j.kode}
          j={j}
          item={items[j.kode]}
          busy={busy === j.kode}
          error={errors[j.kode]}
          onPick={(f) => upload(j, f)}
          onDelete={() => remove(j)}
        />
      ))}
    </div>
  );
}