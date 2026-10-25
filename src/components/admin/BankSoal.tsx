"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, Copy, Eye, FileText, Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ImportSoalButtons from "./ImportSoalButtons";
import Modal, { inputCls } from "./Modal";
import Pager from "./Pager";
import { KATEGORI_SOAL, KESULITAN, STATUS_SOAL } from "@/lib/admin-config";
import type { Soal } from "@/lib/soal";

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";
const PER_PAGE = 5;
const HURUF = ["A", "B", "C", "D", "E"];

const KESULITAN_UI = {
  mudah: { t: "Mudah", c: "bg-chip text-forest" },
  sedang: { t: "Sedang", c: "bg-pastel text-ink/75" },
  sulit: { t: "Sulit", c: "bg-red-100 text-[#c00000]" },
} as const;

type SoalForm = {
  kategori: string;
  topik: string;
  kesulitan: string;
  status: string;
  teks: string;
  opsi: string[];
  kunci: string;
  bobot: string;
};

const blank = (kategori: string): SoalForm => ({
  kategori,
  topik: "",
  kesulitan: "sedang",
  status: "aktif",
  teks: "",
  opsi: ["", "", "", "", ""],
  kunci: "A",
  bobot: "1",
});

const toForm = (s: Soal): SoalForm => ({
  kategori: s.kategori,
  topik: s.topik,
  kesulitan: s.kesulitan,
  status: s.status,
  teks: s.teks,
  opsi: [...s.opsi],
  kunci: s.kunci,
  bobot: String(s.bobot),
});

