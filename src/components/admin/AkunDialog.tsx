"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Eye, EyeOff, RefreshCw, TriangleAlert } from "lucide-react";
import CopyButton from "@/components/dashboard/CopyButton";
import Modal, { inputCls } from "./Modal";
import { acakSandi, akunCall } from "./akun-client";

export type AkunTarget = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  whatsapp: string;
  role: "calon_siswa" | "kepsek";
  status: "aktif" | "nonaktif";
};

export type AkunAction = "tambah" | "edit" | "reset" | "status" | "hapus";

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [lihat, setLihat] = useState(true);
  return (
    <div>
      <label htmlFor="akun-sandi" className="block text-[12.5px] font-semibold text-ink">
        Kata Sandi
      </label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <input
            id="akun-sandi"
            type={lihat ? "text" : "password"}
            value={value}
            maxLength={72}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} pr-10 font-mono`}
          />
          <button
            type="button"
            aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            onClick={() => setLihat((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/55 hover:text-ink"
          >
            {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange(acakSandi())}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-wash px-3.5 text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
        >
          <RefreshCw size={14} />
          Acak
        </button>
      </div>
      <p className="mt-1 text-[11.5px] text-ink/60">
        Minimal 8 karakter. Tombol Acak membuat sandi sementara yang kuat.
      </p>
    </div>
  );
}

export default function AkunDialog({
  action,
  target,
  onClose,
  onDone,
}: {
  action: AkunAction;
  target?: AkunTarget;
  onClose: () => void;
  onDone?: (message: string) => void;
}) {
  const router = useRouter();
  const [nama, setNama] = useState(target?.nama ?? "");
  const [email, setEmail] = useState(target?.email ?? "");
  const [nik, setNik] = useState(target?.nik ?? "");
  const [wa, setWa] = useState(target?.whatsapp ?? "");
  const [sandi, setSandi] = useState(() => (action === "reset" || action === "tambah" ? acakSandi() : ""));
  const [konfirmasi, setKonfirmasi] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState<{ judul: string; email: string; sandi: string } | null>(null);

  const siswa = target?.role === "calon_siswa";
  const aktif = target?.status === "aktif";

  const tutup = () => {
    if (busy) return;
    if (hasil) onDone?.(hasil.judul);
    onClose();
  };

  const jalankan = async () => {
    setError("");
    setBusy(true);
    try {
      let r: { ok: boolean; message: string };
      if (action === "tambah") r = await akunCall("POST", { nama, email, password: sandi });
      else if (action === "edit") r = await akunCall("PUT", { id: target!.id, nama, email, nik, whatsapp: wa });
      else if (action === "reset") r = await akunCall("PATCH", { id: target!.id, action: "reset", password: sandi });
      else if (action === "status")
        r = await akunCall("PATCH", { id: target!.id, action: "status", status: aktif ? "nonaktif" : "aktif" });
      else r = await akunCall("DELETE", undefined, `?id=${target!.id}`);

      if (!r.ok) return setError(r.message);

      router.refresh();
      if (action === "tambah" || action === "reset") {
        setHasil({
          judul: r.message,
          email: action === "tambah" ? email.trim().toLowerCase() : target!.email,
          sandi,
        });
        return;
      }
      onDone?.(r.message);
      onClose();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const judul: Record<AkunAction, string> = {
    tambah: "Tambah Akun Kepala Sekolah",
    edit: "Ubah Data Akun",
    reset: "Reset Kata Sandi",
    status: aktif ? "Nonaktifkan Akun" : "Aktifkan Kembali Akun",
    hapus: "Hapus Akun Permanen",
  };
  const sub: Record<AkunAction, string> = {
    tambah: "Akun langsung aktif dan login lewat Login Staff (tab Kepsek).",
    edit: target?.nama ?? "",
    reset: target ? `${target.nama} • ${target.email}` : "",
    status: target?.nama ?? "",
    hapus: target?.nama ?? "",
  };

  /* ===== Tampilan hasil (tambah / reset) ===== */
  if (hasil) {
    return (
      <Modal title="Kata Sandi Siap Dibagikan" subtitle={sub[action]} onClose={tutup}>
        <p className="flex items-start gap-2 rounded-lg bg-[#e8f4ec] px-3 py-2.5 text-[13px] text-forest">
          <CircleCheck size={17} className="mt-0.5 shrink-0" />
          {hasil.judul}
        </p>
        <dl className="mt-4 divide-y divide-line rounded-lg bg-wash px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink/55">Email Login</dt>
              <dd className="mt-0.5 break-all text-[14px] font-semibold text-ink">{hasil.email}</dd>
            </div>
            <CopyButton value={hasil.email} />
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink/55">Kata Sandi</dt>
              <dd className="mt-0.5 break-all font-mono text-[16px] font-bold text-forest">{hasil.sandi}</dd>
            </div>
            <CopyButton value={hasil.sandi} />
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1b8] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#8a5a00]">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          Sampaikan langsung kepada pemilik akun. Kata sandi ini tidak akan ditampilkan lagi setelah jendela ini ditutup.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={tutup} className="h-10 rounded-md bg-forest px-6 text-[14px] font-semibold text-white hover:bg-brand-800">
            Selesai
          </button>
        </div>
      </Modal>
    );
  }

  const tombol: Record<AkunAction, { label: string; busy: string; cls: string }> = {
    tambah: { label: "Buat Akun", busy: "Membuat...", cls: "bg-forest hover:bg-brand-800" },
    edit: { label: "Simpan Perubahan", busy: "Menyimpan...", cls: "bg-forest hover:bg-brand-800" },
    reset: { label: "Reset Kata Sandi", busy: "Memproses...", cls: "bg-forest hover:bg-brand-800" },
    status: aktif
      ? { label: "Ya, Nonaktifkan", busy: "Memproses...", cls: "bg-[#c00000] hover:opacity-90" }
      : { label: "Ya, Aktifkan", busy: "Memproses...", cls: "bg-forest hover:bg-brand-800" },
    hapus: { label: "Hapus Permanen", busy: "Menghapus...", cls: "bg-[#c00000] hover:opacity-90" },
  };

  const hapusSiap = action !== "hapus" || konfirmasi.trim() === "HAPUS";

  return (
    <Modal title={judul[action]} subtitle={sub[action]} onClose={tutup}>
      {(action === "tambah" || action === "edit") && (
        <div className="space-y-4">
          <label className="block text-[12.5px] font-semibold text-ink">
            Nama Lengkap
            <input value={nama} maxLength={100} onChange={(e) => setNama(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block text-[12.5px] font-semibold text-ink">
            Email Login
            <input type="email" value={email} maxLength={150} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          {action === "edit" && siswa && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-semibold text-ink">
                NIK (16 Digit)
                <input
                  inputMode="numeric"
                  value={nik}
                  maxLength={16}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-ink">
                Nomor WhatsApp
                <input
                  inputMode="numeric"
                  value={wa}
                  maxLength={14}
                  onChange={(e) => setWa(e.target.value.replace(/\D/g, ""))}
                  className={`${inputCls} mt-1`}
                />
              </label>
            </div>
          )}
          {action === "tambah" && <PasswordField value={sandi} onChange={setSandi} />}
        </div>
      )}

      {action === "reset" && (
        <div className="space-y-4">
          <p className="rounded-lg bg-wash px-3.5 py-3 text-[13px] leading-relaxed text-ink/80">
            Sandi lama langsung tidak berlaku. Setelah disimpan, sampaikan sandi baru kepada pemilik akun.
          </p>
          <PasswordField value={sandi} onChange={setSandi} />
        </div>
      )}

      {action === "status" && (
        <div className="space-y-3 text-[13.5px] leading-relaxed text-ink/85">
          {aktif ? (
            <>
              <p className="rounded-lg bg-wash px-3.5 py-3">
                <b>{target?.nama}</b> tidak akan bisa login, dan sesi yang sedang berjalan langsung berakhir.
              </p>
              <p className="rounded-lg bg-wash px-3.5 py-3">
                Seluruh data tetap tersimpan. Akun bisa diaktifkan kembali kapan saja.
              </p>
            </>
          ) : (
            <p className="rounded-lg bg-wash px-3.5 py-3">
              <b>{target?.nama}</b> akan dapat login kembali dengan email dan kata sandi yang sama.
            </p>
          )}
        </div>
      )}

      {action === "hapus" && (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-[#c00000]">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {siswa
              ? "Akun, biodata, pilihan program, berkas, bukti pembayaran, dan nilai ujian siswa ini dihapus permanen dan tidak bisa dikembalikan."
              : "Akun ini dihapus permanen, tidak bisa login lagi, dan tidak bisa dikembalikan."}
          </p>
          <p className="text-[12.5px] text-ink/70">Jika hanya ingin menutup akses, gunakan Nonaktifkan.</p>
          <label className="block text-[12.5px] font-semibold text-ink">
            Ketik <span className="font-mono text-[#c00000]">HAPUS</span> untuk melanjutkan
            <input value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} className={`${inputCls} mt-1 font-mono`} placeholder="HAPUS" />
          </label>
        </div>
      )}

      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">{error}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={tutup} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">
          Batal
        </button>
        <button
          type="button"
          disabled={busy || !hapusSiap}
          onClick={jalankan}
          className={`h-10 rounded-md px-5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${tombol[action].cls}`}
        >
          {busy ? tombol[action].busy : tombol[action].label}
        </button>
      </div>
    </Modal>
  );
}