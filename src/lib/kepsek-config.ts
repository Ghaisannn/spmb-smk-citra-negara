import type { ProgramKode } from "./program-data";

export const KEPSEK_NIP = "19720415 199803 1 004";
export const DOC_NO = "SPMB-CN/LAP-EKSEK/2026/03-G1";
export const ID_DRAFT = "#PUB-2026-GLB1-F";
export const JAM_RILIS = "10:00";

export const PROGRAM_LAPORAN: Record<
  ProgramKode,
  { kode: string; tampil: string; sub: string | null; nama: string; ringkas: string; label: string }
> = {
  PPLG: {
    kode: "PPLG-01",
    tampil: "PPLG",
    sub: "Pengembangan Perangkat Lunak & Gim",
    nama: "Pengembangan Perangkat Lunak & Gim",
    ringkas: "Rekayasa Web, Mobile Apps, dan Game Development",
    label: "PPLG (Pengembangan Perangkat Lunak & Gim)",
  },
  DKV: {
    kode: "DKV-02",
    tampil: "DKV",
    sub: "Desain Komunikasi Visual",
    nama: "Desain Komunikasi Visual",
    ringkas: "Multimedia, Motion Design, Branding & Audio Visual",
    label: "DKV (Desain Komunikasi Visual)",
  },
  TJKT: {
    kode: "TJKT-03",
    tampil: "TJKT",
    sub: "Teknik Jaringan Komputer & Telko",
    nama: "Teknik Jaringan Komputer & Telekomunikasi",
    ringkas: "Network Infrastructure, Cloud, Cyber Security",
    label: "TJKT (Teknik Jaringan Komputer & Telko)",
  },
  MPLB: {
    kode: "MPLB-04",
    tampil: "MPLB",
    sub: "Manajemen Perkantoran & Layanan Bisnis",
    nama: "Manajemen Perkantoran & Layanan Bisnis",
    ringkas: "Administrasi Digital, Otomasi Kantor, Public Relations",
    label: "MPLB (Manajemen Perkantoran & Layanan Bisnis)",
  },
  PEMASARAN: {
    kode: "PM-05",
    tampil: "Pemasaran",
    sub: null,
    nama: "Pemasaran / Bisnis Daring & Ritel",
    ringkas: "Digital Marketing, E-commerce, Retail Merchandising",
    label: "Pemasaran (Bisnis Daring)",
  },
  PERHOTELAN: {
    kode: "HTL-06",
    tampil: "Perhotelan",
    sub: null,
    nama: "Perhotelan & Hospitaliti",
    ringkas: "Front Office, Food & Beverage, Housekeeping Operasional",
    label: "Perhotelan",
  },
};

export const HASIL_KEPSEK = {
  diterima: "Lolos Kuota Utama",
  cadangan: "Cadangan",
  tidak_diterima: "Tidak Memenuhi Passing Grade",
  belum: "Belum Ditetapkan",
} as const;

export const SURAT = {
  yayasan: "YAYASAN PENDIDIKAN CITRA NEGARA MANDIRI",
  sekolah: "SMK CITRA NEGARA DEPOK",
  bidang: "Bidang Keahlian: Teknologi Informasi, Bisnis & Manajemen, dan Pariwisata",
  alamat:
    "Jl. Kemiri Muka No. 108, Beji, Kota Depok, Jawa Barat 16423 • Telp: (021) 7721–8902 • Website: www.citranegara.sch.id",
  jamDaftarUlang: "08.00 – 15.00 WIB",
  lokasi: "Gedung C",
  berkas: [
    "Bukti Cetak Kartu Registrasi SPMB",
    "Fotokopi Ijazah / SKL legalisir & Akta Lahir (2 lbr)",
    "Fotokopi Kartu Keluarga & KTP Orang Tua / Wali",
  ],
};

const BLN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function addDays(iso: string, n: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);
}

// "26 – 31 Maret 2026"
export function rentang(a: string, b: string) {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  if (pa.length < 3 || pb.length < 3) return "-";
  if (pa[0] === pb[0] && pa[1] === pb[1]) return `${pa[2]} – ${pb[2]} ${BLN[pb[1] - 1]} ${pb[0]}`;
  return `${pa[2]} ${BLN[pa[1] - 1]} – ${pb[2]} ${BLN[pb[1] - 1]} ${pb[0]}`;
}