export const PASSING_GRADE = 70;

// Ujian dikerjakan online, jadi tidak ada lokasi fisik.
export const LOKASI_ONLINE = "Online (Portal SPMB)";

export const KATEGORI_SOAL = [
  { kode: "matematika", label: "Matematika & Logika Numerik", prefix: "MTH", nama: "Matematika" },
  { kode: "indonesia", label: "Bahasa Indonesia & Literasi", prefix: "IND", nama: "Bahasa Indonesia" },
  { kode: "inggris", label: "Bahasa Inggris & Komunikasi", prefix: "ENG", nama: "Bahasa Inggris" },
  { kode: "potensi", label: "Tes Potensi Skolastik & Penalaran", prefix: "TPS", nama: "Potensi Skolastik" },
  { kode: "minat", label: "Minat & Bakat Kejuruan", prefix: "MNT", nama: "Minat & Bakat" },
] as const;

export const KESULITAN = ["mudah", "sedang", "sulit"] as const;
export const STATUS_SOAL = ["aktif", "revisi"] as const;

export const HASIL_LABEL = {
  belum: "Belum Dinilai",
  diterima: "Diterima",
  cadangan: "Cadangan",
  tidak_diterima: "Belum Diterima",
} as const;
export type HasilStatus = keyof typeof HASIL_LABEL;

export const JALUR = ["Reguler", "Prestasi Rapor", "Prestasi Non-Akademik", "Afirmasi"] as const;

export const KATEGORI_PENGUMUMAN = [
  "Informasi Umum",
  "Teknis",
  "Pengumuman Kelulusan",
  "Akademik & Seleksi",
  "Berkas & Daftar Ulang",
] as const;

export const TARGET_PENGUMUMAN = [
  "Semua Pendaftar",
  "Semua Pendaftar Gelombang 1",
  "Pendaftar Belum Lengkap",
  "Jurusan PPLG",
  "Jurusan DKV",
  "Jurusan TJKT",
  "Jurusan MPLB",
  "Jurusan Pemasaran",
  "Jurusan Perhotelan",
] as const;

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BLN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "Rabu, 08 April 2026"
export function hariTanggal(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "-";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${HARI[d.getUTCDay()]}, ${m[3]} ${BLN[+m[2] - 1]} ${m[1]}`;
}

export function todayWib() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function isValidDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}