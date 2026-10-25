export const HURUF = ["A", "B", "C", "D", "E"] as const;

export const MAPEL_CBT =
  "Matematika, Bhs. Indonesia, Bhs. Inggris, Potensi Skolastik & Minat Kejuruan";

export function labelSesi(mulai: string) {
  const j = Number(mulai.slice(0, 2));
  return j < 11 ? "Sesi Pagi" : j < 15 ? "Sesi Siang" : "Sesi Sore";
}

export function formatSisa(detik: number) {
  const s = Math.max(0, Math.floor(detik));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const d = s % 60;
  return [h, m, d].map((n) => String(n).padStart(2, "0")).join(":");
}