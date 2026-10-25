"use client";

import { useState } from "react";
import { Ban, Info, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import AkunDialog, { type AkunAction, type AkunTarget } from "./AkunDialog";
import { initials, jam, tglPendek } from "@/lib/admin-format";
import type { KepsekAkun } from "@/lib/akun";

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export default function KepsekManager({ rows, jumlahAktif }: { rows: KepsekAkun[]; jumlahAktif: number }) {
  const [dlg, setDlg] = useState<{ action: AkunAction; target?: AkunTarget } | null>(null);
  const [notice, setNotice] = useState("");

  const buka = (action: AkunAction, r?: KepsekAkun) => {
    setNotice("");
    setDlg({
      action,
      target: r
        ? { id: r.id, nama: r.nama, email: r.email, nik: "", whatsapp: "", role: "kepsek", status: r.status }
        : undefined,
    });
  };

  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex max-w-[600px] items-start gap-2 rounded-lg bg-wash px-4 py-3 text-[12.5px] leading-relaxed text-ink/80">
          <Info size={16} className="mt-0.5 shrink-0 text-forest" />
          Harus ada minimal satu akun Kepala Sekolah yang aktif. Akun yang pernah mengesahkan hasil seleksi tidak dapat dihapus, hanya dinonaktifkan.
        </p>
        <button
          type="button"
          onClick={() => buka("tambah")}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800"
        >
          <Plus size={17} />
          Tambah Akun Kepala Sekolah
        </button>
      </div>

      {notice && <p className="mt-4 rounded-lg bg-[#e8f4ec] px-4 py-2.5 text-[13px] text-forest">{notice}</p>}

      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <p className={`${card} py-12 text-center text-[14px] text-ink/60`}>Belum ada akun Kepala Sekolah.</p>
        )}

        {rows.map((r) => {
          const nonaktif = r.status === "nonaktif";
          const terakhir = r.status === "aktif" && jumlahAktif <= 1;
          return (
            <article key={r.id} className={`rounded-xl border p-4 ${nonaktif ? "border-line bg-[#f7f9f8]" : "border-line bg-white"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold ${nonaktif ? "bg-red-100 text-[#c00000]" : "bg-chip text-forest"}`}>
                    {initials(r.nama)}
                  </span>
                  <div className="min-w-0">
                    <h3 className={`text-[17px] font-medium leading-snug ${nonaktif ? "text-ink/60" : "text-ink"}`}>{r.nama}</h3>
                    <p className="mt-0.5 break-all text-[12.5px] text-ink/65">{r.email}</p>
                    <p className="mt-1 text-[11.5px] text-ink/55">
                      Dibuat {tglPendek(r.createdAt)} • Terakhir masuk{" "}
                      {r.lastLogin ? `${tglPendek(r.lastLogin)}, ${jam(new Date(r.lastLogin))} WIB` : "belum tercatat"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold ${nonaktif ? "bg-red-100 text-[#c00000]" : "bg-chip text-forest"}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {nonaktif ? "Dinonaktifkan" : "Aktif"}
                  </span>
                  {r.pernahMengesahkan && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-3 py-1 text-[11.5px] font-semibold text-ink/75">
                      <ShieldCheck size={13} />
                      Pernah Mengesahkan Hasil
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-line pt-3">
                <button type="button" onClick={() => buka("edit", r)} className={`${btn} text-ink hover:bg-wash`}>
                  <Pencil size={14} />
                  Ubah Data
                </button>
                <button type="button" onClick={() => buka("reset", r)} className={`${btn} text-forest hover:bg-wash`}>
                  <KeyRound size={14} />
                  Reset Sandi
                </button>
                <button
                  type="button"
                  disabled={terakhir}
                  title={terakhir ? "Harus ada minimal satu akun Kepala Sekolah yang aktif" : undefined}
                  onClick={() => buka("status", r)}
                  className={`${btn} ${nonaktif ? "text-forest hover:bg-wash" : "text-[#8a5a00] hover:bg-[#fff8d9]"}`}
                >
                  {nonaktif ? <UserCheck size={14} /> : <Ban size={14} />}
                  {nonaktif ? "Aktifkan" : "Nonaktifkan"}
                </button>
                <button
                  type="button"
                  disabled={terakhir || r.pernahMengesahkan}
                  title={
                    r.pernahMengesahkan
                      ? "Akun yang pernah mengesahkan hasil tidak dapat dihapus"
                      : terakhir
                        ? "Harus ada minimal satu akun Kepala Sekolah yang aktif"
                        : undefined
                  }
                  onClick={() => buka("hapus", r)}
                  className={`${btn} text-[#c00000] hover:bg-red-50`}
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {dlg && (
        <AkunDialog
          key={`${dlg.action}-${dlg.target?.id ?? "baru"}`}
          action={dlg.action}
          target={dlg.target}
          onClose={() => setDlg(null)}
          onDone={setNotice}
        />
      )}
    </>
  );
}