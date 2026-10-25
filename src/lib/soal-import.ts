import ExcelJS from "exceljs";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { KATEGORI_SOAL, KESULITAN, STATUS_SOAL } from "./admin-config";

export const MAX_BARIS = 500;
export const MAX_FILE_MB = 2;

type Field =
  | "kategori" | "topik" | "kesulitan" | "status" | "teks"
  | "a" | "b" | "c" | "d" | "e" | "kunci" | "bobot";

const FIELDS: Field[] = [
  "kategori", "topik", "kesulitan", "status", "teks",
  "a", "b", "c", "d", "e", "kunci", "bobot",
];

const ALIAS: Record<Field, string[]> = {
  kategori: ["kategori", "kategorisoal"],
  topik: ["topik"],
  kesulitan: ["kesulitan", "tingkatkesulitan"],
  status: ["status", "statussoal"],
  teks: ["pertanyaan", "soal", "teks", "tekspertanyaan"],
  a: ["opsia", "pilihana", "a"],
  b: ["opsib", "pilihanb", "b"],
  c: ["opsic", "pilihanc", "c"],
  d: ["opsid", "pilihand", "d"],
  e: ["opsie", "pilihane", "e"],
  kunci: ["kunci", "kuncijawaban", "jawabanbenar"],
  bobot: ["bobot", "poin", "bobotpoin"],
};

const WAJIB: Field[] = ["kategori", "topik", "teks", "a", "b", "c", "d", "e", "kunci"];

const NAMA_KOLOM: Record<Field, string> = {
  kategori: "Kategori", topik: "Topik", kesulitan: "Kesulitan", status: "Status",
  teks: "Pertanyaan", a: "Opsi A", b: "Opsi B", c: "Opsi C", d: "Opsi D", e: "Opsi E",
  kunci: "Kunci", bobot: "Bobot",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (Array.isArray(o.richText)) {
      return (o.richText as { text?: string }[]).map((t) => t.text ?? "").join("").trim();
    }
    if ("result" in o) return cellText(o.result as ExcelJS.CellValue);
    if (typeof o.text === "string") return o.text.trim();
  }
  return "";
}

const kunciTeks = (kat: string, teks: string) =>
  `${kat}|${teks.toLowerCase().replace(/\s+/g, " ").trim()}`;

function cariKategori(raw: string) {
  const k = norm(raw);
  return KATEGORI_SOAL.find((x) => norm(x.kode) === k || norm(x.label) === k || norm(x.nama) === k)?.kode;
}

/* ================= TEMPLATE ================= */

