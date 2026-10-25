import path from "path";

export const BERKAS_DIR = path.join(process.cwd(), "storage", "berkas");

export const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

// Cek isi file yang sebenarnya, bukan hanya ekstensi.
export function detectType(buf: Buffer): "jpg" | "png" | "pdf" | null {
  if (buf.length < 8) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (buf.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  return null;
}