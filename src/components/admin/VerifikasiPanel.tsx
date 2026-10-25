"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Baby,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCheck,
  Contact,
  Eye,
  FolderOpen,
  Info,
  Landmark,
  NotebookPen,
  RotateCcw,
  ScrollText,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ukuranText, type StatusBerkas } from "@/lib/berkas-config";

export type DocRow = {
  kode: string;
  nama: string;
  wajib: boolean;
  item: null | {
    namaAsli: string;
    ukuran: number;
    status: StatusBerkas;
    tanggal: string;
  };
};

const ICON: Record<string, LucideIcon> = {
  kk: Users,
  akta: Baby,
  ijazah: ScrollText,
  foto: Contact,
  rapor: BookOpen,
  piagam: Trophy,
};

const CHIP: Record<StatusBerkas, { text: string; cls: string; dot: string }> = {
  diterima: { text: "Sesuai & Jelas", cls: "bg-chip text-forest", dot: "bg-forest" },
  menunggu: { text: "Menunggu Pemeriksaan", cls: "bg-[#fff1b8] text-[#8a5a00]", dot: "bg-orange-500" },
  perlu_perbaikan: { text: "Perlu Revisi", cls: "bg-red-100 text-[#c00000]", dot: "bg-[#c00000]" },
};

const TEMPLATES = [
  {
    label: "Nomor SKL Kurang",
    text: "Nomor SKL kurang lengkap atau tidak terbaca. Mohon unggah ulang scan yang jelas.",
  },
  {
    label: "Scan KK Terpotong",
    text: "Scan Kartu Keluarga terpotong. Mohon unggah ulang scan KK secara utuh.",
  },
];

type Decision = "terima" | "revisi" | null;