export async function buatTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SPMB SMK Citra Negara";

  const ws = wb.addWorksheet("Soal", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Kategori *", key: "kategori", width: 16 },
    { header: "Topik *", key: "topik", width: 24 },
    { header: "Kesulitan", key: "kesulitan", width: 12 },
    { header: "Status", key: "status", width: 10 },
    { header: "Pertanyaan *", key: "teks", width: 60 },
    { header: "Opsi A *", key: "a", width: 24 },
    { header: "Opsi B *", key: "b", width: 24 },
    { header: "Opsi C *", key: "c", width: 24 },
    { header: "Opsi D *", key: "d", width: 24 },
    { header: "Opsi E *", key: "e", width: 24 },
    { header: "Kunci *", key: "kunci", width: 9 },
    { header: "Bobot", key: "bobot", width: 9 },
  ];

  const head = ws.getRow(1);
  head.height = 24;
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF005C34" } };
  head.alignment = { vertical: "middle" };

  // Kolom teks agar angka dan persen tidak diubah Excel.
  for (let c = 5; c <= 10; c++) ws.getColumn(c).numFmt = "@";

  const daftar = (v: string[]) => ({ type: "list" as const, allowBlank: true, formulae: [`"${v.join(",")}"`] });
  const kodeKategori = KATEGORI_SOAL.map((k) => k.kode as string);
  for (let r = 2; r <= 501; r++) {
    ws.getCell(r, 1).dataValidation = daftar(kodeKategori);
    ws.getCell(r, 3).dataValidation = daftar([...KESULITAN]);
    ws.getCell(r, 4).dataValidation = daftar([...STATUS_SOAL]);
    ws.getCell(r, 11).dataValidation = daftar(["A", "B", "C", "D", "E"]);
  }

  const info = wb.addWorksheet("Petunjuk");
  info.columns = [{ width: 22 }, { width: 100 }];
  const baris: [string, string][] = [
    ["Petunjuk Pengisian Template Bank Soal CBT", ""],
    ["", ""],
    ["1.", "Isi soal pada sheet Soal mulai baris ke-2. Satu baris = satu butir soal."],
    ["2.", "Jangan mengubah atau menghapus judul kolom di baris pertama. Kolom bertanda * wajib diisi."],
    ["3.", `Maksimal ${MAX_BARIS} soal per impor. Jika ada satu baris yang salah, tidak ada soal yang diimpor dan Anda diberi tahu baris mana yang harus diperbaiki.`],
    ["4.", "Soal yang sama persis dengan soal yang sudah ada di Bank Soal akan ditolak."],
    ["5.", "Kode soal (misal MTH-11) dibuat otomatis oleh sistem."],
    ["", ""],
    ["Kolom", "Penjelasan"],
    ["Kategori *", "matematika, indonesia, inggris, potensi, atau minat (pilih dari dropdown)"],
    ["Topik *", "2 sampai 60 karakter. Contoh: Geometri Ruang"],
    ["Kesulitan", "mudah, sedang, atau sulit. Kosong = sedang"],
    ["Status", "aktif atau revisi. Kosong = aktif"],
    ["Pertanyaan *", "10 sampai 1000 karakter"],
    ["Opsi A sampai E *", "Kelima pilihan jawaban wajib diisi, maksimal 255 karakter"],
    ["Kunci *", "Huruf A, B, C, D, atau E"],
    ["Bobot", "Angka lebih dari 0 dan maksimal 9,99. Kosong = 1"],
    ["", ""],
    ["Contoh baris", "matematika | Persentase | sedang | aktif | Berapa 20% dari 150? | 20 | 25 | 30 | 35 | 40 | C | 1"],
  ];
  baris.forEach((b) => info.addRow(b));
  info.getRow(1).font = { bold: true, size: 14, color: { argb: "FF005C34" } };
  info.getRow(9).font = { bold: true };
  info.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const raw = await wb.xlsx.writeBuffer();
  return new Uint8Array(raw as unknown as ArrayBuffer);
}

/* ================= PARSING ================= */

export type ParsedSoal = {
  baris: number;
  kategori: string;
  topik: string;
  kesulitan: string;
  status: string;
  teks: string;
  opsi: string[];
  kunci: string;
  bobot: number;
};
export type ImportError = { baris: number; pesan: string };
export type ParseResult =
  | { ok: true; rows: ParsedSoal[] }
  | { ok: false; fatal?: string; errors: ImportError[] };

