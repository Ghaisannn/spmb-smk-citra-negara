"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Info,
  MonitorCheck,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { PROGRAM_ICON } from "@/components/dashboard/program-icons";
import {
  PROGRAM_ADMIN,
  SISWA_PER_ROMBEL,
  kapasitasOf,
  statusKuota,
} from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";

export type BoardItem = {
  kode: ProgramKode;
  rombel: number;
  kepala: string;
  terisi: number;
};

type Tab = "semua" | "lebih50" | "hampir";
type Editing = { type: "single"; kode: ProgramKode } | { type: "bulk" } | null;

export default function ProgramBoard({ items }: { items: BoardItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("semua");
  const [editing, setEditing] = useState<Editing>(null);
  const [form, setForm] = useState<Record<string, { rombel: string; kepala: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const enriched = useMemo(
    () =>
      items.map((it) => {
        const kap = kapasitasOf(it.rombel);
        return { ...it, kap, st: statusKuota(it.terisi, kap) };
      }),
    [items]
  );

  const cnt = {
    semua: enriched.length,
    lebih50: enriched.filter((e) => e.st.pct > 50 && e.st.pct < 75).length,
    hampir: enriched.filter((e) => e.st.pct >= 75).length,
  };

  const visible = enriched.filter((e) => {
    const m = PROGRAM_ADMIN[e.kode];
    const hay = `${m.singkat} ${m.nama} ${m.bidang} ${e.kepala} ${e.kode}`.toLowerCase();
    if (q.trim() && !hay.includes(q.trim().toLowerCase())) return false;
    if (tab === "lebih50") return e.st.pct > 50 && e.st.pct < 75;
    if (tab === "hampir") return e.st.pct >= 75;
    return true;
  });

  const openEdit = (mode: Exclude<Editing, null>) => {
    setError("");
    setForm(
      Object.fromEntries(
        items.map((it) => [it.kode, { rombel: String(it.rombel), kepala: it.kepala }])
      )
    );
    setEditing(mode);
  };

  const save = async () => {
    if (!editing) return;
    setError("");

    const kodes =
      editing.type === "single" ? [editing.kode] : items.map((i) => i.kode);
    const payload = kodes.map((kode) => ({
      kode,
      rombel: Number(form[kode]?.rombel),
      ...(editing.type === "single" ? { kepala: form[kode]?.kepala ?? "" } : {}),
    }));

    setSaving(true);
    try {
      const res = await fetch("/api/admin/program", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal menyimpan.");
      setEditing(null);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-forest focus:ring-2 focus:ring-forest/15";

  const tabBtn = (t: Tab, label: string, n: number) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className={`rounded-md px-4 py-2 text-[13px] font-medium transition ${
        tab === t ? "bg-white text-forest shadow-sm" : "text-ink/75 hover:text-ink"
      }`}
    >
      {label} ({n})
    </button>
  );

  return (
    <>
      {/* Header aksi */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => openEdit({ type: "bulk" })}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
        >
          <SlidersHorizontal size={16} />
          Atur Daya Tampung
        </button>
        <button
          type="button"
          onClick={() =>
            setNotice(
              "Penambahan program keahlian baru memerlukan penyesuaian kurikulum dan sistem. Hubungi pengembang aplikasi."
            )
          }
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800"
        >
          <Plus size={17} />
          Tambah Program Keahlian
        </button>
      </div>
      {notice && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1b8] px-4 py-2.5 text-[13px] text-[#8a5a00]">
          <Info size={16} className="mt-0.5 shrink-0" />
          {notice}
        </p>
      )}

      {/* Cari + tab */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
        <div className="flex h-11 min-w-[240px] flex-1 items-center gap-3 rounded-lg bg-wash px-4">
          <Search size={18} className="text-ink/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama program keahlian, kepala program, atau kode jurusan..."
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/45"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-wash p-1">
          {tabBtn("semua", "Semua Jurusan", cnt.semua)}
          {tabBtn("lebih50", "Kuota >50%", cnt.lebih50)}
          {tabBtn("hampir", "Kuota Hampir Penuh", cnt.hampir)}
        </div>
      </div>

      {/* Kartu program */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((e) => {
          const m = PROGRAM_ADMIN[e.kode];
          const Icon = PROGRAM_ICON[e.kode];
          const sisa = Math.max(e.kap - e.terisi, 0);
          return (
            <article
              key={e.kode}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
                    <Icon size={22} />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[17px] font-semibold text-ink">{m.singkat}</span>
                    <span className="block text-[12px] text-ink/70">{m.bidang}</span>
                  </span>
                </div>
                <span className={`rounded-md px-2 py-1 text-[11.5px] font-semibold ${e.st.cls}`}>
                  {e.st.label}
                </span>
              </div>

              <h3 className="mt-4 text-[18px] font-medium leading-snug text-ink">{m.nama}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/70">{m.desc}</p>

              <div className="mt-4 rounded-xl bg-wash p-3.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium uppercase tracking-wide text-ink/60">
                    Keterisian Kuota
                  </span>
                  <span className="text-[13px] font-semibold text-forest">
                    {e.terisi} / {e.kap} Siswa ({Math.round(e.st.pct)}%)
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-forest"
                    style={{ width: `${Math.min(e.st.pct, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[12px] text-ink/75">
                  <span>Tersisa: {sisa} Kursi</span>
                  <span>{e.rombel} Kelas Paralel</span>
                </div>
              </div>

              <p className="mt-4 text-[11.5px] text-ink/60">Kepala Program:</p>
              <p className="mt-0.5 flex items-center gap-2 text-[13.5px] font-medium text-ink">
                <User size={14} className="text-ink/55" />
                {e.kepala}
              </p>

              <div className="mt-auto flex gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => openEdit({ type: "single", kode: e.kode })}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-wash text-[13.5px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
                >
                  Edit Jurusan
                </button>
                <Link
                  href={`/dashboard/admin/data-pendaftar?program=${e.kode}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-forest px-2 text-center text-[13px] font-semibold leading-tight text-white transition hover:bg-brand-800"
                >
                  Lihat Pendaftar ({e.terisi})
                </Link>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full rounded-2xl bg-white p-8 text-center text-[14px] text-ink/65">
            Tidak ada program keahlian yang cocok.
          </p>
        )}
      </div>

      {/* Sinkronisasi */}
      <section className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)] sm:p-6">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
          <MonitorCheck size={22} />
        </span>
        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[18px] font-medium text-ink">
              Informasi Sinkronisasi Dapodik &amp; Kurikulum Merdeka
            </h3>
            <span className="rounded-md bg-chip px-2 py-1 text-[11px] font-semibold text-forest">
              Aktif &amp; Terverifikasi
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">
            Kapasitas daya tampung {items.reduce((a, i) => a + kapasitasOf(i.rombel), 0)} siswa telah disesuaikan dengan Keputusan Kepala Dinas Pendidikan Kota Depok &amp; Data Pokok Pendidikan (Dapodik) SMK Citra Negara per 12 Januari 2026.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-wash px-4 text-[13px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
          >
            <RefreshCw size={15} />
            Perbarui Sinkronisasi
          </button>
          <a
            href="/files/sk-kuota.pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-wash px-4 text-[13px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
          >
            <Download size={15} />
            Unduh SK Kuota (PDF)
          </a>
        </div>
      </section>

      {/* Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold text-ink">
                  {editing.type === "bulk"
                    ? "Atur Daya Tampung"
                    : `Edit Jurusan ${PROGRAM_ADMIN[editing.kode].singkat}`}
                </h2>
                <p className="mt-1 text-[12.5px] text-ink/65">
                  1 rombongan belajar = {SISWA_PER_ROMBEL} siswa.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setEditing(null)}
                className="inline-flex size-9 items-center justify-center rounded-lg text-ink/60 hover:bg-wash"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {(editing.type === "bulk" ? items.map((i) => i.kode) : [editing.kode]).map(
                (kode) => {
                  const rombel = Number(form[kode]?.rombel);
                  const terisi = items.find((i) => i.kode === kode)?.terisi ?? 0;
                  return (
                    <div key={kode} className="rounded-xl bg-wash p-3.5">
                      <p className="text-[14px] font-semibold text-ink">
                        {PROGRAM_ADMIN[kode].singkat} — {PROGRAM_ADMIN[kode].nama}
                      </p>
                      <label className="mt-2 block text-[12px] font-medium text-ink/70">
                        Jumlah Rombongan Belajar
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={form[kode]?.rombel ?? ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              [kode]: { ...p[kode], rombel: e.target.value },
                            }))
                          }
                          className={`${field} w-24`}
                        />
                        <span className="text-[12.5px] text-ink/70">
                          = {Number.isFinite(rombel) ? kapasitasOf(rombel) : 0} siswa (terisi {terisi})
                        </span>
                      </div>

                      {editing.type === "single" && (
                        <>
                          <label className="mt-3 block text-[12px] font-medium text-ink/70">
                            Kepala Program
                          </label>
                          <input
                            value={form[kode]?.kepala ?? ""}
                            maxLength={100}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                [kode]: { ...p[kode], kepala: e.target.value },
                              }))
                            }
                            className={`${field} mt-1`}
                          />
                        </>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {error && (
              <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex h-10 items-center rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-10 items-center rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}