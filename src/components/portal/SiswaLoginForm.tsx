"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

export default function SiswaLoginForm() {
  const router = useRouter();
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
        body: JSON.stringify({ email, password, portal: "siswa" }),
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Email */}
      <label htmlFor="email" className="mt-8 block text-[14px] font-semibold text-ink">
        Email Siswa
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

      <div className="mt-6 border-t border-line" />

      <p className="mt-6 text-center text-[14px] text-ink">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-brand-700 hover:underline">
          Daftar Sekarang
        </Link>
      </p>

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