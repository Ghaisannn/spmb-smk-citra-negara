"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Printer } from "lucide-react";

const base = "/dashboard/calon-siswa";

export default function ReviewActions({ locked }: { locked: boolean }) {
  const router = useRouter();
  const [agree, setAgree] = useState(locked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/biodata/submit", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Gagal mengirim formulir.");
        return;
      }
      router.push(`${base}/formulir`);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const card =
    "inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-medium shadow-[0_1px_4px_rgba(0,0,0,0.1)]";

  return (
    <>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
        <label className={`flex gap-3 ${locked ? "" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={agree}
            disabled={locked}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-forest"
          />
          <span>
            <span className="block text-[17px] font-semibold text-ink">
              Pernyataan Keabsahan &amp; Kebenaran Data Pendaftaran
            </span>
            <span className="mt-1 block text-[14px] leading-relaxed text-ink/75">
              Saya menyatakan dengan sesungguhnya bahwa seluruh data yang saya isikan pada formulir pendaftaran ini adalah benar, sah, dan dapat dipertanggungjawabkan sesuai dokumen resmi negara. Apabila di kemudian hari ditemukan ketidaksesuaian atau pemalsuan data, saya bersedia menerima sanksi pembatalan kelulusan seleksi SPMB SMK Citra Negara Tahun Ajaran 2026/2027.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
        {locked ? (
          <Link href={base} className={`${card} text-ink`}>
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </Link>
        ) : (
          <Link href={`${base}/program`} className={`${card} text-ink`}>
            <ArrowLeft size={16} />
            Kembali ke Program Keahlian
          </Link>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className={`${card} text-forest transition hover:bg-wash`}
        >
          <Printer size={16} />
          Cetak Draft PDF
        </button>

        <span className={`${card} text-forest`}>
          <BadgeCheck size={17} />
          100% Siap Disimpan
        </span>

        {locked ? (
          <span className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-wash px-6 text-[14px] font-semibold text-forest">
            <Check size={16} strokeWidth={3} />
            Formulir Sudah Terkirim
          </span>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!agree || loading}
            className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Formulir Pendaftaran"}
            {!loading && <ArrowRight size={16} />}
          </button>
        )}
      </div>
    </>
  );
}