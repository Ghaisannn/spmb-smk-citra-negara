"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CirclePlus,
  Clock,
  Eye,
  FilePenLine,
  Megaphone,
  NotebookPen,
  Pencil,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import Modal, { inputCls } from "./Modal";
import { KATEGORI_PENGUMUMAN, TARGET_PENGUMUMAN } from "@/lib/admin-config";
import { formatTanggal } from "@/lib/biodata-schema";
import type { PengumumanRow } from "@/lib/pengumuman";

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";
type Tab = "semua" | "dipublikasi" | "draft";
type Form = {
  judul: string;
  kategori: string;
  target: string;
  tanggal: string;
  status: "dipublikasi" | "draft";
  prioritas: boolean;
  isi: string;
};

export default function PengumumanManager({
  items,
  hariIni,
}: {
  items: PengumumanRow[];
  hariIni: string;
}) {
  const router = useRouter();
  const blank: Form = {
    judul: "",
    kategori: KATEGORI_PENGUMUMAN[0],
    target: TARGET_PENGUMUMAN[0],
    tanggal: hariIni,
    status: "dipublikasi",
    prioritas: false,
    isi: "",
  };

  const [tab, setTab] = useState<Tab>("semua");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form>(blank);
  const [editId, setEditId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PengumumanRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const pub = items.filter((i) => i.status === "dipublikasi").length;
  const draft = items.length - pub;

  const visible = items.filter(
    (i) =>
      (tab === "semua" || i.status === tab) &&
      (!q.trim() || i.judul.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const toForm = () =>
    document.getElementById("form-pengumuman")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const startCreate = () => {
    setEditId(null);
    setForm(blank);
    setError("");
    toForm();
  };
  const startEdit = (p: PengumumanRow) => {
    setEditId(p.id);
    setForm({
      judul: p.judul,
      kategori: p.kategori,
      target: p.target,
      tanggal: p.tanggal,
      status: p.status,
      prioritas: p.prioritas,
      isi: p.isi,
    });
    setError("");
    toForm();
  };

  const save = async () => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pengumuman", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal menyimpan pengumuman.");
      setNotice(json.message);
      setEditId(null);
      setForm(blank);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const publishNow = async (p: PengumumanRow) => {
    const res = await fetch("/api/admin/pengumuman", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(json.message || "Gagal mempublikasikan.");
    if (res.ok) router.refresh();
  };

  const remove = async (p: PengumumanRow) => {
    if (!window.confirm(`Hapus pengumuman "${p.judul}"?`)) return;
    const res = await fetch(`/api/admin/pengumuman?id=${p.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(json.message || "Gagal menghapus pengumuman.");
    if (res.ok) {
      if (editId === p.id) startCreate();
      router.refresh();
    }
  };

  const stat = (label: string, badge: string | null, icon: React.ReactNode, value: number, caption: string) => (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-medium uppercase leading-snug tracking-wide text-ink/65">{label}</p>
        <div className="flex items-center gap-2">
          {badge && <span className="rounded bg-chip px-2 py-0.5 text-[10.5px] font-semibold text-forest">{badge}</span>}
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">{icon}</span>
        </div>
      </div>
      <p className="mt-1 text-[30px] font-semibold leading-none text-ink">
        {value} <span className="text-[17px] font-normal text-forest">Informasi</span>
      </p>
      <p className="mt-2 text-[12px] text-ink/65">{caption}</p>
    </div>
  );

  const tabs: [Tab, string, number][] = [
    ["semua", "Semua", items.length],
    ["dipublikasi", "Dipublikasikan", pub],
    ["draft", "Draft", draft],
  ];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[620px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Informasi &amp; Pengumuman Resmi
          </span>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Pengumuman</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">
            Buat, perbarui, dan publikasikan informasi resmi penerimaan siswa baru ke portal calon siswa dan website SPMB.
          </p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex h-12 items-center gap-2 rounded-lg bg-forest px-6 text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] hover:bg-brand-800">
          <CirclePlus size={19} />
          Buat Pengumuman Baru
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className={`${card} p-5`}>
          <div className="flex items-start justify-between">
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink/65">Total Pengumuman</p>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest"><Megaphone size={20} /></span>
          </div>
          <p className="mt-1 text-[30px] font-semibold leading-none text-ink">
            {items.length} <span className="text-[17px] font-normal text-ink/70">Pengumuman</span>
          </p>
          <p className="mt-2 text-[12px] text-ink/65">Tahun Ajaran 2026/2027</p>
        </div>
        {stat("Berstatus Publik (Aktif)", "Aktif", <Eye size={20} />, pub, "Tampil di portal siswa")}
        {stat("Draft / Terjadwal", "Draft", <NotebookPen size={20} />, draft, "Belum dipublikasikan")}
      </div>

      {notice && <p className="mt-5 rounded-lg bg-[#e8f4ec] px-4 py-2.5 text-[13px] text-forest">{notice}</p>}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <div className={`${card} flex flex-wrap items-center gap-3 p-3`}>
            <div className="flex gap-1 rounded-lg bg-wash p-1">
              {tabs.map(([k, label, n]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-md px-3.5 py-2 text-[13px] font-medium transition ${tab === k ? "bg-white text-forest shadow-sm" : "text-ink/75 hover:text-ink"}`}>
                  {label} ({n})
                </button>
              ))}
            </div>
            <div className="flex h-10 min-w-[150px] flex-1 items-center gap-2 rounded-lg bg-wash px-3">
              <Search size={15} className="text-ink/55" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul pengumuman..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink/45" />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {visible.length === 0 && (
              <p className={`${card} p-10 text-center text-[14px] text-ink/60`}>Tidak ada pengumuman pada tampilan ini.</p>
            )}
            {visible.map((p) => {
              const isDraft = p.status === "draft";
              const jadwal = !isDraft && p.tanggal > hariIni;
              return (
                <article key={p.id} className={`${card} p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${isDraft ? "bg-pastel text-ink/70" : jadwal ? "bg-[#fff1b8] text-[#8a5a00]" : "bg-chip text-forest"}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {isDraft ? "Draft" : jadwal ? "Terjadwal" : "Dipublikasikan"}
                      </span>
                      <span className="rounded-full bg-pastel px-3 py-1 text-[12px] font-medium text-ink/75">{p.kategori}</span>
                      {p.prioritas && (
                        <span className="rounded-full bg-[#ffe3e3] px-3 py-1 text-[12px] font-semibold text-[#c00000]">! Prioritas Tinggi</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/65">
                      <Clock size={13} />
                      {isDraft ? `Tersimpan Draft: ${formatTanggal(p.updatedAt.slice(0, 10))}` : formatTanggal(p.tanggal)}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[19px] font-medium leading-snug text-ink">{p.judul}</h3>
                  <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-ink/70">{p.isi}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-[12.5px] text-ink/70">
                      <Users size={15} />
                      Target:
                      <span className="rounded bg-pastel px-2 py-1 text-[11.5px] font-medium text-ink">{p.target}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[13px] font-semibold text-forest">
                      <button type="button" onClick={() => startEdit(p)} className="inline-flex items-center gap-1.5 hover:underline">
                        <Pencil size={14} />
                        {isDraft ? "Lanjutkan Edit" : "Edit"}
                      </button>
                      {isDraft ? (
                        <button type="button" onClick={() => publishNow(p)} className="inline-flex items-center gap-1.5 hover:underline">
                          <Send size={14} />
                          Publikasikan Sekarang
                        </button>
                      ) : (
                        <button type="button" onClick={() => setPreview(p)} className="inline-flex items-center gap-1.5 text-ink hover:text-forest">
                          <Eye size={14} />
                          Pratinjau
                        </button>
                      )}
                      <button type="button" aria-label="Hapus" onClick={() => remove(p)} className="text-[#c00000] hover:opacity-80">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <aside id="form-pengumuman" className={`${card} scroll-mt-24 p-5 sm:p-6 lg:sticky lg:top-[90px]`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-medium text-ink">
                <FilePenLine size={20} className="text-forest" />
                Form Pengumuman
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink/65">Tulis atau perbarui pengumuman untuk portal siswa</p>
            </div>
            <span className="rounded bg-chip px-2 py-1 text-[11px] font-semibold leading-tight text-forest">
              Mode<br />{editId ? "Edit" : "Buat"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-[13px] font-semibold text-ink">
              Judul Pengumuman <span className="text-[#c00000]">*</span>
              <input value={form.judul} maxLength={150} onChange={(e) => setForm((p) => ({ ...p, judul: e.target.value }))} placeholder="Contoh: Panduan Daftar Ulang Siswa Baru" className={`${inputCls} mt-1.5 !bg-wash`} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-semibold text-ink">
                Kategori / Topik
                <select value={form.kategori} onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))} className={`${inputCls} mt-1.5 !bg-wash`}>
                  {KATEGORI_PENGUMUMAN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="block text-[13px] font-semibold text-ink">
                Target Penerima
                <select value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} className={`${inputCls} mt-1.5 !bg-wash`}>
                  {TARGET_PENGUMUMAN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-[13px] font-semibold text-ink">
              Tanggal Publikasi <span className="text-[#c00000]">*</span>
              <input type="date" value={form.tanggal} onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))} className={`${inputCls} mt-1.5 !bg-wash`} />
            </label>

            <div>
              <p className="text-[13px] font-semibold text-ink">Status Publikasi</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink">
                {([["dipublikasi", "Langsung Publikasikan"], ["draft", "Simpan sebagai Draft"]] as const).map(([v, t]) => (
                  <label key={v} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="status-pub" checked={form.status === v} onChange={() => setForm((p) => ({ ...p, status: v }))} className="size-4 accent-forest" />
                    {t}
                  </label>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                <input type="checkbox" checked={form.prioritas} onChange={(e) => setForm((p) => ({ ...p, prioritas: e.target.checked }))} className="size-4 accent-forest" />
                Tandai sebagai Prioritas Tinggi
              </label>
            </div>

            <label className="block text-[13px] font-semibold text-ink">
              Isi Pengumuman <span className="text-[#c00000]">*</span>
              <textarea value={form.isi} maxLength={2000} rows={6} onChange={(e) => setForm((p) => ({ ...p, isi: e.target.value }))} placeholder="Tuliskan detail pengumuman yang jelas dan mudah dipahami calon siswa..." className="mt-1.5 w-full resize-none rounded-lg border border-transparent bg-wash px-3 py-2.5 text-[14px] font-normal outline-none placeholder:text-ink/40 focus:border-forest focus:ring-2 focus:ring-forest/15" />
              <span className="mt-1 block text-right text-[11.5px] font-normal text-ink/60">
                {form.isi.length} / 2.000 karakter
              </span>
            </label>
          </div>

          {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={startCreate} className="px-4 text-[14px] font-medium text-ink hover:text-forest">Batal</button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] hover:bg-brand-800 disabled:opacity-60">
              <Send size={15} />
              {saving ? "Menyimpan..." : form.status === "draft" ? "Simpan Draft" : "Publikasikan Pengumuman"}
            </button>
          </div>
        </aside>
      </div>

      {preview && (
        <Modal wide title="Pratinjau Pengumuman" subtitle="Tampilan di portal calon siswa" onClose={() => setPreview(null)}>
          <div className="rounded-xl bg-wash p-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink/70">
              <span className={`rounded px-2 py-0.5 text-[11.5px] font-semibold ${preview.prioritas ? "bg-[#ffe3e3] text-[#c00000]" : "bg-chip text-forest"}`}>
                {preview.prioritas ? "! " : ""}{preview.kategori}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={13} />
                {formatTanggal(preview.tanggal)}
              </span>
            </div>
            <h3 className="mt-3 text-[22px] font-medium leading-snug text-ink">{preview.judul}</h3>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-ink/80">{preview.isi}</p>
            <p className="mt-4 text-[12px] text-ink/60">Target: {preview.target}</p>
          </div>
        </Modal>
      )}
    </section>
  );
}