export default function BankSoal({
  items,
  passingGrade,
}: {
  items: Soal[];
  passingGrade: number;
}) {
  const router = useRouter();
  const [kat, setKat] = useState<string>(KATEGORI_SOAL[0].kode);
  const [q, setQ] = useState("");
  const [fKes, setFKes] = useState("semua");
  const [fTipe, setFTipe] = useState("semua");
  const [fStatus, setFStatus] = useState("semua");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<{ id: number | null } | null>(null);
  const [form, setForm] = useState<SoalForm>(blank(KATEGORI_SOAL[0].kode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const katInfo = KATEGORI_SOAL.find((k) => k.kode === kat)!;
  const countOf = (k: string) => items.filter((i) => i.kategori === k).length;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        i.kategori === kat &&
        (fKes === "semua" || i.kesulitan === fKes) &&
        (fTipe === "semua" || i.tipe === fTipe) &&
        (fStatus === "semua" || i.status === fStatus) &&
        (!s || `${i.kode} ${i.topik} ${i.teks} ${i.kunci}`.toLowerCase().includes(s))
    );
  }, [items, kat, q, fKes, fTipe, fStatus]);

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const cur = Math.min(page, totalPages);
  const rows = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const sel = items.find((i) => i.id === selId) ?? rows[0] ?? null;

  const resetFilters = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const openCreate = () => {
    setForm(blank(kat));
    setError("");
    setDialog({ id: null });
  };
  const openEdit = (s: Soal) => {
    setForm(toForm(s));
    setError("");
    setDialog({ id: s.id });
  };

  const submit = async (body: SoalForm, id: number | null) => {
    const res = await fetch("/api/admin/soal", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, id, bobot: Number(body.bobot) }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, message: (json.message as string) || "" };
  };

  const save = async () => {
    if (!dialog) return;
    setError("");
    setSaving(true);
    try {
      const r = await submit(form, dialog.id);
      if (!r.ok) return setError(r.message || "Gagal menyimpan soal.");
      setNotice(r.message);
      setDialog(null);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (s: Soal) => {
    const r = await submit(toForm(s), null);
    setNotice(r.ok ? `Soal diduplikasi. ${r.message}` : r.message);
    if (r.ok) router.refresh();
  };

  const remove = async (ids: number[]) => {
    if (!window.confirm(`Hapus ${ids.length} butir soal?`)) return;
    const res = await fetch(`/api/admin/soal?ids=${ids.join(",")}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(json.message || "Gagal menghapus soal.");
    if (res.ok) {
      setChecked(new Set());
      setSelId(null);
      router.refresh();
    }
  };

  const toggle = (id: number) =>
    setChecked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id));

  const total = items.length;
  const aktif = items.filter((i) => i.status === "aktif").length;
  const revisi = items.filter((i) => i.status === "revisi").length;
  const paket = new Set(items.filter((i) => i.status === "aktif").map((i) => i.kategori)).size;

  return (
    <section>
      <p className="text-[13px] uppercase tracking-wide text-ink/70">
        Evaluasi Akademik <span className="mx-1">›</span>
        <span className="font-bold text-forest">Bank Soal CBT</span>
      </p>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <h2 className="text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">
            Bank Soal CBT &amp; Evaluasi Akademik
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink/75">
            Kelola butir soal evaluasi skolastik, minat bakat, dan kemampuan akademik untuk seleksi penerimaan siswa baru SMK Citra Negara.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportSoalButtons onDone={setNotice} />
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest px-4 text-[13px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] hover:bg-brand-800">
            <Plus size={16} />
            Tambah Soal Baru
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#e8f4ec] px-4 py-2.5 text-[13px] text-forest">
          <Info size={16} className="mt-0.5 shrink-0" />
          {notice}
        </p>
      )}

      {/* Tab kategori */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {KATEGORI_SOAL.map((k) => (
          <button
            key={k.kode}
            type="button"
            onClick={() => resetFilters(() => setKat(k.kode))}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition ${
              kat === k.kode ? "bg-forest text-white" : "bg-wash text-ink hover:bg-[#d9f0e0]"
            }`}
          >
            {k.label}
            <span className={`rounded-full px-1.5 text-[11px] ${kat === k.kode ? "bg-white/20" : "bg-white text-ink/70"}`}>
              {countOf(k.kode)}
            </span>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className={`${card} mt-4 flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex h-11 min-w-[220px] flex-1 items-center gap-3 rounded-lg bg-wash px-4">
          <Search size={17} className="text-ink/55" />
          <input
            value={q}
            onChange={(e) => resetFilters(() => setQ(e.target.value))}
            placeholder="Cari butir soal, kode (misal MTH-01), topik, atau kata kunci..."
            className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink/45"
          />
        </div>
        {[
          ["Kesulitan", fKes, setFKes, [["semua", "Semua Tingkat"], ["mudah", "Mudah"], ["sedang", "Sedang"], ["sulit", "Sulit"]]],
          ["Tipe", fTipe, setFTipe, [["semua", "Semua Tipe"], ["pg", "Pilihan Ganda (PG)"]]],
          ["Status", fStatus, setFStatus, [["semua", "Semua Status"], ["aktif", "Aktif"], ["revisi", "Perlu Revisi"]]],
        ].map(([label, val, setter, opts]) => (
          <label key={label as string} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink/60">
            {label as string}:
            <select
              value={val as string}
              onChange={(e) => resetFilters(() => (setter as (v: string) => void)(e.target.value))}
              className="h-10 rounded-lg bg-wash px-3 text-[13px] font-semibold normal-case tracking-normal text-ink outline-none"
            >
              {(opts as string[][]).map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Daftar */}
        <div className={`${card} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[17px] font-medium text-ink">
              Daftar Butir Soal
              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-semibold text-forest">
                {filtered.length} Butir
              </span>
            </h3>
            <span className="text-[11.5px] text-ink/65">Passing Grade Terkini: <b className="text-ink">{passingGrade.toFixed(1)}</b></span>
          </div>

          {checked.size > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-[12.5px]">
              <span className="text-ink/80">{checked.size} soal dipilih</span>
              <button type="button" onClick={() => remove([...checked])} className="font-semibold text-[#c00000] hover:underline">
                Hapus Terpilih
              </button>
            </div>
          )}

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="bg-wash text-[10.5px] font-semibold uppercase tracking-wide text-ink/70">
                  <th className="w-9 rounded-tl-lg px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="size-4 accent-forest"
                      checked={allChecked}
                      onChange={() =>
                        setChecked((p) => {
                          const n = new Set(p);
                          rows.forEach((r) => (allChecked ? n.delete(r.id) : n.add(r.id)));
                          return n;
                        })
                      }
                      aria-label="Pilih semua"
                    />
                  </th>
                  <th className="px-2 py-2.5">ID Soal</th>
                  <th className="px-2 py-2.5">Pertanyaan / Konten Soal</th>
                  <th className="px-2 py-2.5">Kesulitan</th>
                  <th className="px-2 py-2.5">Stats (S.R.)</th>
                  <th className="rounded-tr-lg px-2 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[13.5px] text-ink/60">
                      Belum ada butir soal pada kategori ini.
                    </td>
                  </tr>
                )}
                {rows.map((s) => {
                  const k = KESULITAN_UI[s.kesulitan];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelId(s.id)}
                      className={`cursor-pointer border-b border-line/70 transition hover:bg-[#f4faf6] ${sel?.id === s.id ? "bg-[#f1f9f4]" : ""}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="size-4 accent-forest" checked={checked.has(s.id)} onChange={() => toggle(s.id)} />
                      </td>
                      <td className="px-2 py-3 text-[12.5px] font-semibold text-forest">{s.kode}</td>
                      <td className="max-w-[210px] px-2 py-3">
                        <p className="line-clamp-1 text-[13.5px] font-medium text-ink">{s.teks}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink/60">
                          {s.topik}
                          <span className="size-1 rounded-full bg-ink/30" />
                          Pilihan Ganda
                          <span className="size-1 rounded-full bg-ink/30" />
                          <span className={s.status === "aktif" ? "text-forest" : "text-[#8a5a00]"}>
                            {s.status === "aktif" ? "Aktif" : "Revisi"}
                          </span>
                        </p>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${k.c}`}>{k.t}</span>
                      </td>
                      <td className="px-2 py-3 text-[12px] text-ink/45">–</td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 text-ink/65">
                          <button type="button" aria-label="Pratinjau" onClick={() => setSelId(s.id)} className="rounded p-1.5 hover:bg-wash hover:text-forest"><Eye size={15} /></button>
                          <button type="button" aria-label="Edit" onClick={() => openEdit(s)} className="rounded p-1.5 hover:bg-wash hover:text-forest"><Pencil size={15} /></button>
                          <button type="button" aria-label="Hapus" onClick={() => remove([s.id])} className="rounded p-1.5 hover:bg-red-50 hover:text-[#c00000]"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-ink/70">
              Menampilkan <b className="text-ink">{filtered.length === 0 ? 0 : (cur - 1) * PER_PAGE + 1} - {(cur - 1) * PER_PAGE + rows.length}</b>{" "}
              dari <b className="text-ink">{filtered.length}</b> butir soal {katInfo.nama}
            </p>
            <Pager page={cur} total={totalPages} onChange={setPage} />
          </div>
        </div>

        {/* Preview */}
        <div className={`${card} p-4 sm:p-5`}>
          {!sel ? (
            <p className="py-16 text-center text-[13.5px] text-ink/60">Pilih butir soal untuk melihat pratinjau.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-[17px] font-medium text-ink">
                  <FileText size={18} className="text-forest" />
                  Preview &amp; Analisis Item
                </h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sel.status === "aktif" ? "bg-chip text-forest" : "bg-[#fff1b8] text-[#8a5a00]"}`}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {sel.status === "aktif" ? "Aktif" : "Perlu Revisi"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-wash px-3 py-2 text-[11.5px]">
                <span className="font-semibold text-forest">
                  ID SOAL: {sel.kode} ({KATEGORI_SOAL.find((k) => k.kode === sel.kategori)?.nama.toUpperCase()})
                </span>
                <span className="text-ink/65">Bobot: {sel.bobot.toFixed(2)} Poin</span>
              </div>

              <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-wide text-ink/55">Teks Pertanyaan</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-wash p-3.5 text-[14px] leading-relaxed text-ink">{sel.teks}</p>

              <div className="mt-4 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wide text-ink/55">
                <span>Pilihan Jawaban</span>
                <span className="text-forest">Kunci: Opsi {sel.kunci}</span>
              </div>
              <div className="mt-2 space-y-2">
                {sel.opsi.map((o, i) => {
                  const benar = HURUF[i] === sel.kunci;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] ${benar ? "bg-[#c9f2d6] font-medium text-ink" : "bg-wash text-ink/85"}`}>
                      <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded text-[12px] font-bold ${benar ? "bg-forest text-white" : "bg-white text-ink/70"}`}>
                        {HURUF[i]}
                      </span>
                      <span className="flex-1">{o}{benar && " (Kunci Jawaban)"}</span>
                      {benar && <CircleCheck size={18} className="shrink-0 text-forest" />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-wash p-3.5">
                <p className="text-[13px] font-semibold text-ink">Statistik Daya Pembeda Soal</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-[10.5px] text-ink/60">Rasio Menjawab Benar</p>
                    <p className="text-[20px] font-semibold text-ink/40">–</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-[10.5px] text-ink/60">Poin Biserial (P-B)</p>
                    <p className="text-[20px] font-semibold text-ink/40">–</p>
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink/65">
                  Statistik muncul otomatis setelah siswa mengerjakan soal ini melalui modul ujian CBT.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => duplicate(sel)} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-wash px-4 text-[13px] font-semibold text-ink hover:bg-[#d9f0e0]">
                  <Copy size={14} />
                  Duplikat
                </button>
                <button type="button" onClick={() => remove([sel.id])} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-red-50 px-4 text-[13px] font-semibold text-[#c00000] hover:bg-red-100">
                  <Trash2 size={14} />
                  Hapus
                </button>
                <button type="button" onClick={() => openEdit(sel)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-forest px-4 text-[13px] font-semibold text-white hover:bg-brand-800">
                  <Pencil size={14} />
                  Edit Butir Soal
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { v: aktif, l: "Total Soal Terverifikasi", icon: <Check size={20} />, c: "bg-chip text-forest" },
          { v: `${paket} Paket`, l: "Variasi Ujian Aktif", icon: <FileText size={20} />, c: "bg-pastel text-forest" },
          { v: "–", l: "Reliabilitas Tes (Alpha Cronbach)", icon: <CircleCheck size={20} />, c: "bg-pastel text-forest" },
          { v: `${revisi} Soal`, l: "Perlu Revisi / Evaluasi", icon: <Info size={20} />, c: "bg-red-100 text-[#c00000]" },
        ].map((s) => (
          <div key={s.l} className={`${card} flex items-center gap-3 p-4`}>
            <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-lg ${s.c}`}>{s.icon}</span>
            <span className="leading-tight">
              <span className="block text-[22px] font-semibold text-ink">{s.v}</span>
              <span className="block text-[12px] text-ink/65">{s.l}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-ink/50">Total {total} butir soal tersimpan di semua kategori.</p>

      {/* Dialog soal */}
      {dialog && (
        <Modal
          wide
          title={dialog.id ? "Edit Butir Soal" : "Tambah Soal Baru"}
          subtitle="Soal pilihan ganda dengan 5 opsi jawaban (A sampai E)."
          onClose={() => setDialog(null)}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-semibold text-ink">
                Kategori
                <select value={form.kategori} disabled={dialog.id !== null} onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))} className={`${inputCls} mt-1 disabled:bg-wash`}>
                  {KATEGORI_SOAL.map((k) => <option key={k.kode} value={k.kode}>{k.label}</option>)}
                </select>
              </label>
              <label className="block text-[12.5px] font-semibold text-ink">
                Topik
                <input value={form.topik} maxLength={60} onChange={(e) => setForm((p) => ({ ...p, topik: e.target.value }))} placeholder="Contoh: Geometri Ruang" className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-[12.5px] font-semibold text-ink">
                Tingkat Kesulitan
                <select value={form.kesulitan} onChange={(e) => setForm((p) => ({ ...p, kesulitan: e.target.value }))} className={`${inputCls} mt-1`}>
                  {KESULITAN.map((k) => <option key={k} value={k}>{KESULITAN_UI[k].t}</option>)}
                </select>
              </label>
              <label className="block text-[12.5px] font-semibold text-ink">
                Status Soal
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={`${inputCls} mt-1`}>
                  {STATUS_SOAL.map((s) => <option key={s} value={s}>{s === "aktif" ? "Aktif" : "Perlu Revisi"}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-[12.5px] font-semibold text-ink">
              Teks Pertanyaan
              <textarea value={form.teks} maxLength={1000} rows={4} onChange={(e) => setForm((p) => ({ ...p, teks: e.target.value }))} className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-forest focus:ring-2 focus:ring-forest/15" />
            </label>

            <div className="space-y-2">
              {HURUF.map((h, i) => (
                <div key={h} className="flex items-center gap-2">
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] font-bold text-forest" title="Jadikan kunci jawaban">
                    <input type="radio" name="kunci" checked={form.kunci === h} onChange={() => setForm((p) => ({ ...p, kunci: h }))} className="size-4 accent-forest" />
                    {h}
                  </label>
                  <input
                    value={form.opsi[i]}
                    maxLength={255}
                    onChange={(e) => setForm((p) => ({ ...p, opsi: p.opsi.map((o, j) => (j === i ? e.target.value : o)) }))}
                    placeholder={`Pilihan ${h}`}
                    className={inputCls}
                  />
                </div>
              ))}
              <p className="text-[11.5px] text-ink/60">Pilih tombol bulat di samping huruf untuk menandai kunci jawaban.</p>
            </div>

            <label className="block w-40 text-[12.5px] font-semibold text-ink">
              Bobot (Poin)
              <input type="number" min={0.25} max={9.99} step={0.25} value={form.bobot} onChange={(e) => setForm((p) => ({ ...p, bobot: e.target.value }))} className={`${inputCls} mt-1`} />
            </label>
          </div>

          {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setDialog(null)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">Batal</button>
            <button type="button" onClick={save} disabled={saving} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {saving ? "Menyimpan..." : "Simpan Soal"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}