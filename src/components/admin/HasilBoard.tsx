"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleCheck,
  CircleX,
  ClipboardClock,
  FileText,
  Info,
  Megaphone,
  RefreshCw,
  Save,
  Search,
  UserCheck,
} from "lucide-react";
import Modal, { inputCls } from "./Modal";
import Pagination from "./Pagination";
import {
  HASIL_LABEL,
  JALUR,
  PASSING_GRADE,
  todayWib,
  type HasilStatus,
} from "@/lib/admin-config";
import { buildQuery } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { PROGRAM_ADMIN } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";
import type { HasilRow } from "@/lib/hasil-admin";

const base = "/dashboard/admin/hasil";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";
const grid = "grid min-w-[900px] grid-cols-[0.3fr_1.15fr_1.7fr_0.95fr_1.25fr_1.2fr_1.5fr_0.9fr] items-center gap-3";

const CHIP: Record<HasilStatus, { c: string; d: string }> = {
  diterima: { c: "bg-chip text-forest", d: "bg-forest" },
  cadangan: { c: "bg-pastel text-ink/75", d: "bg-ink/45" },
  tidak_diterima: { c: "bg-red-100 text-[#c00000]", d: "bg-[#c00000]" },
  belum: { c: "bg-white text-ink/55 ring-1 ring-line", d: "bg-ink/30" },
};

type Counts = { total: number; diterima: number; cadangan: number; tidak: number; pub: number };
type Filters = { q: string; program: string; jalur: string; tab: string };

