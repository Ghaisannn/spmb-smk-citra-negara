"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import Modal from "./Modal";
import { cbtCall } from "./cbt-client";

type Peserta = {
  userId: number;
  nama: string;
  noReg: string;
  status: "berjalan" | "selesai";
  terjawab: number;
  total: number;
  nilai: number | null;
  mulai: string;
  selesai: string;
};

export default function CbtMonitor({
  sesi,
  onClose,
}: {
  sesi: { id: number; nama: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<Peserta[] | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/cbt?sesi=${sesi.id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(json.peserta);
        setErr("");
      } else setErr(json.message || "Gagal memuat data peserta.");
    } catch {
      setErr("Tidak dapat terhubung ke server.");
    }
  }, [sesi.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const reset = async (p: Peserta) => {
    if (!window.confirm(`Reset percobaan ${p.nama}? Jawaban dan nilai CBT peserta ini dihapus dan ia dapat mengerjakan ulang.`)) return;
    const r = await cbtCall({ action: "reset", userId: p.userId });
    if (!r.ok) return setErr(r.message);
    await load();
    router.refresh();
  };

  const list = data ?? [];
  const jalan = list.filter((p) => p.status === "berjalan").length;
  const selesai = list.filter((p) => p.status === "selesai");
  const rata = selesai.length
    ? selesai.reduce((a, p) => a + (p.nilai ?? 0), 0) / selesai.length
    : null;

  return (
    <Modal wide title="Monitoring CBT" subtitle={`${sesi.nama} • diperbarui otomatis tiap 10 detik`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Peserta", list.length],
          ["Mengerjakan", jalan],
          ["Selesai", selesai.length],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-lg bg-wash p-3">
            <p className="text-[22px] font-semibold text-ink">{v}</p>
            <p className="text-[11px] text-ink/65">{l}</p>
          </div>
        ))}
      </div>
      {rata !== null && (
        <p className="mt-3 text-[12.5px] text-ink/70">
          Rata-rata nilai CBT: <b className="text-forest">{rata.toFixed(2)}</b>
        </p>
      )}

      {err && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-[#c00000]">{err}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="bg-wash text-[10.5px] font-semibold uppercase tracking-wide text-ink/70">
              <th className="rounded-tl-lg px-3 py-2.5">Peserta</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">Terjawab</th>
              <th className="px-2 py-2.5">Nilai</th>
              <th className="rounded-tr-lg px-2 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data === null && (
              <tr><td colSpan={5} className="py-8 text-center text-ink/60">Memuat...</td></tr>
            )}
            {data !== null && list.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-ink/60">Belum ada peserta yang memulai ujian.</td></tr>
            )}
            {list.map((p) => (
              <tr key={p.userId} className="border-b border-line/70">
                <td className="px-3 py-3 leading-tight">
                  <p className="font-medium text-ink">{p.nama}</p>
                  <p className="text-[11px] text-ink/55">{p.noReg} • mulai {p.mulai}{p.selesai ? ` • selesai ${p.selesai}` : ""}</p>
                </td>
                <td className="px-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.status === "berjalan" ? "bg-[#fff1b8] text-[#8a5a00]" : "bg-chip text-forest"}`}>
                    {p.status === "berjalan" ? "Mengerjakan" : "Selesai"}
                  </span>
                </td>
                <td className="px-2 text-ink/80">{p.terjawab} / {p.total}</td>
                <td className="px-2 font-semibold text-forest">{p.nilai === null ? "–" : p.nilai.toFixed(2)}</td>
                <td className="px-2 text-right">
                  <button type="button" onClick={() => reset(p)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold text-[#c00000] hover:bg-red-50">
                    <RotateCcw size={13} />
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}