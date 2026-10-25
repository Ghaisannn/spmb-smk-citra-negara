export const MAX_BERKAS_MB = 2;

export type Ext = "jpg" | "png" | "pdf";

export type JenisBerkas = {
  kode: string;
  nama: string;
  wajib: boolean;
  ext: readonly Ext[];
  desc: string;
};

export const JENIS_BERKAS: readonly JenisBerkas[] = [
  {
    kode: "kk",
    nama: "Kartu Keluarga (KK)",
    wajib: true,
    ext: ["jpg", "png", "pdf"],
    desc: "Scan atau foto jelas KK asli atau fotokopi yang telah dilegalisir basah oleh instansi berwenang.",
  },
  {
    kode: "akta",
    nama: "Akta Kelahiran",
    wajib: true,
    ext: ["jpg", "png", "pdf"],
    desc: "Pindaian Akta Kelahiran resmi calon peserta didik yang diterbitkan oleh Dinas Dukcapil.",
  },
  {
    kode: "ijazah",
    nama: "Ijazah / SKL SMP/MTs",
    wajib: true,
    ext: ["jpg", "png", "pdf"],
    desc: "Scan ijazah asli atau Surat Keterangan Lulus (SKL) resmi bercap basah dari pihak sekolah asal.",
  },
  {
    kode: "foto",
    nama: "Pas Foto 3x4",
    wajib: true,
    ext: ["jpg", "png"],
    desc: "Pas foto resmi terbaru dengan seragam SMP/MTs berlatar belakang merah atau biru kontras.",
  },
  {
    kode: "rapor",
    nama: "Rapor Semester 1–5",
    wajib: true,
    ext: ["jpg", "png", "pdf"],
    desc: "Nilai pengetahuan rapor semester 1 sampai dengan 5 yang telah dilegalisasi oleh kepala sekolah asal.",
  },
  {
    kode: "piagam",
    nama: "Piagam Prestasi",
    wajib: false,
    ext: ["jpg", "png", "pdf"],
    desc: "Sertifikat/piagam kejuaraan akademik, olahraga, seni, atau tahfidz minimal tingkat kota/kabupaten.",
  },
];

export const KODE_BERKAS: readonly string[] = JENIS_BERKAS.map((j) => j.kode);

export function getJenis(kode: string) {
  return JENIS_BERKAS.find((j) => j.kode === kode);
}

export type StatusBerkas = "menunggu" | "diterima" | "perlu_perbaikan";

export type BerkasItem = {
  jenis: string;
  namaAsli: string;
  ukuran: number;
  status: StatusBerkas;
  catatan: string;
  uploadedAt: string;
};

export type BerkasMap = Record<string, BerkasItem>;

export function hitungWajib(map: BerkasMap) {
  const wajib = JENIS_BERKAS.filter((j) => j.wajib);
  const terunggah = wajib.filter((j) => map[j.kode]).length;
  const diterima = wajib.filter((j) => map[j.kode]?.status === "diterima").length;
  const perbaikan = wajib.filter((j) => map[j.kode]?.status === "perlu_perbaikan").length;
  return {
    total: wajib.length,
    terunggah,
    diterima,
    perbaikan,
    lengkap: terunggah === wajib.length,
    semuaDiterima: diterima === wajib.length,
  };
}

export function ukuranText(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function labelFormat(ext: readonly Ext[]) {
  return ext.map((e) => e.toUpperCase()).join(" / ");
}