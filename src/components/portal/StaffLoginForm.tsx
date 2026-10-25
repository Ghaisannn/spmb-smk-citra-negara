"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

type StaffRole = "admin" | "kepsek";

export default function StaffLoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "staff", role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal.");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const roleBtn = (value: StaffRole, label: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      aria-pressed={role === value}
      className={`h-11 w-[99px] rounded-md bg-forest text-[14px] font-semibold text-white transition ${
        role === value ? "ring-2 ring-forest ring-offset-2" : "opacity-95"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-6 flex justify-center gap-3">
        {roleBtn("admin", "Admin")}
        {roleBtn("kepsek", "Kepsek")}
      </div>

      {/* Email */}
      <label htmlFor="email" className="mt-6 block text-[14px] font-semibold text-ink">
        Email
      </label>
      <div className="relative mt-1">
        <Mail
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/60"
        />
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Masukkan email"
          className="h-10 w-full rounded border border-[#b9c2bd] bg-white pl-11 pr-4 text-[14px] text-ink placeholder:text-ink/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
      </div>

      {/* Password */}
      <label htmlFor="password" className="mt-3 block text-[14px] font-semibold text-ink">
        Kata Sandi
      </label>
      <div className="relative mt-1">
        <LockKeyhole
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/60"
        />
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan kata sandi"
          className="h-11 w-full rounded border border-[#b9c2bd] bg-white pl-11 pr-12 text-[14px] text-ink placeholder:text-ink/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
        <button
          type="button"
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Ingat saya + Lupa password */}
      <div className="mt-3 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink">
          <input type="checkbox" className="size-4 accent-forest" />
          Ingat saya
        </label>
        <a href="#" className="text-[12.5px] font-bold text-forest">
          Lupa Password?
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">
          {error}
        </p>
      )}

      {/* Tombol masuk */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded bg-forest text-[14px] font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Memproses..." : "Masuk"}
        {!loading && <ArrowRight size={16} />}
      </button>

      <div className="mt-4 border-t border-line" />

      <div className="mt-3 flex items-center gap-2 rounded bg-[#e8f4ec] px-3 py-2 text-[12px] text-ink/80">
        <BadgeCheck size={18} className="shrink-0 text-forest" />
        Akses khusus untuk monitoring dan laporan SPMB.
      </div>

      <Link
        href="/"
        className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink/80 hover:text-forest"
      >
        <ArrowLeft size={14} />
        Kembali ke halaman utama
      </Link>
    </form>
  );
}