import {
  BadgeCheck,
  ClipboardCheck,
  FileText,
  Laptop,
  Megaphone,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotifJenis, NotifTone } from "@/lib/notifikasi-config";

export const JENIS_ICON: Record<NotifJenis, LucideIcon> = {
  akun: User,
  formulir: ClipboardCheck,
  pembayaran: Wallet,
  berkas: FileText,
  cbt: Laptop,
  hasil: BadgeCheck,
  pengumuman: Megaphone,
};

export const TONE_CLS: Record<NotifTone, string> = {
  info: "bg-pastel text-forest",
  sukses: "bg-chip text-forest",
  tindakan: "bg-[#fff1b8] text-[#8a5a00]",
  bahaya: "bg-red-100 text-[#c00000]",
};