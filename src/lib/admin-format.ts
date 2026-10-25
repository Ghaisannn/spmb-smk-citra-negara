const TZ = "Asia/Jakarta";

export type StatusPendaftar =
  | "draft"
  | "biodata"
  | "menunggu"
  | "revisi"
  | "terverifikasi";

export const STATUS_LABEL: Record<StatusPendaftar, string> = {
  draft: "Belum Lengkap",
  biodata: "Biodata Lengkap",
  menunggu: "Menunggu Verifikasi",
  revisi: "Menunggu Revisi",
  terverifikasi: "Terverifikasi",
};

export function tglPendek(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function tglPanjang(d: Date = new Date()) {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function jam(d: Date = new Date()) {
  return d
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    })
    .replace(".", ":");
}

export function relTime(d: Date | string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit yang lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam yang lalu`;
  return `${Math.floor(h / 24)} hari yang lalu`;
}

export function initials(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function buildQuery(o: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}