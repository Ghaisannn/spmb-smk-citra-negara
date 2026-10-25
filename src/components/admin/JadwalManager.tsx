"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
  Eye,
  Laptop,
  MonitorCheck,
  Pencil,
  Play,
  Plus,
  Printer,
  Save,
  Square,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";
import CbtMonitor from "./CbtMonitor";
import { cbtCall } from "./cbt-client";
import { Field, SelectBox, TextBox } from "@/components/dashboard/FormParts";
import { hariTanggal } from "@/lib/admin-config";
import type { JadwalRow, StatusJadwal } from "@/lib/jadwal-admin";

type Tab = "semua" | "hariini" | "akan" | "selesai";
type Form = {
  nama: string;
  gelombang: string;
  tanggal: string;
  mulai: string;
  selesai: string;
  kuota: string;
  durasi: string;
  jumlahSoal: string;
  pengawas: string;
};

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

const ST: Record<StatusJadwal, { t: string; c: string; d: string }> = {
  selesai: { t: "Selesai Dilaksanakan", c: "bg-pastel text-ink/70", d: "bg-ink/40" },
  berlangsung: { t: "Sedang Berlangsung", c: "bg-chip text-forest", d: "bg-forest animate-pulse" },
  siap: { t: "Siap Dilaksanakan", c: "bg-chip text-forest", d: "bg-forest" },
  terjadwal: { t: "Terjadwal", c: "bg-pastel text-ink/65", d: "bg-ink/40" },
};

