"use client";

import { useState } from "react";
import { Ban, KeyRound, Pencil, Trash2, UserCheck } from "lucide-react";
import AkunDialog, { type AkunAction, type AkunTarget } from "./AkunDialog";
import { Avatar } from "@/components/kepsek/Ui";
import { initials, jam, tglPendek } from "@/lib/admin-format";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { PROGRAM_ADMIN } from "@/lib/program-admin";
import type { ProgramKode } from "@/lib/program-data";
import type { SiswaAkun } from "@/lib/akun";

const BAYAR = {
  belum_bayar: { t: "Belum Bayar", c: "bg-pastel text-ink/65" },
  menunggu_verifikasi: { t: "Pembayaran Diperiksa", c: "bg-[#fff1b8] text-[#8a5a00]" },
  lunas: { t: "Pembayaran Lunas", c: "bg-chip text-forest" },
  ditolak: { t: "Bukti Ditolak", c: "bg-red-100 text-[#c00000]" },
} as const;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-wash px-3.5 py-2.5">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink/55">{label}</p>
      <div className="mt-0.5 break-words text-[13px] leading-snug text-ink">{children}</div>
    </div>
  );
}

export default function SiswaManager({ rows }: { rows: SiswaAkun[] }) {
  const [dlg, setDlg] = useState<{ action: AkunAction; target: AkunTarget } | null>(null);
  const [notice, setNotice] = useState("");

  const buka = (action: AkunAction, r: SiswaAkun) => {
    setNotice("");
    setDlg({
      action,
      target: {
        id: r.id,
        nama: r.nama,
        email: r.email,
        nik: r.nik,
        whatsapp: r.whatsapp,
        role: "calon_siswa",
        status: r.status,
      },
    });
  };

  const btn = "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition";

  return (
    <>
      {notice && <p className="mb-4 rounded-lg bg-[#e8f4ec] px-4 py-2.5 text-[13px] text-forest">{notice}</p>}

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-lg bg-wash py-12 text-center text-[14px] text-ink/60">
            Tidak ada akun siswa yang cocok dengan pencarian.
          </p>
        )}

        {rows.map((r) => {
          const nonaktif = r.status === "nonaktif";
          const bayar = BAYAR[r.bayar];
          return (
            <article
              key={r.id}
              className={`rounded-xl border p-4 ${nonaktif ? "border-line bg-[#f7f9f8]" : "border-line bg-white"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <Avatar text={initials(r.nama)} bad={nonaktif} />
                  <div className="min-w-0">
                    <h3 className={`text-[16px] font-medium leading-snug ${nonaktif ? "text-ink/60" : "text-ink"}`}>{r.nama}</h3>
                    <p className="mt-0.5 text-[11.5px] text-ink/60">
                      {nomorRegistrasi(r.id)} • Terdaftar {tglPendek(r.createdAt)}
                      {r.program ? ` • ${PROGRAM_ADMIN[r.program as ProgramKode]?.singkat ?? r.program}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold ${nonaktif ? "bg-red-100 text-[#c00000]" : "bg-chip text-forest"}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {nonaktif ? "Dinonaktifkan" : "Aktif"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${
                      r.formulir === "terkirim"
                        ? "bg-chip text-forest"
                        : r.formulir === "draft"
                          ? "bg-[#fff1b8] text-[#8a5a00]"
                          : "bg-pastel text-ink/60"
                    }`}
                  >
                    {r.formulir === "terkirim"
                      ? "Formulir Terkirim"
                      : r.formulir === "draft"
                        ? `Mengisi Biodata (${r.langkah}/3)`
                        : "Belum Mengisi"}
                  </span>
                  {r.formulir === "terkirim" && (
                    <span className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${bayar.c}`}>{bayar.t}</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <Cell label="Email Login">{r.email}</Cell>
                <Cell label="NIK">
                  <span className="font-mono">{r.nik || "-"}</span>
                </Cell>
                <Cell label="WhatsApp">{r.whatsapp || "-"}</Cell>
                <Cell label="Terakhir Masuk">
                  {r.lastLogin ? `${tglPendek(r.lastLogin)}, ${jam(new Date(r.lastLogin))} WIB` : "Belum tercatat"}
                </Cell>
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
                  onClick={() => buka("status", r)}
                  className={`${btn} ${nonaktif ? "text-forest hover:bg-wash" : "text-[#8a5a00] hover:bg-[#fff8d9]"}`}
                >
                  {nonaktif ? <UserCheck size={14} /> : <Ban size={14} />}
                  {nonaktif ? "Aktifkan" : "Nonaktifkan"}
                </button>
                <button type="button" onClick={() => buka("hapus", r)} className={`${btn} text-[#c00000] hover:bg-red-50`}>
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
          key={`${dlg.action}-${dlg.target.id}`}
          action={dlg.action}
          target={dlg.target}
          onClose={() => setDlg(null)}
          onDone={setNotice}
        />
      )}
    </>
  );
}