export default function VerifikasiPanel({
  userId,
  rows,
  catatanAwal,
  backHref,
  diaksesLabel,
}: {
  userId: number;
  rows: DocRow[];
  catatanAwal: string;
  backHref: string;
  diaksesLabel: string;
}) {
  const router = useRouter();
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.kode,
        r.item?.status === "diterima"
          ? "terima"
          : r.item?.status === "perlu_perbaikan"
            ? "revisi"
            : null,
      ])
    )
  );
  const [catatan, setCatatan] = useState(catatanAwal);
  const [loading, setLoading] = useState<"revisi" | "setuju" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = (kode: string, d: Decision) =>
    setDecisions((p) => ({ ...p, [kode]: p[kode] === d ? null : d }));

  const setujuiSemua = () =>
    setDecisions((p) => {
      const n = { ...p };
      for (const r of rows) if (r.item) n[r.kode] = "terima";
      return n;
    });

  const addTemplate = (t: string) =>
    setCatatan((p) => (p.trim() ? `${p.trim()} ${t}` : t).slice(0, 255));

  const commit = async (mode: "revisi" | "setuju") => {
    setMsg(null);
    const uploaded = rows.filter((r) => r.item);

    if (mode === "revisi") {
      if (!uploaded.some((r) => decisions[r.kode] === "revisi")) {
        return setMsg({ type: "err", text: "Tandai minimal satu berkas dengan tombol Revisi." });
      }
    } else {
      const belum = rows.filter((r) => r.wajib && !r.item);
      if (belum.length > 0) {
        return setMsg({
          type: "err",
          text: `Berkas wajib belum diunggah siswa: ${belum.map((r) => r.nama).join(", ")}.`,
        });
      }
      const bad = uploaded.filter(
        (r) => decisions[r.kode] !== "terima" && (r.wajib || decisions[r.kode] === "revisi")
      );
      if (bad.length > 0) {
        return setMsg({
          type: "err",
          text: `Tandai Terima terlebih dahulu untuk: ${bad.map((r) => r.nama).join(", ")}.`,
        });
      }
    }

    const payload: Record<string, string> = {};
    for (const r of uploaded) {
      const d = decisions[r.kode];
      if (d === "terima") payload[r.kode] = "diterima";
      if (d === "revisi") payload[r.kode] = "perlu_perbaikan";
    }

    setLoading(mode);
    try {
      const res = await fetch("/api/admin/berkas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, decisions: payload, catatan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setMsg({ type: "err", text: json.message || "Gagal menyimpan keputusan." });
      }
      setMsg({
        type: "ok",
        text:
          mode === "setuju"
            ? "Data pendaftar berhasil diverifikasi dan disetujui."
            : "Permintaan revisi tersimpan dan tampil di dashboard siswa.",
      });
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setLoading(null);
    }
  };

  const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

  return (
    <div className="space-y-4">
      {/* Instruksi */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[420px]">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
              <FolderOpen size={14} />
              Instruksi Petugas Loket
            </p>
            <h2 className="mt-1 text-[20px] font-medium text-ink">
              Daftar Dokumen Persyaratan Siswa
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
              Periksa kesesuaian fisik pindaian terhadap NIK, nama lengkap, serta stempel legalisir.
            </p>
          </div>
          <button
            type="button"
            onClick={setujuiSemua}
            className="inline-flex min-h-[54px] items-center gap-2 rounded-lg bg-wash px-4 text-left text-[13px] font-semibold leading-tight text-forest transition hover:bg-[#d9f0e0]"
          >
            <CheckCheck size={18} />
            Setujui
            <br />
            Semua
          </button>
        </div>
      </section>

      {/* Dokumen */}
      {rows.map((r, i) => {
        const Icon = ICON[r.kode] ?? Contact;
        const d = decisions[r.kode];
        const chip = r.item ? CHIP[r.item.status] : null;
        return (
          <section key={r.kode} className={`${card} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
                <Icon size={22} />
              </span>

              <div className="min-w-[200px] flex-1">
                <h3 className="text-[18px] font-medium leading-snug text-ink">
                  {i + 1}. {r.nama}
                  {!r.wajib && (
                    <span className="ml-2 text-[11.5px] font-medium text-ink/55">(Opsional)</span>
                  )}
                </h3>

                {r.item && chip ? (
                  <>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11.5px] font-semibold ${chip.cls}`}
                    >
                      <span className={`size-1.5 rounded-full ${chip.dot}`} />
                      {chip.text}
                    </span>
                    <p className="mt-1.5 break-all text-[12px] leading-snug text-ink/65">
                      {r.item.namaAsli} • {ukuranText(r.item.ukuran)} • Diunggah {r.item.tanggal}
                    </p>
                  </>
                ) : (
                  <span className="mt-1.5 inline-flex rounded bg-pastel px-2 py-0.5 text-[11.5px] font-medium text-ink/60">
                    Belum diunggah siswa
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {r.item ? (
                  <a
                    href={`/api/berkas/file?jenis=${r.kode}&user=${userId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-wash px-3 text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
                  >
                    <Eye size={15} />
                    Lihat
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={!r.item}
                  onClick={() => set(r.kode, "terima")}
                  aria-pressed={d === "terima"}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    d === "terima"
                      ? "bg-forest text-white"
                      : "bg-wash text-forest hover:bg-[#d9f0e0]"
                  }`}
                >
                  <Check size={15} strokeWidth={3} />
                  Terima
                </button>
                <button
                  type="button"
                  disabled={!r.item}
                  onClick={() => set(r.kode, "revisi")}
                  aria-pressed={d === "revisi"}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    d === "revisi"
                      ? "bg-red-100 text-[#c00000] ring-1 ring-[#c00000]"
                      : "bg-wash text-[#c00000] hover:bg-red-50"
                  }`}
                >
                  <X size={15} strokeWidth={3} />
                  Revisi
                </button>
              </div>
            </div>
          </section>
        );
      })}

      {/* Catatan */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="flex items-start gap-2 text-[18px] font-medium leading-snug text-ink">
            <NotebookPen size={18} className="mt-1 shrink-0 text-ink/60" />
            Catatan Perbaikan / Alasan Revisi untuk Siswa
          </h3>
          <span className="text-[11px] text-ink/50">Opsional jika berkas ditolak</span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink/70">
          Catatan ini akan ditampilkan di dashboard akun siswa pada berkas yang ditandai Revisi.
        </p>
        <textarea
          value={catatan}
          maxLength={255}
          onChange={(e) => setCatatan(e.target.value)}
          rows={4}
          placeholder="Tuliskan alasan revisi (contoh: Foto dokumen buram, mohon unggah ulang scan asli)..."
          className="mt-3 w-full resize-none rounded-lg border border-transparent bg-wash px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink/40 focus:border-forest focus:ring-2 focus:ring-forest/15"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink/65">
          <Info size={14} />
          Template cepat:
          {TEMPLATES.map((t, i) => (
            <span key={t.label} className="inline-flex items-center gap-2">
              {i > 0 && <span className="size-1 rounded-full bg-ink/30" />}
              <button
                type="button"
                onClick={() => addTemplate(t.text)}
                className="font-semibold text-forest hover:underline"
              >
                {t.label}
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Aksi */}
      <section className={`${card} p-5 sm:p-6`}>
        {msg && (
          <p
            className={`mb-4 rounded px-3 py-2 text-[13px] ${
              msg.type === "ok" ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"
            }`}
          >
            {msg.text}
          </p>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="flex items-center gap-2 text-[12px] text-ink/60">
            <RotateCcw size={14} />
            Terakhir diakses: {diaksesLabel}
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Link
              href={backHref}
              className="inline-flex h-10 items-center justify-center rounded-md bg-wash px-8 text-[14px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
            >
              Kembali
            </Link>
            <button
              type="button"
              onClick={() => commit("revisi")}
              disabled={loading !== null}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#fff1b8] px-6 text-[14px] font-semibold text-[#8a5a00] transition hover:bg-[#ffe98f] disabled:opacity-60"
            >
              <RotateCcw size={15} />
              {loading === "revisi" ? "Menyimpan..." : "Kirim Permintaan Revisi"}
            </button>
            <button
              type="button"
              onClick={() => commit("setuju")}
              disabled={loading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:opacity-60"
            >
              <BadgeCheck size={17} />
              {loading === "setuju" ? "Menyimpan..." : "Verifikasi & Setujui Data"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}