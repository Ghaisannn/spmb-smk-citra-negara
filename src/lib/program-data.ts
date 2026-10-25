export const PROGRAM = [
  {
    kode: "PPLG",
    singkatan: "PPLG",
    label: "PPLG",
    nama: "Pengembangan Perangkat Lunak dan Gim",
    desc: "Mempelajari pembuatan aplikasi web, aplikasi mobile, basis data, dan pengembangan game interaktif.",
    tags: ["Coding", "Mobile App", "Game Dev"],
  },
  {
    kode: "DKV",
    singkatan: "DKV",
    label: "DKV",
    nama: "Desain Komunikasi Visual",
    desc: "Mempelajari ilustrasi digital, desain grafis, fotografi, videografi, motion graphic, dan branding.",
    tags: ["Grafis & Foto", "Videografi", "Branding"],
  },
  {
    kode: "TJKT",
    singkatan: "TJKT",
    label: "TJKT",
    nama: "Teknik Jaringan Komputer dan Telekomunikasi",
    desc: "Mempelajari instalasi jaringan komputer, konfigurasi server, teknologi fiber optik, dan keamanan siber.",
    tags: ["Infrastruktur", "Cyber Security", "Fiber Optic"],
  },
  {
    kode: "MPLB",
    singkatan: "MPLB",
    label: "MPLB",
    nama: "Manajemen Perkantoran dan Layanan Bisnis",
    desc: "Mempelajari korespondensi bisnis, kearsipan digital, otomatisasi tata kelola perkantoran, dan public relations.",
    tags: ["Tata Kelola", "Digital Archive", "Public Relations"],
  },
  {
    kode: "PEMASARAN",
    singkatan: "Pemasaran",
    label: "Bisnis",
    nama: "Pemasaran",
    desc: "Mempelajari strategi pemasaran digital (digital marketing), e-commerce, customer service, dan pengelolaan retail modern.",
    tags: ["Digital Marketing", "E-Commerce", "Customer Care"],
  },
  {
    kode: "PERHOTELAN",
    singkatan: "Perhotelan",
    label: "Pariwisata",
    nama: "Perhotelan",
    desc: "Mempelajari operasional perhotelan, tata graha (housekeeping), layanan front office, dan hospitality management.",
    tags: ["Front Desk", "Housekeeping", "Hospitality"],
  },
] as const;

export type ProgramKode = (typeof PROGRAM)[number]["kode"];

export const PROGRAM_KODE: readonly string[] = PROGRAM.map((p) => p.kode);

export function getProgramInfo(kode: string) {
  return PROGRAM.find((p) => p.kode === kode);
}

// "PPLG (Pengembangan Perangkat Lunak & Gim)" atau "Pemasaran"
export function namaRingkas(kode: string) {
  const p = getProgramInfo(kode);
  if (!p) return "-";
  if (p.singkatan === p.nama) return p.nama;
  return `${p.singkatan} (${p.nama.replace(" dan ", " & ")})`;
}