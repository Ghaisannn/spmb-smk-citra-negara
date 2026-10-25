"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Contact,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  RotateCcwKey,
  User,
} from "lucide-react";

type Errors = Partial<
  Record<"nama" | "nik" | "email" | "wa" | "password" | "confirm" | "agree", string>
>;

const inputBase =
  "h-11 w-full rounded border bg-white pl-11 text-[14px] text-ink placeholder:text-ink/45 focus:outline-none focus:ring-2";

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
          {label} <span className="text-[#c00000]">*</span>
        </label>
        {hint && <span className="text-[11px] text-ink/70">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[12px] text-[#c00000]">{error}</p>}
    </div>
  );
}

function IconInput({
  icon,
  error,
  right,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  error?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/55">
        {icon}
      </span>
      <input
        {...props}
        className={`${inputBase} ${right ? "pr-12" : "pr-4"} ${
          error
            ? "border-[#c00000] focus:ring-[#c00000]/20"
            : "border-[#b9c2bd] focus:border-forest focus:ring-forest/20"
        }`}
      />
      {right && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</span>
      )}
    </div>
  );
}

export default function DaftarForm() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Errors = {};
    if (!nama.trim()) e.nama = "Nama lengkap wajib diisi.";
    if (nik.length !== 16) e.nik = "NIK harus 16 digit angka.";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Format email tidak valid.";
    if (!/^(08|628)\d{8,12}$/.test(wa))
      e.wa = "Nomor WhatsApp tidak valid (contoh: 08123456789).";
    if (password.length < 8) e.password = "Kata sandi minimal 8 karakter.";
    if (confirm !== password) e.confirm = "Konfirmasi kata sandi tidak sama.";
    if (!agree) e.agree = "Anda harus menyetujui ketentuan pendaftaran.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          nik,
          email,
          whatsapp: wa,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Pendaftaran gagal.");
        return;
      }

      router.push("/portal/siswa?registered=1");
    } catch {
      setServerError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      onClick={toggle}
      className="text-ink/55 hover:text-ink"
    >
      {show ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mt-10 space-y-6">
        <Field label="Nama Lengkap" hint="Sesuai Akta Kelahiran" htmlFor="nama" error={errors.nama}>
          <IconInput
            id="nama"
            icon={<User size={18} />}
            error={errors.nama}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama lengkap sesuai ijazah/akta"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          <Field label="NIK (16 Digit)" htmlFor="nik" error={errors.nik}>
            <IconInput
              id="nik"
              icon={<Contact size={18} />}
              error={errors.nik}
              value={nik}
              inputMode="numeric"
              maxLength={16}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              placeholder="3276xxxxxxxxxxxx"
            />
          </Field>
          <Field label="Email Aktif" htmlFor="email" error={errors.email}>
            <IconInput
              id="email"
              type="email"
              icon={<Mail size={18} />}
              error={errors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.kamu@email.com"
            />
          </Field>
        </div>

        <Field
          label="Nomor WhatsApp Calon Siswa / Wali"
          hint="Untuk pemberitahuan akun"
          htmlFor="wa"
          error={errors.wa}
        >
          <IconInput
            id="wa"
            type="tel"
            icon={<Phone size={18} />}
            error={errors.wa}
            value={wa}
            inputMode="numeric"
            maxLength={14}
            onChange={(e) => setWa(e.target.value.replace(/\D/g, ""))}
            placeholder="08xxxxxxxxxx"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          <Field label="Kata Sandi" htmlFor="password" error={errors.password}>
            <IconInput
              id="password"
              type={showPw ? "text" : "password"}
              icon={<LockKeyhole size={18} />}
              error={errors.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              right={eyeBtn(showPw, () => setShowPw((v) => !v))}
            />
          </Field>
          <Field label="Konfirmasi Kata Sandi" htmlFor="confirm" error={errors.confirm}>
            <IconInput
              id="confirm"
              type={showConfirm ? "text" : "password"}
              icon={<RotateCcwKey size={18} />}
              error={errors.confirm}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi kata sandi"
              right={eyeBtn(showConfirm, () => setShowConfirm((v) => !v))}
            />
          </Field>
        </div>
      </div>

      {/* Persetujuan */}
      <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-[12px] leading-snug text-ink">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-forest"
        />
        Saya menyetujui ketentuan pendaftaran SPMB dan menyatakan kebenaran data
        yang saya masukkan.
      </label>
      {errors.agree && (
        <p className="mt-1 text-[12px] text-[#c00000]">{errors.agree}</p>
      )}

      {serverError && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex h-12 w-full items-center justify-center gap-1.5 rounded bg-forest text-[14px] font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Memproses..." : "Daftar Akun"}
        {!loading && <ArrowRight size={16} />}
      </button>

      <div className="mt-4 border-t border-[#d6d9d7]" />

      <p className="mt-6 text-center text-[14px] text-ink">
        Sudah punya akun?{" "}
        <Link href="/portal/siswa" className="font-medium text-brand-700 hover:underline">
          Masuk
        </Link>
      </p>

      <Link
        href="/"
        className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink/80 hover:text-forest"
      >
        <ArrowLeft size={14} />
        Kembali ke halaman utama
      </Link>
    </form>
  );
}