export async function parseExcel(buf: Buffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
  } catch {
    return {
      ok: false,
      errors: [],
      fatal: "File Excel tidak dapat dibaca. Pastikan file tidak rusak dan berformat .xlsx.",
    };
  }

  const ws = wb.getWorksheet("Soal") ?? wb.worksheets[0];
  if (!ws) return { ok: false, errors: [], fatal: "File tidak memiliki lembar kerja." };

  // Petakan kolom dari judul di baris pertama.
  const kolom = new Map<Field, number>();
  ws.getRow(1).eachCell((cell, n) => {
    const h = norm(cellText(cell.value));
    if (!h) return;
    for (const f of FIELDS) {
      if (!kolom.has(f) && ALIAS[f].includes(h)) kolom.set(f, n);
    }
  });

  const hilang = WAJIB.filter((f) => !kolom.has(f));
  if (hilang.length > 0) {
    return {
      ok: false,
      errors: [],
      fatal: `Kolom ${hilang.map((f) => NAMA_KOLOM[f]).join(", ")} tidak ditemukan di baris pertama. Gunakan template dari tombol Unduh Template.`,
    };
  }

  const [exist] = await pool.query<RowDataPacket[]>("SELECT kategori, teks FROM bank_soal");
  const sudahAda = new Set(exist.map((r) => kunciTeks(r.kategori, r.teks)));
  const dalamFile = new Map<string, number>();

  const errors: ImportError[] = [];
  const rows: ParsedSoal[] = [];
  const terakhir = Math.min(ws.rowCount, 5000);
  let terisi = 0;

  for (let r = 2; r <= terakhir; r++) {
    const row = ws.getRow(r);
    const get = (f: Field) => {
      const c = kolom.get(f);
      return c ? cellText(row.getCell(c).value) : "";
    };
    const v = Object.fromEntries(FIELDS.map((f) => [f, get(f)])) as Record<Field, string>;
    if (FIELDS.every((f) => v[f] === "")) continue;

    terisi++;
    if (terisi > MAX_BARIS) {
      return { ok: false, errors: [], fatal: `Maksimal ${MAX_BARIS} baris soal per impor. Pecah file menjadi beberapa bagian.` };
    }
    if (errors.length >= 200) break;

    const sebelum = errors.length;
    const err = (pesan: string) => errors.push({ baris: r, pesan });

    const kategori = cariKategori(v.kategori);
    if (!kategori) {
      err(`Kategori "${v.kategori}" tidak dikenal. Gunakan: ${KATEGORI_SOAL.map((k) => k.kode).join(", ")}.`);
    }

    if (v.topik.length < 2 || v.topik.length > 60) err("Topik harus 2 sampai 60 karakter.");

    let kesulitan = "sedang";
    if (v.kesulitan) {
      const k = norm(v.kesulitan);
      if ((KESULITAN as readonly string[]).includes(k)) kesulitan = k;
      else err("Kesulitan harus mudah, sedang, atau sulit.");
    }

    let status = "aktif";
    if (v.status) {
      const s = norm(v.status);
      if ((STATUS_SOAL as readonly string[]).includes(s)) status = s;
      else if (s === "perlurevisi") status = "revisi";
      else err("Status harus aktif atau revisi.");
    }

    if (v.teks.length < 10 || v.teks.length > 1000) err("Pertanyaan harus 10 sampai 1000 karakter.");

    const opsi = [v.a, v.b, v.c, v.d, v.e];
    const opsiSalah = opsi
      .map((o, i) => (o.length < 1 || o.length > 255 ? "ABCDE"[i] : ""))
      .filter(Boolean);
    if (opsiSalah.length > 0) err(`Opsi ${opsiSalah.join(", ")} wajib diisi (maksimal 255 karakter).`);

    const km = /^(?:OPSI\s*)?([A-E])$/.exec(v.kunci.trim().toUpperCase());
    if (!km) err("Kunci harus huruf A, B, C, D, atau E.");

    let bobot = 1;
    if (v.bobot) {
      const b = Number(v.bobot.replace(",", "."));
      if (!Number.isFinite(b) || b <= 0 || b > 9.99) err("Bobot harus lebih dari 0 dan maksimal 9,99.");
      else bobot = Math.round(b * 100) / 100;
    }

    if (kategori && v.teks.length >= 10) {
      const key = kunciTeks(kategori, v.teks);
      if (sudahAda.has(key)) err("Soal yang sama sudah ada di Bank Soal.");
      else if (dalamFile.has(key)) err(`Soal ini dobel dengan baris ${dalamFile.get(key)}.`);
      else dalamFile.set(key, r);
    }

    if (errors.length === sebelum && kategori && km) {
      rows.push({ baris: r, kategori, topik: v.topik, kesulitan, status, teks: v.teks, opsi, kunci: km[1], bobot });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  if (rows.length === 0) {
    return { ok: false, errors: [], fatal: "File tidak berisi data soal. Isi soal mulai baris ke-2 pada sheet Soal." };
  }
  return { ok: true, rows };
}

/* ================= MENYIMPAN ================= */

export async function simpanSoal(rows: ParsedSoal[]) {
  const [mx] = await pool.query<RowDataPacket[]>(
    `SELECT kategori, COALESCE(MAX(CAST(SUBSTRING(kode, 5) AS UNSIGNED)), 0) AS n
     FROM bank_soal GROUP BY kategori`
  );
  const next = new Map<string, number>(mx.map((r) => [r.kategori as string, Number(r.n)]));
  const jumlah = new Map<string, number>();

  const values = rows.map((r) => {
    const prefix = KATEGORI_SOAL.find((k) => k.kode === r.kategori)!.prefix;
    const n = (next.get(r.kategori) ?? 0) + 1;
    next.set(r.kategori, n);
    jumlah.set(r.kategori, (jumlah.get(r.kategori) ?? 0) + 1);
    const kode = `${prefix}-${String(n).padStart(2, "0")}`;
    return [kode, r.kategori, r.topik, r.kesulitan, r.status, r.teks, ...r.opsi, r.kunci, r.bobot];
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < values.length; i += 100) {
      await conn.query(
        `INSERT INTO bank_soal
           (kode, kategori, topik, kesulitan, status, teks,
            opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci, bobot)
         VALUES ?`,
        [values.slice(i, i + 100)]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return KATEGORI_SOAL.filter((k) => jumlah.has(k.kode)).map((k) => ({
    label: k.nama,
    n: jumlah.get(k.kode) ?? 0,
  }));
}