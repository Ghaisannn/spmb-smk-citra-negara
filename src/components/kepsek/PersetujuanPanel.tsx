"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, FileText, Gavel, MessageSquareQuote, RotateCcw, Stamp, UserCheck } from "lucide-react";
import Modal, { inputCls } from "@/components/admin/Modal";
import { card } from "./Ui";
import { jam, tglPendek } from "@/lib/admin-format";

type Props = {
  status: "menunggu" | "disetujui" | "revisi";
  terbit: boolean;
  diajukanAt: string;
  diajukanOleh: string;
  jabatan: string;
  catatan: string;
  keputusanAt: string | null;
  catatanRevisi: string;
  kepsekNama: string;
  nip: string;
  diterima: number;
};

const waktu = (iso: string) => `${tglPendek(iso)}, ${jam(new Date(iso))} WIB`;

export default function PersetujuanPanel(p: Props) {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dlg, setDlg] = useState(false);
  const [alasan, setAlasan] = useState("");

  const send = async (action: "setuju" | "revisi") => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kepsek/persetujuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, catatan: alasan }),
      });
      const json = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: json.message || (res.ok ? "Berhasil." : "Gagal memproses.") });
      if (res.ok) {
        setDlg(false);
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setBusy(false);
    }
  };

  const open = p.status === "menunggu" && !p.terbit;

  return (
    <div className="space-y-4">
      <section className={`${card} overflow-hidden`}>
        <div className="flex items-start gap-3 bg-wash px-5 py-5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
            <Gavel size={20} />
          </span>
          <div>
            <h2 className="text-[19px] font-medium leading-snug text-ink">Lembar Berita Acara &amp; Pengesahan SK</h2>
            <p className="mt-0.5 text-[12px] font-semibold text-forest">Sidang Pleno SPMB T.A. 2026/2027</p>
          </div>
        </div>

        <div className="p-5">
          <dl className="space-y-2 text-[12.5px]">
            <div className="flex justify-between gap-4"><dt className="text-ink/65">Tanggal Pengajuan:</dt><dd className="text-right font-medium text-ink">{waktu(p.diajukanAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/65">Diajukan Oleh:</dt><dd className="text-right font-medium text-ink">{p.diajukanOleh}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/65">Jabatan Pengusul:</dt><dd className="text-right font-semibold text-forest">{p.jabatan}</dd></div>
          </dl>

          <div className="mt-4 rounded-lg bg-wash p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <MessageSquareQuote size={15} />
              Catatan Panitia SPMB
            </p>
            <p className="mt-2 text-[12.5px] italic leading-relaxed text-ink/75">“{p.catatan}”</p>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-lg bg-wash p-3.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
              <UserCheck size={19} />
            </span>
            <div className="leading-tight">
              <p className="text-[14.5px] font-medium text-ink">{p.kepsekNama}</p>
              <p className="mt-0.5 text-[11px] text-ink/65">NIP. {p.nip} • Kepala Sekolah</p>
            </div>
          </div>

          {p.status === "disetujui" && (
            <div className="mt-4 flex gap-3 rounded-lg bg-chip/60 p-4">
              <CircleCheck size={22} className="mt-0.5 shrink-0 text-forest" />
              <div>
                <p className="text-[14.5px] font-semibold text-forest">
                  {p.terbit ? "Hasil Seleksi Telah Dipublikasikan" : "Hasil Seleksi Telah Disahkan"}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/75">
                  {p.keputusanAt ? `Disahkan pada ${waktu(p.keputusanAt)}. ` : ""}
                  {p.terbit ? "Siswa sudah dapat melihat hasilnya." : "Lanjutkan ke menu Pengumuman untuk menerbitkan surat."}
                </p>
              </div>
            </div>
          )}

          {p.status === "revisi" && (
            <div className="mt-4 rounded-lg bg-red-50 p-4">
              <p className="text-[14px] font-semibold text-[#c00000]">Dikembalikan ke Panitia untuk Revisi</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink/80">{p.catatanRevisi}</p>
              <p className="mt-2 text-[11.5px] text-ink/60">Menunggu panitia mengajukan ulang usulan.</p>
            </div>
          )}

          {open && (
            <>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-wash p-3.5 text-[12.5px] leading-snug text-ink">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-forest" />
                Saya telah memeriksa dan menyetujui hasil rapat pleno penetapan kelulusan SPMB Gelombang 1 TA 2026/2027.
              </label>

              {msg && (
                <p className={`mt-3 rounded px-3 py-2 text-[12.5px] ${msg.ok ? "bg-[#e8f4ec] text-forest" : "bg-red-50 text-[#c00000]"}`}>{msg.text}</p>
              )}

              <button
                type="button"
                disabled={!agree || busy || p.diterima === 0}
                onClick={() => send("setuju")}
                className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-lg bg-forest px-4 text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition enabled:hover:bg-brand-800 disabled:bg-[#7fad94] disabled:shadow-none"
              >
                <CircleCheck size={20} />
                {busy ? "Memproses..." : "Setujui & Sahkan Hasil Seleksi"}
              </button>
              {p.diterima === 0 && (
                <p className="mt-2 text-center text-[11.5px] text-ink/60">Belum ada peserta berstatus Diterima.</p>
              )}

              <button
                type="button"
                onClick={() => { setAlasan(""); setMsg(null); setDlg(true); }}
                className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-[13px] font-semibold text-[#c00000] hover:underline"
              >
                <RotateCcw size={16} />
                Kembalikan ke Panitia untuk Revisi
              </button>
            </>
          )}

          <Link
            href="/dashboard/kepsek/pengumuman"
            className="mt-1 flex items-center justify-center gap-2 py-2 text-center text-[12.5px] font-semibold text-forest hover:underline"
          >
            <FileText size={15} />
            {p.status === "disetujui" && !p.terbit ? "Lanjut ke Pengumuman Final" : "Pratinjau Draf Surat Keputusan (SK) Kelulusan"}
            {p.status === "disetujui" && !p.terbit && <ArrowRight size={14} />}
          </Link>
        </div>
      </section>

      <section className={`${card} p-5`}>
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink">
          <Stamp size={14} />
          Prosedur Penerbitan SK:
        </p>
        <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink/75">
          <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-forest" />Pengesahan memicu pengiriman notifikasi kelulusan via WhatsApp API &amp; Email peserta.</li>
          <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-forest" />Siswa lolos diberikan waktu 5 hari kerja untuk proses Daftar Ulang.</li>
          <li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-forest" />Calon cadangan akan dihubungi otomatis jika kuota rombel belum terpenuhi.</li>
        </ul>
      </section>

      {dlg && (
        <Modal title="Kembalikan ke Panitia" subtitle="Tuliskan bagian yang perlu direvisi oleh panitia." onClose={() => setDlg(false)}>
          <textarea
            value={alasan}
            maxLength={255}
            rows={4}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Contoh: Mohon periksa kembali nilai wawancara peserta cadangan prioritas 1."
            className={`${inputCls} h-auto resize-none py-2.5`}
          />
          {msg && !msg.ok && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">{msg.text}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDlg(false)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">Batal</button>
            <button type="button" disabled={busy} onClick={() => send("revisi")} className="h-10 rounded-md bg-[#c00000] px-5 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Mengirim..." : "Kirim Permintaan Revisi"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}