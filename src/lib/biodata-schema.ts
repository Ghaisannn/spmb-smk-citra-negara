export const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] as const;
export const JENIS_KELAMIN = ["Laki-laki", "Perempuan"] as const;
export const KECAMATAN = [
  "Beji", "Bojongsari", "Cilodong", "Cimanggis", "Cinere", "Cipayung",
  "Limo", "Pancoran Mas", "Sawangan", "Sukmajaya", "Tapos",
] as const;
export const STATUS_TINGGAL = [
  "Bersama Orang Tua", "Tinggal Bersama Wali", "Kos / Mandiri", "Asrama / Pondok",
] as const;
export const STATUS_SEKOLAH = ["Negeri", "Swasta"] as const;
export const TAHUN_LULUS = [
  { value: "2026", label: "2026 (Lulusan Tahun Ini)" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
] as const;

export const STEP_FIELDS = {
  1: ["tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama"],
  2: ["whatsapp", "alamat", "rt_rw", "kelurahan", "kecamatan", "kode_pos", "status_tinggal"],
  3: [
    "npsn", "nama_sekolah", "status_sekolah", "tahun_lulus", "nisn",
    "nama_ayah", "pekerjaan_ayah", "nama_ibu", "whatsapp_ortu",
  ],
} as const;

export type FieldName = (typeof STEP_FIELDS)[1 | 2 | 3][number];
export type BiodataData = Record<FieldName, string>;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const ALL_FIELDS: readonly FieldName[] = [
  ...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3],
];

export const MAX_LEN: Record<FieldName, number> = {
  tempat_lahir: 100, tanggal_lahir: 10, jenis_kelamin: 20, agama: 30,
  whatsapp: 20, alamat: 250, rt_rw: 20, kelurahan: 100, kecamatan: 100,
  kode_pos: 5, status_tinggal: 50, npsn: 8, nama_sekolah: 150,
  status_sekolah: 10, tahun_lulus: 4, nisn: 10, nama_ayah: 100,
  pekerjaan_ayah: 100, nama_ibu: 100, whatsapp_ortu: 20,
};

export function emptyBiodata(): BiodataData {
  return Object.fromEntries(ALL_FIELDS.map((f) => [f, ""])) as BiodataData;
}

export function nomorRegistrasi(userId: number) {
  return `SPMB-2026-${String(userId).padStart(4, "0")}`;
}

// "0812..." / "+62812..." / "62812..." -> "812..."
export function localWa(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 13);
}

export function formatWa(local: string) {
  if (!local) return "-";
  return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatTanggal(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "-";
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
}

function isValidDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    return false;
  }
  return y >= 1990 && dt.getTime() <= Date.now();
}

export function validateStep(step: 1 | 2 | 3, d: BiodataData): FieldErrors {
  const e: FieldErrors = {};

  const need = (f: FieldName, max = MAX_LEN[f]) => {
    const v = d[f].trim();
    if (!v) e[f] = "Wajib diisi.";
    else if (v.length > max) e[f] = `Maksimal ${max} karakter.`;
  };
  const pick = (f: FieldName, list: readonly string[]) => {
    if (!list.includes(d[f])) e[f] = "Pilih salah satu.";
  };
  const digits = (f: FieldName, len: number, label: string) => {
    if (!new RegExp(`^\\d{${len}}$`).test(d[f])) e[f] = `${label} harus ${len} digit angka.`;
  };
  const wa = (f: FieldName) => {
    if (!/^8\d{8,12}$/.test(d[f])) e[f] = "Nomor WhatsApp tidak valid (contoh: 81298765432).";
  };

  if (step === 1) {
    need("tempat_lahir");
    if (!isValidDate(d.tanggal_lahir)) e.tanggal_lahir = "Tanggal lahir tidak valid.";
    pick("jenis_kelamin", JENIS_KELAMIN);
    pick("agama", AGAMA);
  }

  if (step === 2) {
    wa("whatsapp");
    if (d.alamat.trim().length < 5) e.alamat = "Alamat minimal 5 karakter.";
    else if (d.alamat.length > 250) e.alamat = "Maksimal 250 karakter.";
    if (!/^\d{1,3}\s*\/\s*\d{1,3}$/.test(d.rt_rw.trim())) {
      e.rt_rw = "Format: 005 / 15";
    }
    need("kelurahan");
    pick("kecamatan", KECAMATAN);
    digits("kode_pos", 5, "Kode pos");
    pick("status_tinggal", STATUS_TINGGAL);
  }

  if (step === 3) {
    digits("npsn", 8, "NPSN");
    need("nama_sekolah");
    pick("status_sekolah", STATUS_SEKOLAH);
    pick("tahun_lulus", TAHUN_LULUS.map((t) => t.value));
    digits("nisn", 10, "NISN");
    need("nama_ayah");
    need("pekerjaan_ayah");
    need("nama_ibu");
    wa("whatsapp_ortu");
  }

  return e;
}