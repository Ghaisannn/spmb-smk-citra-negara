"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarCheck,
  CircleUser,
  Contact,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Wallet,
  X,
} from "lucide-react";
import type { NotifItem } from "@/lib/notifikasi-config";
import NotifBell from "./NotifBell";

const base = "/dashboard/calon-siswa";

const menu = [
  { label: "Dashboard", href: base, icon: LayoutDashboard, exact: true },
  { label: "Biodata", href: `${base}/biodata`, icon: Contact, exact: true },
  { label: "Pembayaran", href: `${base}/pembayaran`, icon: Wallet },
  { label: "Berkas Pendaftaran", href: `${base}/berkas`, icon: FileText },
  { label: "Program Keahlian", href: `${base}/program`, icon: GraduationCap },
  { label: "Jadwal & Tes", href: `${base}/jadwal`, icon: CalendarCheck },
  { label: "Hasil Seleksi", href: `${base}/hasil`, icon: BadgeCheck },
  { label: "Pengumuman", href: `${base}/pengumuman`, icon: Megaphone },
  { label: "Profil", href: `${base}/profil`, icon: CircleUser },
];

export default function DashboardFrame({
  nama,
  noReg,
  notif,
  children,
}: {
  nama: string;
  noReg: string;
  notif: { unread: number; items: NotifItem[] };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initials = nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/portal");
    router.refresh();
  };

  const sidebar = (
    <>
      <div className="px-5 pt-5">
        <Link href={base} className="flex items-center gap-2.5">
          <Image
            src="/images/logo/logo-smk-citra-negara.png"
            alt="Logo SMK Citra Negara"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <span className="leading-tight">
            <span className="block text-[17px] font-bold text-forest">SMK Citra Negara</span>
            <span className="block text-[12px] text-ink/70">SPMB Online 2026/2027</span>
          </span>
        </Link>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-wash px-3 py-2.5">
          <span className="text-[12px] font-medium text-ink/80">Tahun Akademik</span>
          <span className="rounded-full bg-chip px-2.5 py-0.5 text-[12px] font-bold text-forest">
            2026/2027
          </span>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-5">
        {menu.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] transition ${
                active
                  ? "bg-nav font-semibold text-white"
                  : "font-medium text-ink/85 hover:bg-wash"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-6 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-semibold text-[#c00000] transition hover:bg-red-50"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-mint">
      <aside className="sticky top-0 hidden h-screen w-[288px] shrink-0 flex-col self-start border-r border-line bg-white lg:flex print:hidden">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[288px] flex-col bg-white shadow-xl">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-ink/70 hover:bg-wash"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-ink lg:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="rounded-full bg-chip px-3 py-1 text-[12px] font-semibold text-forest">
              Gelombang 1 Aktif
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <NotifBell initial={notif} />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-[15px] font-semibold text-ink">{nama}</p>
              <p className="mt-0.5 text-[12px] text-ink/70">No: {noReg}</p>
            </div>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-chip to-brand-500 text-[13px] font-bold text-forest">
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}