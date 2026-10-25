"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import Container from "@/components/ui/Container";
import Logo from "./Logo";

const links = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang SPMB", href: "#tentang" },
  { label: "Alur Pendaftaran", href: "#alur" },
  { label: "Persyaratan", href: "#persyaratan" },
  { label: "Jurusan", href: "#jurusan" },
  { label: "Jadwal", href: "#jadwal" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontak", href: "#kontak" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-[84px] items-center gap-8">
          <Logo />

          <nav className="hidden items-center gap-7 xl:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[14px] font-medium text-ink/80 transition hover:text-brand-600"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/portal"
              className="hidden h-11 items-center rounded-xl bg-brand-100 px-6 text-[14px] font-semibold text-brand-700 transition hover:bg-brand-200 sm:inline-flex"
            >
              Masuk
            </Link>
            <Link
              href="/portal"
              className="hidden h-11 items-center rounded-xl bg-brand-600 px-6 text-[14px] font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 sm:inline-flex"
            >
              Daftar Sekarang
            </Link>
            <Link
              href="/portal"
              aria-label="Akun"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-800"
            >
              <User size={18} />
            </Link>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-line text-ink xl:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {open && (
        <div className="border-t border-line bg-white xl:hidden">
          <Container className="flex flex-col py-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium text-ink/80 hover:bg-brand-50"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3 sm:hidden">
              <Link
                href="/portal"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-100 text-[14px] font-semibold text-brand-700"
              >
                Masuk
              </Link>
              <Link
                href="/portal"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 text-[14px] font-semibold text-white"
              >
                Daftar Sekarang
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}