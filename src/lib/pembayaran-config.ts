export const BIAYA_PENDAFTARAN = 250000;
export const MAX_BUKTI_MB = 2;

// GANTI dengan data rekening resmi sekolah dari Miss Uci.
export const REKENING_TUJUAN = {
  bank: "Bank Syariah Indonesia (BSI)",
  nomor: "7123456789",
  atasNama: "SMK Citra Negara",
};

export const BANK_PENGIRIM = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "BSI",
  "CIMB Niaga",
  "Bank Lainnya",
  "Dompet Digital (Dana / OVO / GoPay)",
] as const;

export function formatRupiah(n: number) {
  return "Rp " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}