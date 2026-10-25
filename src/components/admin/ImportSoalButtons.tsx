"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Download, FileSpreadsheet, FileUp, TriangleAlert, X } from "lucide-react";
import Modal from "./Modal";

type Hasil = {
  ok: boolean;
  message: string;
  errors?: { baris: number; pesan: string }[];
  totalErrors?: number;
  perKategori?: { label: string; n: number }[];
};

const MAX_MB = 2;

function ukuran(b: number) {
  return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImportSoalButtons({ onDone }: { onDone: (message: string) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pickErr, setPickErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  const tutup = () => {
    if (busy) return;
    setOpen(false);
    setFile(null);
    setPickErr("");
    setHasil(null);
  };

  const pilih = (f: File | null) => {
    setPickErr("");
    setHasil(null);
    if (!f) return setFile(null);
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      return setPickErr("File harus berformat .xlsx (Excel 2007 ke atas).");
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setPickErr(`Ukuran file maksimal ${MAX_MB} MB.`);
    }
    setFile(f);
  };

  const impor = async () => {
    if (!file) return;
    setBusy(true);
    setHasil(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/soal/import", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      const h: Hasil = {
        ok: res.ok,
        message: json.message || (res.ok ? "Berhasil." : "Gagal mengimpor soal."),
        errors: json.errors,
        totalErrors: json.totalErrors,
        perKategori: json.perKategori,
      };
      setHasil(h);
      if (res.ok) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        onDone(h.message);
        router.refresh();
      }
    } catch {
      setHasil({ ok: false, message: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] hover:bg-wash";

  return (
    <>
      <a href="/api/admin/soal/template" className={btn}>
        <Download size={15} />
        Unduh Template
      </a>
      <button type="button" onClick={() => setOpen(true)} className={btn}>
        <FileSpreadsheet size={15} />
        Import Excel (.xlsx)
      </button>

      {open && (
        <Modal wide title="Import Soal dari Excel" subtitle="Tambahkan banyak butir soal sekaligus ke Bank Soal." onClose={tutup}>
          <ol className="space-y-2 text-[13px] text-ink/85">
            {[
              "Klik Unduh Template, lalu isi soal pada sheet Soal (satu baris = satu soal).",
              "Simpan file tetap dalam format .xlsx.",
              "Pilih file di bawah ini, lalu klik Impor Sekarang.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-wash px-3.5 py-2.5">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-forest">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>

          <div className="mt-4">
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#e4ebe6] bg-wash px-4 py-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-chip text-forest">
                  <FileSpreadsheet size={18} />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[14px] font-semibold text-ink">{file.name}</span>
                  <span className="text-[12px] text-ink/65">{ukuran(file.size)}</span>
                </span>
                <button
                  type="button"
                  aria-label="Hapus file"
                  disabled={busy}
                  onClick={() => {
                    pilih(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="inline-flex size-8 items-center justify-center rounded-md text-ink/60 hover:bg-white hover:text-[#c00000]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#b9d9c4] px-4 py-7 text-center transition hover:bg-wash">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-chip text-forest">
                  <FileUp size={20} />
                </span>
                <span className="text-[14px] font-semibold text-ink">Klik untuk memilih file Excel</span>
                <span className="text-[12px] text-ink/65">.xlsx, maksimal {MAX_MB} MB, maksimal 500 soal</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  className="sr-only"
                  onChange={(e) => pilih(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            {pickErr && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">{pickErr}</p>}
          </div>

          {hasil && hasil.ok && (
            <div className="mt-4 rounded-lg bg-[#e8f4ec] px-4 py-3 text-[13px] text-forest">
              <p className="flex items-center gap-2 font-semibold">
                <CircleCheck size={17} />
                {hasil.message}
              </p>
              {hasil.perKategori && (
                <ul className="mt-2 space-y-0.5 pl-6 text-[12.5px]">
                  {hasil.perKategori.map((k) => (
                    <li key={k.label}>
                      {k.label}: <b>{k.n}</b> soal
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hasil && !hasil.ok && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-[#c00000]">
              <p className="flex items-start gap-2 font-semibold">
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                {hasil.message}
              </p>
              {hasil.errors && hasil.errors.length > 0 && (
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded bg-white/70 p-2.5 text-[12.5px] text-ink/85">
                  {hasil.errors.map((e, i) => (
                    <li key={i}>
                      <b className="text-[#c00000]">Baris {e.baris}:</b> {e.pesan}
                    </li>
                  ))}
                  {hasil.totalErrors && hasil.totalErrors > hasil.errors.length && (
                    <li className="text-ink/60">...dan {hasil.totalErrors - hasil.errors.length} baris lainnya.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={tutup} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">
              {hasil?.ok ? "Selesai" : "Batal"}
            </button>
            {!hasil?.ok && (
              <button type="button" disabled={!file || busy} onClick={impor} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
                {busy ? "Mengimpor..." : "Impor Sekarang"}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}