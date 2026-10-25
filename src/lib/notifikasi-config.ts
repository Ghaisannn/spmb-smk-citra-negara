export type NotifJenis =
  | "akun"
  | "formulir"
  | "pembayaran"
  | "berkas"
  | "cbt"
  | "hasil"
  | "pengumuman";

// info = biru/hijau pucat, sukses = hijau, tindakan = kuning (perlu aksi), bahaya = merah
export type NotifTone = "info" | "sukses" | "tindakan" | "bahaya";

export type NotifInput = {
  jenis: NotifJenis;
  tone: NotifTone;
  judul: string;
  isi: string;
  href?: string;
};

export type NotifItem = {
  id: number;
  jenis: NotifJenis;
  tone: NotifTone;
  judul: string;
  isi: string;
  href: string;
  dibaca: boolean;
  at: string;
};

const BASE = "/dashboard/calon-siswa";

export const NOTIF_HREF = {
  dashboard: BASE,
  biodata: `${BASE}/biodata`,
  formulir: `${BASE}/formulir`,
  pembayaran: `${BASE}/pembayaran`,
  berkas: `${BASE}/berkas`,
  jadwal: `${BASE}/jadwal`,
  hasil: `${BASE}/hasil`,
  pengumuman: `${BASE}/pengumuman`,
  notifikasi: `${BASE}/notifikasi`,
} as const;

export const JENIS_LABEL: Record<NotifJenis, string> = {
  akun: "Akun",
  formulir: "Formulir",
  pembayaran: "Pembayaran",
  berkas: "Berkas",
  cbt: "Ujian CBT",
  hasil: "Hasil Seleksi",
  pengumuman: "Pengumuman",
};

export const GROUP_JENIS = {
  pendaftaran: ["akun", "formulir", "pembayaran", "berkas"],
  ujian: ["cbt"],
  info: ["hasil", "pengumuman"],
} as const satisfies Record<string, readonly NotifJenis[]>;

export const FILTERS = ["semua", "belum", "pendaftaran", "ujian", "info"] as const;
export type NotifFilter = (typeof FILTERS)[number];