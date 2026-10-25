"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileUp, Landmark, User, X } from "lucide-react";
import { BANK_PENGIRIM, MAX_BUKTI_MB } from "@/lib/pembayaran-config";
import { Field, SelectBox, TextBox } from "./FormParts";

type Errors = Partial<Record<"bank" | "nama" | "file", string>>;

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

function ukuran(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PembayaranForm({ namaAwal }: { namaAwal: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bank, setBank] = useState("");
  const [nama, setNama] = useState(namaAwal);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const pickFile = (f: File | null) => {
    setErrors((p) => ({ ...p, file: undefined }));
    if (!f) return setFile(null);

    if (!ALLOWED.includes(f.type)) {
      setFile(null);
      return setErrors((p) => ({ ...p, file: "Format file harus JPG, PNG, atau PDF." }));
    }
    if (f.size > MAX_BUKTI_MB * 1024 * 1024) {
      setFile(null);
      return setErrors((p) => ({ ...p, file: `Ukuran file maksimal ${MAX_BUKTI_MB} MB.` }));
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const errs: Errors = {};
    if (!bank) errs.bank = "Pilih bank pengirim.";
    if (nama.trim().length < 3) errs.nama = "Nama pengirim minimal 3 karakter.";
    if (!file) errs.file = errs.file ?? "Bukti transfer wajib diunggah.";
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !file) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("bank", bank);
      fd.append("nama", nama.trim());
      fd.append("bukti", file);

      const res = await fetch("/api/pembayaran", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(json.message || "Gagal mengirim bukti pembayaran.");
        return;
      }
      router.refresh();
    } catch {
      setServerError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bank / Dompet Digital Pengirim" required htmlFor="bank" error={errors.bank}>
          <SelectBox
            id="bank"
            icon={<Landmark size={18} />}
            value={bank}
            error={errors.bank}
            onChange={(e) => {
              setBank(e.target.value);
              setErrors((p) => ({ ...p, bank: undefined }));
            }}
          >
            <option value="">Pilih bank pengirim</option>
            {BANK_PENGIRIM.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </SelectBox>
        </Field>

        <Field
          label="Nama Pemilik Rekening Pengirim"
          required
          htmlFor="nama"
          error={errors.nama}
        >
          <TextBox
            id="nama"
            icon={<User size={18} />}
            value={nama}
            error={errors.nama}
            maxLength={100}
            onChange={(e) => {
              setNama(e.target.value);
              setErrors((p) => ({ ...p, nama: undefined }));
            }}
            placeholder="Nama sesuai rekening"
          />
        </Field>
      </div>

      <Field
        label="Bukti Transfer"
        required
        error={errors.file}
        help={`Format JPG, PNG, atau PDF. Maksimal ${MAX_BUKTI_MB} MB.`}
      >
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-[#e4ebe6] bg-wash px-4 py-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-chip text-forest">
              <FileUp size={18} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[14px] font-semibold text-ink">{file.name}</span>
              <span className="text-[12px] text-ink/65">{ukuran(file.size)}</span>
            </span>
            <button
              type="button"
              aria-label="Hapus file"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="inline-flex size-8 items-center justify-center rounded-md text-ink/60 hover:bg-white hover:text-[#c00000]"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition hover:bg-wash ${
              errors.file ? "border-[#c00000]" : "border-[#b9d9c4]"
            }`}
          >
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-chip text-forest">
              <FileUp size={20} />
            </span>
            <span className="text-[14px] font-semibold text-ink">Klik untuk pilih file bukti transfer</span>
            <span className="text-[12px] text-ink/65">JPG, PNG, atau PDF</span>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </Field>

      {serverError && (
        <p className="rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{serverError}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  );
}