function Stat({
  label,
  icon,
  value,
  unit,
  caption,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  value: string | number;
  unit?: string;
  caption: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`${card} border-b-[3px] p-5 ${accent ? "border-forest" : "border-chip"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink/65">{label}</p>
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">{icon}</span>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none text-ink">
        {value} {unit && <span className="text-[18px]">{unit}</span>}
      </p>
      <p className="mt-2 text-[12px] text-ink/65">{caption}</p>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-wash px-3.5 py-3">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink/55">{label}</p>
      <div className="mt-1 text-[13.5px] leading-snug text-ink">{children}</div>
    </div>
  );
}

export default function JadwalManager({
  rows,
  peserta,
  hariIni,
}: {
  rows: JadwalRow[];
  peserta: number;
  hariIni: string;
}) {
  const router = useRouter();
  const blank: Form = {
    nama: "",
    gelombang: "1",
    tanggal: hariIni,
    mulai: "08:00",
    selesai: "10:00",
    kuota: "",
    durasi: "120",
    jumlahSoal: "50",
    pengawas: "",
  };

  const [tab, setTab] = useState<Tab>("semua");
  const [gel, setGel] = useState("semua");
  const [form, setForm] = useState<Form>(blank);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [mon, setMon] = useState<{ id: number; nama: string } | null>(null);

  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toForm = () =>
    document.getElementById("form-jadwal")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const startEdit = (r: JadwalRow) => {
    setEditId(r.id);
    setForm({
      nama: r.nama,
      gelombang: String(r.gelombang),
      tanggal: r.tanggal,
      mulai: r.mulai,
      selesai: r.selesai,
      kuota: String(r.kuota),
      durasi: String(r.durasi),
      jumlahSoal: String(r.jumlahSoal),
      pengawas: r.pengawas,
    });
    setError("");
    toForm();
  };

  const reset = () => {
    setEditId(null);
    setForm(blank);
    setError("");
  };

  const save = async () => {
    setError("");
    setNotice(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jadwal", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          ...form,
          gelombang: Number(form.gelombang),
          kuota: Number(form.kuota),
          durasi: Number(form.durasi),
          jumlahSoal: Number(form.jumlahSoal),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal menyimpan jadwal.");
      setNotice({ ok: true, text: json.message });
      reset();
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: JadwalRow) => {
    if (!window.confirm(`Hapus jadwal "${r.nama}"?`)) return;
    const res = await fetch(`/api/admin/jadwal?id=${r.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice({ ok: res.ok, text: json.message || "Gagal menghapus jadwal." });
    if (res.ok) {
      if (editId === r.id) reset();
      router.refresh();
    }
  };

  const toggleCbt = async (r: JadwalRow) => {
    const tutup = r.cbtStatus === "dibuka";
    if (tutup && !window.confirm("Tutup sesi CBT? Peserta yang masih mengerjakan akan otomatis dikumpulkan.")) return;
    setBusyId(r.id);
    setNotice(null);
    try {
      const x = await cbtCall({ action: tutup ? "tutup" : "buka", sesiId: r.id });
      setNotice({ ok: x.ok, text: x.message });
      if (x.ok) router.refresh();
    } catch {
      setNotice({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusyId(null);
    }
  };

  // Statistik
  const gels = [...new Set(rows.map((r) => r.gelombang))].sort();
  const alokasi = rows.filter((r) => r.gelombang === 1).reduce((a, r) => a + r.kuota, 0);
  const pct = alokasi > 0 ? Math.min(100, Math.round((peserta / alokasi) * 100)) : 0;
  const live = rows.find((r) => r.cbtStatus === "dibuka");
  const next = rows.find((r) => r.cbtStatus === "tertutup");
  const cur = live ?? next ?? rows[rows.length - 1];
  const statusText = live
    ? "CBT Sedang Dibuka"
    : next
      ? "Menunggu Dibuka Panitia"
      : rows.length
        ? "Seluruh Sesi CBT Selesai"
        : "Belum Ada Jadwal CBT";

  const visible = rows.filter(
    (r) =>
      (gel === "semua" || String(r.gelombang) === gel) &&
      (tab === "semua" ||
        (tab === "hariini" && (r.hariIni || r.status === "berlangsung")) ||
        (tab === "akan" && (r.status === "siap" || r.status === "terjadwal")) ||
        (tab === "selesai" && r.status === "selesai"))
  );
  const n = {
    semua: rows.length,
    hariini: rows.filter((r) => r.hariIni || r.status === "berlangsung").length,
    akan: rows.filter((r) => r.status === "siap" || r.status === "terjadwal").length,
    selesai: rows.filter((r) => r.status === "selesai").length,
  };
  const tabs: [Tab, string][] = [
    ["semua", "Semua Jadwal"],
    ["hariini", "Berlangsung Hari Ini"],
    ["akan", "Akan Datang"],
    ["selesai", "Selesai"],
  ];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Agenda Seleksi &amp; Ujian CBT
          </span>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Jadwal Tes</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">
            Atur jadwal Tes Potensi Akademik &amp; Minat Bakat yang dikerjakan secara online oleh pendaftar gelombang 1 &amp; 2, lewat laptop/PC maupun handphone.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash">
            <Printer size={16} />
            Unduh Daftar Hadir (PDF)
          </button>
          <a href="#form-jadwal" className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800">
            <Plus size={17} />
            Tambah Jadwal Tes
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sesi Terjadwal" icon={<CalendarDays size={20} />} value={rows.length} unit="Sesi" caption={gels.length ? gels.map((g) => `Gelombang ${g}`).join(" & ") : "Belum ada jadwal"} />
        <Stat
          label="Peserta Terdaftar"
          icon={<Users size={20} />}
          value={peserta}
          unit="Siswa"
          accent
          caption={<span className="inline-flex items-center gap-1 font-medium text-forest"><TrendingUp size={13} />{pct}% dari alokasi tahap 1</span>}
        />
        <Stat label="Mode Pelaksanaan" icon={<MonitorCheck size={20} />} value="Online" caption="Laptop / PC & Handphone peserta" />
        <Stat
          label="Status Pelaksanaan"
          icon={<ArrowLeftRight size={20} />}
          value={cur ? `Gelombang ${cur.gelombang}` : "-"}
          caption={<span className="inline-flex items-center gap-1.5 font-medium text-forest"><span className={`size-1.5 rounded-full bg-forest ${live ? "animate-pulse" : ""}`} />{statusText}</span>}
        />
      </div>

      {notice && (
        <p className={`mt-5 rounded-lg px-4 py-2.5 text-[13px] ${notice.ok ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"}`}>
          {notice.text}
        </p>
      )}

      {/* Daftar jadwal */}
      <div className={`${card} mt-6 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-wash p-1">
            {tabs.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-md px-3.5 py-2 text-[13px] font-medium transition ${tab === k ? "bg-white text-forest shadow-sm" : "text-ink/75 hover:text-ink"}`}
              >
                {label} <span className="text-ink/55">({n[k]})</span>
              </button>
            ))}
          </div>
          <select value={gel} onChange={(e) => setGel(e.target.value)} className="h-10 rounded-lg bg-wash px-3 text-[13px] font-medium text-ink outline-none">
            <option value="semua">Semua Gelombang</option>
            <option value="1">Gelombang 1 (Reguler)</option>
            <option value="2">Gelombang 2 (Reguler)</option>
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {visible.length === 0 && (
            <p className="rounded-lg bg-wash py-12 text-center text-[14px] text-ink/60">Tidak ada jadwal pada tampilan ini.</p>
          )}

          {visible.map((r) => {
            const st = ST[r.status];
            const p = r.kuota > 0 ? Math.round((r.terisi / r.kuota) * 100) : 0;
            return (
              <article
                key={r.id}
                className={`rounded-xl border p-4 transition ${r.status === "berlangsung" ? "border-forest/40 bg-[#f1f9f4]" : "border-line bg-white"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
                      <Laptop size={19} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-medium leading-snug text-ink">{r.nama}</h3>
                      <p className="mt-0.5 text-[11.5px] text-ink/60">
                        JDW-{String(r.id).padStart(3, "0")} • {r.jumlahSoal} soal • {r.durasi} menit • Online
                        {r.pengawas ? ` • ${r.pengawas}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${st.c}`}>
                    <span className={`size-1.5 shrink-0 rounded-full ${st.d}`} />
                    {st.t}
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <Cell label="Tanggal & Waktu">
                    <p className="font-medium">{hariTanggal(r.tanggal)}</p>
                    <p className="text-ink/65">{r.mulai.replace(":", ".")} - {r.selesai.replace(":", ".")} WIB</p>
                  </Cell>
                  <Cell label="Gelombang / Sesi">
                    <p className="font-semibold text-forest">Gelombang {r.gelombang}</p>
                    <p className="text-ink/65">{r.sesi}</p>
                  </Cell>
                  <Cell label="Platform Pelaksanaan">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Wifi size={13} className="shrink-0 text-forest" />
                      Online (Portal SPMB)
                    </p>
                    <p className="text-ink/65">Dikerjakan dari Laptop / PC &amp; Handphone</p>
                  </Cell>
                  <Cell label="Peserta CBT">
                    <p className="flex items-center justify-between font-medium">
                      {r.terisi} / {r.kuota} Siswa
                      <span className={p >= 100 ? "text-[#c00000]" : "text-ink/65"}>{p >= 100 ? "Penuh" : `${p}%`}</span>
                    </p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white">
                      <div className={`h-1.5 rounded-full ${p >= 100 ? "bg-[#c00000]" : "bg-forest"}`} style={{ width: `${Math.min(p, 100)}%` }} />
                    </div>
                  </Cell>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 print:hidden">
                  <p className="text-[12px] text-ink/65">{r.nJalan} sedang mengerjakan • {r.nSelesai} selesai</p>
                  <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                    <button type="button" onClick={() => setMon({ id: r.id, nama: r.nama })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-wash px-3 text-forest hover:bg-[#d9f0e0]">
                      <Eye size={14} />
                      Monitoring
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => toggleCbt(r)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-white transition disabled:opacity-60 ${r.cbtStatus === "dibuka" ? "bg-[#c00000] hover:opacity-90" : "bg-forest hover:bg-brand-800"}`}
                    >
                      {r.cbtStatus === "dibuka" ? <Square size={13} /> : <Play size={13} />}
                      {busyId === r.id ? "Memproses..." : r.cbtStatus === "dibuka" ? "Tutup CBT" : r.cbtStatus === "ditutup" ? "Buka Kembali" : "Buka CBT"}
                    </button>
                    {r.status === "selesai" && (
                      <Link href="/dashboard/admin/hasil" className="inline-flex h-9 items-center rounded-md bg-wash px-3 text-forest hover:bg-[#d9f0e0]">
                        Lihat Nilai
                      </Link>
                    )}
                    <button type="button" onClick={() => startEdit(r)} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-ink hover:bg-wash">
                      <Pencil size={13} />
                      Edit
                    </button>
                    {r.cbtStatus !== "dibuka" && (
                      <button type="button" onClick={() => remove(r)} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[#c00000] hover:bg-red-50">
                        <Trash2 size={13} />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-wash px-4 py-3 text-[11.5px] text-ink/70">
          <span>
            Menampilkan <b className="text-ink">{visible.length}</b> dari <b className="text-ink">{rows.length}</b> jadwal seleksi aktif SPMB Citra Negara 2026/2027
          </span>
          <span className="font-semibold uppercase tracking-wide">Ujian Online SPMB</span>
        </div>
      </div>

      {/* Form */}
      <div id="form-jadwal" className={`${card} mt-8 scroll-mt-24 p-5 sm:p-7 print:hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-chip text-forest">
              <CalendarDays size={20} />
            </span>
            <div>
              <h2 className="text-[22px] font-medium leading-tight text-ink">
                {editId ? "Form Edit Jadwal Seleksi" : "Form Tambah Jadwal Seleksi Baru"}
              </h2>
              <p className="text-[12.5px] text-ink/65">Buat sesi Tes Potensi Akademik &amp; Minat Bakat yang dikerjakan secara online.</p>
            </div>
          </div>
          <span className="rounded-md bg-chip px-2.5 py-1 text-[11.5px] font-semibold text-forest">
            {editId ? "Mode Edit" : "Mode Panitia"}
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-4">
          <Field label="Nama Tes / Kegiatan Seleksi" required htmlFor="j-nama" className="md:col-span-3">
            <TextBox id="j-nama" value={form.nama} maxLength={150} onChange={(e) => set("nama", e.target.value)} placeholder="Contoh: Tes Potensi Akademik & Minat Bakat (Sesi 3)" />
          </Field>
          <Field label="Gelombang Pendaftaran" required htmlFor="j-gel">
            <SelectBox id="j-gel" value={form.gelombang} onChange={(e) => set("gelombang", e.target.value)}>
              <option value="1">Gelombang 1 (Reguler)</option>
              <option value="2">Gelombang 2 (Reguler)</option>
            </SelectBox>
          </Field>

          <Field label="Tanggal Pelaksanaan" required htmlFor="j-tgl">
            <TextBox id="j-tgl" type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} />
          </Field>
          <Field label="Waktu Mulai" required htmlFor="j-mulai">
            <TextBox id="j-mulai" type="time" value={form.mulai} onChange={(e) => set("mulai", e.target.value)} />
          </Field>
          <Field label="Selesai" required htmlFor="j-selesai">
            <TextBox id="j-selesai" type="time" value={form.selesai} onChange={(e) => set("selesai", e.target.value)} />
          </Field>
          <Field label="Kuota Peserta per Sesi" required htmlFor="j-kuota">
            <TextBox id="j-kuota" inputMode="numeric" value={form.kuota} onChange={(e) => set("kuota", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Contoh: 80" right={<span className="text-[12px]">Siswa</span>} />
          </Field>

          <Field label="Durasi Ujian" required htmlFor="j-durasi" help="Timer siswa mulai saat menekan Mulai Tes.">
            <TextBox id="j-durasi" inputMode="numeric" value={form.durasi} onChange={(e) => set("durasi", e.target.value.replace(/\D/g, "").slice(0, 3))} right={<span className="text-[12px]">Menit</span>} />
          </Field>
          <Field label="Jumlah Soal" required htmlFor="j-soal" help="Diambil acak dari Bank Soal aktif.">
            <TextBox id="j-soal" inputMode="numeric" value={form.jumlahSoal} onChange={(e) => set("jumlahSoal", e.target.value.replace(/\D/g, "").slice(0, 3))} right={<span className="text-[12px]">Butir</span>} />
          </Field>
          <Field label="Proktor Ujian Daring (Opsional)" htmlFor="j-pengawas" className="md:col-span-2">
            <TextBox id="j-pengawas" value={form.pengawas} maxLength={255} onChange={(e) => set("pengawas", e.target.value)} placeholder="Nama koordinator proktor / guru pengawas (pisahkan koma)" />
          </Field>
        </div>

        {error && <p className="mt-5 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-md bg-wash px-6 text-[14px] font-semibold text-ink transition hover:bg-[#d9f0e0]">
            Batal
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:opacity-60">
            <Save size={16} />
            {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Simpan Jadwal"}
          </button>
        </div>
      </div>

      {mon && <CbtMonitor sesi={mon} onClose={() => setMon(null)} />}
    </section>
  );
}