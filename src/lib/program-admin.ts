import type { ProgramKode } from "./program-data";

export const SISWA_PER_ROMBEL = 36;

export type ProgramAdmin = {
  singkat: string;
  bidang: string;
  nama: string;
  desc: string;
  rombel: number;
  kepala: string;
};

export const PROGRAM_ADMIN: Record<ProgramKode, ProgramAdmin> = {
  PPLG: {
    singkat: "PPLG",
    bidang: "Teknologi Informasi",
    nama: "Pengembangan Perangkat Lunak & Gim",
    desc: "Fokus pada rekayasa perangkat lunak, pemrograman web & mobile, UI/UX design, dan teknologi game engine modern.",
    rombel: 4,
    kepala: "Ayu Budi Lestari, S.Kom",
  },
  DKV: {
    singkat: "DKV",
    bidang: "Seni & Ekonomi Kreatif",
    nama: "Desain Komunikasi Visual",
    desc: "Keahlian perancangan visual grafis, multimedia kreatif, animasi 2D/3D, fotografi, dan videografi produksi digital.",
    rombel: 3,
    kepala: "Ibnu Purbani Lantib, S.Ds",
  },
  TJKT: {
    singkat: "TJKT",
    bidang: "Teknologi Jaringan",
    nama: "Teknik Jaringan Komputer & Telekomunikasi",
    desc: "Infrastruktur jaringan enterprise, fiber optic, administrasi server cloud, dan keamanan siber (cyber security).",
    rombel: 3,
    kepala: "Aulia Fitri Hadiningtyas, S.Kom",
  },
  MPLB: {
    singkat: "MPLB",
    bidang: "Bisnis & Manajemen",
    nama: "Manajemen Perkantoran & Layanan Bisnis",
    desc: "Tata kelola administrasi modern digital, korespondensi bilingual, otomasi perkantoran, dan manajemen kearsipan elektronik.",
    rombel: 2,
    kepala: "Lena Octasari, S.Kom",
  },
  PEMASARAN: {
    singkat: "PM",
    bidang: "Pemasaran Digital",
    nama: "Pemasaran (Bisnis Digital & Marketing)",
    desc: "Pemasaran digital, social media advertising, manajemen e-commerce marketplace, dan content creator bisnis.",
    rombel: 2,
    kepala: "Alvino Andina Rahman",
  },
  PERHOTELAN: {
    singkat: "HTL",
    bidang: "Pariwisata & Hospitality",
    nama: "Perhotelan (Hospitality & Tourism)",
    desc: "Layanan operasional hotel berbintang, front office system, food & beverage hospitality, dan tata graha profesional.",
    rombel: 2,
    kepala: "Pamungkas Paksi Jaladara, SS",
  },
};

export function kapasitasOf(rombel: number) {
  return rombel * SISWA_PER_ROMBEL;
}

export function statusKuota(terisi: number, kapasitas: number) {
  const pct = kapasitas > 0 ? (terisi / kapasitas) * 100 : 0;
  if (pct >= 75) return { label: "Hampir Penuh", cls: "bg-[#ffd9d9] text-[#a40000]", pct };
  if (pct > 50) return { label: "Stabil", cls: "bg-chip text-forest", pct };
  return { label: "Tersedia", cls: "bg-pastel text-ink/70", pct };
}