export default function HasilBoard({
  rows,
  counts,
  total,
  page,
  perPage,
  filters,
}: {
  rows: HasilRow[];
  counts: Counts;
  total: number;
  page: number;
  perPage: number;
  filters: Filters;
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState<HasilStatus>("diterima");
  const [edit, setEdit] = useState<HasilRow | null>(null);
  const [ef, setEf] = useState({ cbt: "", hasil: "belum" as HasilStatus, jalur: "Reguler", catatan: "" });
  const [pubOpen, setPubOpen] = useState(false);
  const [pf, setPf] = useState({ noSk: "", yudisium: todayWib(), batas: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dlgError, setDlgError] = useState("");

  const go = (o: Partial<Filters> & { page?: number }) => {
    const f = { ...filters, q, ...o };
    setSel(new Set());
    router.push(
      `${base}${buildQuery({
        q: f.q,
        program: f.program,
        jalur: f.jalur,
        tab: f.tab === "semua" ? undefined : f.tab,
        page: o.page && o.page > 1 ? o.page : undefined,
      })}`
    );
  };

  const call = async (url: string, method: string, body: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: (json.message as string) || "" };
  };

  const run = async (url: string, method: string, body: unknown, after?: () => void) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await call(url, method, body);
      setMsg({ ok: r.ok, text: r.message || (r.ok ? "Berhasil." : "Gagal memproses permintaan.") });
      if (r.ok) {
        after?.();
        router.refresh();
      }
      return r.ok;
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (r: HasilRow) => {
    setEdit(r);
    setDlgError("");
    setEf({
      cbt: r.nilaiCbt === null ? "" : String(r.nilaiCbt),
      hasil: r.hasil,
      jalur: r.jalur,
      catatan: r.catatan,
    });
  };

  const saveEdit = async () => {
    if (!edit) return;
    setDlgError("");
    setBusy(true);
    try {
      const r = await call("/api/admin/hasil", "PATCH", {
        userId: edit.id,
        nilaiCbt: ef.cbt,
        hasil: ef.hasil,
        jalur: ef.jalur,
        catatan: ef.catatan,
      });
      if (!r.ok) return setDlgError(r.message || "Gagal menyimpan.");
      setEdit(null);
      setMsg({ ok: true, text: `Data seleksi ${edit.nama} tersimpan.` });
      router.refresh();
    } catch {
      setDlgError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setDlgError("");
    setBusy(true);
    try {
      const r = await call("/api/admin/hasil/publish", "POST", {
        noSk: pf.noSk,
        tanggalYudisium: pf.yudisium,
        batasDaftarUlang: pf.batas,
      });
      if (!r.ok) return setDlgError(r.message || "Gagal mempublikasikan.");
      setPubOpen(false);
      setMsg({ ok: true, text: r.message });
      router.refresh();
    } catch {
      setDlgError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const cbtN = ef.cbt === "" ? null : Number(ef.cbt);
  const preview = cbtN !== null && Number.isFinite(cbtN) ? cbtN : null;

  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const offset = (page - 1) * perPage;
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const dinilai = counts.diterima + counts.cadangan + counts.tidak;

  const tabs: [string, string, number][] = [
    ["semua", "Semua", counts.total],
    ["diterima", "Diterima", counts.diterima],
    ["cadangan", "Cadangan", counts.cadangan],
    ["tidak_diterima", "Belum Diterima", counts.tidak],
  ];

  const stat = (label: string, icon: React.ReactNode, value: number, caption: string, tone: string) => (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink/65">{label}</p>
        <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-1 text-[32px] font-semibold leading-none text-ink">
        {value} <span className="text-[17px] font-normal text-ink/70">Siswa</span>
      </p>
      <p className="mt-2 text-[12px] text-ink/65">{caption}</p>
    </div>
  );

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Penetapan Kelulusan &amp; Hasil Seleksi
          </span>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Hasil Seleksi</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">
            Kelola dan tetapkan status kelulusan calon siswa baru Gelombang 1 &amp; 2 berdasarkan verifikasi berkas dan nilai tes CBT.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] hover:bg-wash">
            <FileText size={16} />
            Unduh Rekap SK Kelulusan (PDF)
          </button>
          <button
            type="button"
            onClick={() => {
              setDlgError("");
              setPubOpen(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] hover:bg-brand-800"
          >
            <Megaphone size={16} />
            Publikasikan Hasil Seleksi
          </button>
          {counts.pub > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Tarik publikasi? Siswa akan kembali melihat status belum diumumkan.")) {
                  run("/api/admin/hasil/publish", "POST", { unpublish: true });
                }
              }}
              className="text-center text-[12px] font-semibold text-[#c00000] hover:underline"
            >
              Tarik Publikasi ({counts.pub} siswa sudah tampil)
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat("Total Peserta Seleksi", <UserCheck size={20} />, counts.total, "Formulir terkirim & mengikuti seleksi", "bg-pastel text-forest")}
        {stat("Diterima", <CircleCheck size={20} />, counts.diterima, "Memenuhi kuota jurusan", "bg-chip text-forest")}
        {stat("Cadangan", <ClipboardClock size={20} />, counts.cadangan, "Menunggu konfirmasi daftar ulang", "bg-pastel text-forest")}
        {stat("Belum Diterima", <CircleX size={20} />, counts.tidak, `Nilai di bawah passing grade ${PASSING_GRADE}`, "bg-red-100 text-[#c00000]")}
      </div>

      {msg && (
        <p className={`mt-5 rounded-lg px-4 py-2.5 text-[13px] ${msg.ok ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"}`}>
          {msg.text}
        </p>
      )}

      <div className={`${card} mt-6 p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go({ q });
            }}
            className="flex h-11 min-w-[220px] flex-1 items-center gap-3 rounded-lg bg-wash px-4"
          >
            <Search size={17} className="text-ink/55" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama siswa, nomor pendaftaran, atau jurusan" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/45" />
          </form>
          <div className="relative">
            <select value={filters.program} onChange={(e) => go({ program: e.target.value })} className="h-11 appearance-none rounded-lg bg-wash pl-4 pr-9 text-[14px] text-ink outline-none">
              <option value="">Semua Program Keahlian</option>
              {(Object.keys(PROGRAM_ADMIN) as ProgramKode[]).map((k) => (
                <option key={k} value={k}>{PROGRAM_ADMIN[k].singkat}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/55" />
          </div>
          <div className="relative">
            <select value={filters.jalur} onChange={(e) => go({ jalur: e.target.value })} className="h-11 appearance-none rounded-lg bg-wash pl-4 pr-9 text-[14px] text-ink outline-none">
              <option value="">Semua Jalur</option>
              {JALUR.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/55" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map(([k, label, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => go({ tab: k })}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                  filters.tab === k ? "bg-forest text-white" : "bg-wash text-ink hover:bg-[#d9f0e0]"
                }`}
              >
                {label} ({n})
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink/65 print:hidden">
            <span>{sel.size} terpilih</span>
            <select value={bulk} onChange={(e) => setBulk(e.target.value as HasilStatus)} className="h-9 rounded-md bg-wash px-2 text-[12.5px] font-medium text-ink outline-none">
              <option value="diterima">Diterima</option>
              <option value="cadangan">Cadangan</option>
              <option value="tidak_diterima">Belum Diterima</option>
            </select>
            <button
              type="button"
              disabled={sel.size === 0 || busy}
              onClick={() => run("/api/admin/hasil", "PATCH", { userIds: [...sel], hasil: bulk }, () => setSel(new Set()))}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-wash px-3 text-[12.5px] font-semibold text-ink transition enabled:hover:bg-[#d9f0e0] disabled:opacity-50"
            >
              <RefreshCw size={13} />
              Simpan Perubahan Status
            </button>
          </div>
        </div>
      </div>

      <div className={`${card} mt-6 overflow-hidden`}>
        <div className="overflow-x-auto">
          <div className={`${grid} bg-wash px-5 py-4 text-[11px] font-semibold uppercase tracking-wide text-ink/75`}>
            <input
              type="checkbox"
              className="size-4 accent-forest"
              checked={allSel}
              aria-label="Pilih semua"
              onChange={() =>
                setSel((p) => {
                  const n = new Set(p);
                  rows.forEach((r) => (allSel ? n.delete(r.id) : n.add(r.id)));
                  return n;
                })
              }
            />
            <span>No. &amp; ID Registrasi</span>
            <span>Nama Calon Siswa &amp; Asal Sekolah</span>
            <span>Pilihan Jurusan</span>
            <span>Nilai CBT</span>
            <span>Status Kelulusan</span>
            <span>Catatan / Jalur</span>
            <span className="text-right">Aksi</span>
          </div>

          {rows.length === 0 ? (
            <p className="py-12 text-center text-[14px] text-ink/60">Tidak ada peserta yang cocok dengan pencarian.</p>
          ) : (
            rows.map((r, i) => {
              const ch = CHIP[r.hasil];
              const nilai = r.skor ?? r.nilaiCbt;
              const lulus = nilai !== null && nilai >= PASSING_GRADE;
              return (
                <div key={r.id} className={`${grid} border-b border-line/70 px-5 py-4`}>
                  <input
                    type="checkbox"
                    className="size-4 accent-forest"
                    checked={sel.has(r.id)}
                    aria-label={`Pilih ${r.nama}`}
                    onChange={() =>
                      setSel((p) => {
                        const n = new Set(p);
                        if (n.has(r.id)) n.delete(r.id);
                        else n.add(r.id);
                        return n;
                      })
                    }
                  />
                  <div className="leading-tight">
                    <p className="text-[16px] font-medium text-ink">{String(offset + i + 1).padStart(2, "0")}</p>
                    <p className="font-mono text-[10.5px] text-ink/60">{nomorRegistrasi(r.id)}</p>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[15px] font-medium text-ink">{r.nama}</p>
                    <p className="truncate text-[12px] text-ink/65">{r.sekolah || "-"}</p>
                  </div>
                  <span>
                    {r.program ? (
                      <span className="rounded bg-chip/60 px-2 py-1 text-[12px] font-medium text-forest">
                        {PROGRAM_ADMIN[r.program as ProgramKode]?.singkat ?? r.program}
                      </span>
                    ) : (
                      <span className="text-ink/40">-</span>
                    )}
                  </span>
                  <div className="leading-tight">
                    {nilai !== null ? (
                      <>
                        <p className={`text-[17px] font-semibold ${lulus ? "text-forest" : "text-[#c00000]"}`}>
                          {nilai.toFixed(2)} <span className="text-[11px] font-normal text-ink/55">/ 100</span>
                        </p>
                        <p className="text-[11px] text-ink/60">Nilai ujian CBT</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[17px] font-semibold text-ink/35">–</p>
                        <p className="text-[11px] text-ink/50">Belum mengerjakan CBT</p>
                      </>
                    )}
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${ch.c}`}>
                    <span className={`size-1.5 rounded-full ${ch.d}`} />
                    {HASIL_LABEL[r.hasil]}
                  </span>
                  <div className="text-[13px] leading-tight">
                    <p className="font-medium text-ink">{r.jalur}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink/60">{r.catatan || "-"}</p>
                  </div>
                  <div className="text-right print:hidden">
                    <button type="button" onClick={() => openEdit(r)} className="rounded-md bg-wash px-3 py-2 text-[12.5px] font-semibold leading-tight text-forest transition hover:bg-[#d9f0e0]">
                      Ubah<br />Status
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-[13px] text-ink/70">
            Menampilkan <b className="text-ink">{total === 0 ? 0 : offset + 1} - {offset + rows.length}</b> dari{" "}
            <b className="text-ink">{total}</b> siswa peserta seleksi
          </p>
          <div className="flex flex-wrap items-center gap-4 print:hidden">
            <Pagination
              page={page}
              totalPages={totalPages}
              hrefFor={(p) =>
                `${base}${buildQuery({
                  q: filters.q,
                  program: filters.program,
                  jalur: filters.jalur,
                  tab: filters.tab === "semua" ? undefined : filters.tab,
                  page: p > 1 ? p : undefined,
                })}`
              }
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run("/api/admin/hasil", "PATCH", { action: "hitung" })}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] hover:bg-brand-800 disabled:opacity-60"
            >
              <Save size={16} />
              Simpan Hasil Seleksi
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Ubah Status */}
      {edit && (
        <Modal wide title={`Ubah Status: ${edit.nama}`} subtitle={`${nomorRegistrasi(edit.id)} • ${edit.sekolah || "-"}`} onClose={() => setEdit(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[12.5px] font-semibold text-ink">
              Nilai CBT (0-100)
              <input type="number" min={0} max={100} step="0.01" value={ef.cbt} onChange={(e) => setEf((p) => ({ ...p, cbt: e.target.value }))} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-[12.5px] font-semibold text-ink">
              Status Kelulusan
              <select value={ef.hasil} onChange={(e) => setEf((p) => ({ ...p, hasil: e.target.value as HasilStatus }))} className={`${inputCls} mt-1`}>
                {(Object.keys(HASIL_LABEL) as HasilStatus[]).map((k) => <option key={k} value={k}>{HASIL_LABEL[k]}</option>)}
              </select>
            </label>
            <label className="block text-[12.5px] font-semibold text-ink">
              Jalur Pendaftaran
              <select value={ef.jalur} onChange={(e) => setEf((p) => ({ ...p, jalur: e.target.value }))} className={`${inputCls} mt-1`}>
                {JALUR.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </label>
            <label className="block text-[12.5px] font-semibold text-ink">
              Catatan
              <input value={ef.catatan} maxLength={150} onChange={(e) => setEf((p) => ({ ...p, catatan: e.target.value }))} placeholder="Contoh: Ranking 3 Paralel" className={`${inputCls} mt-1`} />
            </label>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-wash px-3 py-2.5 text-[12.5px] leading-relaxed text-ink/80">
            <Info size={15} className="mt-0.5 shrink-0 text-forest" />
            {preview === null ? (
              "Nilai CBT terisi otomatis dari ujian online siswa. Ubah manual hanya jika diperlukan."
            ) : (
              <span>
                Nilai akhir = nilai CBT: <b className="text-ink">{preview.toFixed(2)}</b> —{" "}
                {preview >= PASSING_GRADE ? "di atas" : "di bawah"} passing grade {PASSING_GRADE}.
              </span>
            )}
          </p>

          {dlgError && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{dlgError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setEdit(null)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">Batal</button>
            <button type="button" onClick={saveEdit} disabled={busy} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {/* Dialog Publikasi */}
      {pubOpen && (
        <Modal title="Publikasikan Hasil Seleksi" subtitle={`${dinilai} peserta berstatus Diterima, Cadangan, atau Belum Diterima akan tampil di portal siswa.`} onClose={() => setPubOpen(false)}>
          <div className="space-y-4">
            <label className="block text-[12.5px] font-semibold text-ink">
              Nomor SK Keputusan
              <input value={pf.noSk} maxLength={60} onChange={(e) => setPf((p) => ({ ...p, noSk: e.target.value }))} placeholder="421.5/SK-089/SMK-CN/IV/2026" className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-[12.5px] font-semibold text-ink">
              Tanggal Penetapan Yudisium
              <input type="date" value={pf.yudisium} onChange={(e) => setPf((p) => ({ ...p, yudisium: e.target.value }))} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-[12.5px] font-semibold text-ink">
              Batas Akhir Daftar Ulang
              <input type="date" value={pf.batas} onChange={(e) => setPf((p) => ({ ...p, batas: e.target.value }))} className={`${inputCls} mt-1`} />
            </label>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-ink/65">
            Peringkat dan kuota terisi per jurusan dihitung otomatis saat dipublikasikan.
          </p>
          {dlgError && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{dlgError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setPubOpen(false)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">Batal</button>
            <button type="button" onClick={publish} disabled={busy} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {busy ? "Memproses..." : "Publikasikan"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}