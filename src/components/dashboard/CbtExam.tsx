"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Clock, Send, TriangleAlert } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { HURUF, formatSisa } from "@/lib/cbt-config";

type Soal = { id: number; topik: string; teks: string; opsi: string[]; jawaban: string | null };

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export default function CbtExam({
  judul,
  soal,
  sisaDetik,
}: {
  judul: string;
  soal: Soal[];
  sisaDetik: number;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(soal.map((s) => [s.id, s.jawaban]))
  );
  const [ragu, setRagu] = useState<Set<number>>(new Set());
  const [sisa, setSisa] = useState(sisaDetik);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [sendErr, setSendErr] = useState("");

  const deadline = useRef(Date.now() + sisaDetik * 1000);
  const done = useRef(false);
  const ansRef = useRef(ans);
  ansRef.current = ans;

  const total = soal.length;
  const terjawab = soal.filter((s) => ans[s.id]).length;
  const cur = soal[idx];

  const submit = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    setBusy(true);
    setSendErr("");
    try {
      const kirim = Object.fromEntries(Object.entries(ansRef.current).filter(([, v]) => v));
      const res = await fetch("/api/cbt/selesai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawaban: kirim }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Gagal mengirim jawaban.");
      }
      router.push("/dashboard/calon-siswa/jadwal");
      router.refresh();
    } catch (e) {
      done.current = false;
      setBusy(false);
      setConfirm(false);
      setSendErr(e instanceof Error ? e.message : "Gagal mengirim jawaban. Tekan Kirim Jawaban untuk mencoba lagi.");
    }
  }, [router]);

  // Timer berbasis waktu sebenarnya (tidak melenceng saat tab tidak aktif).
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setSisa(s);
      if (s <= 0) {
        clearInterval(t);
        submit();
      }
    }, 500);
    return () => clearInterval(t);
  }, [submit]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!done.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const pilih = async (soalId: number, h: string) => {
    const next = ans[soalId] === h ? null : h;
    setAns((p) => ({ ...p, [soalId]: next }));
    try {
      const res = await fetch("/api/cbt/jawab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soalId, jawaban: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveErr(j.message || "Jawaban belum tersimpan di server.");
      } else setSaveErr("");
    } catch {
      setSaveErr("Koneksi terputus. Jawaban akan dikirim ulang saat Anda menekan Kirim Jawaban.");
    }
  };

  const toggleRagu = (id: number) =>
    setRagu((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const kosong = total - terjawab;
  const kritis = sisa <= 300;

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5`}>
        <div className="min-w-0">
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-forest">Ujian CBT Sedang Berlangsung</p>
          <h1 className="mt-0.5 text-[19px] font-semibold leading-snug text-ink sm:text-[22px]">{judul}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-wash px-3 py-2 text-[12.5px] text-ink/80">
            Terjawab <b className="text-forest">{terjawab}</b> / {total}
          </span>
          <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[20px] font-bold ${kritis ? "bg-red-100 text-[#c00000]" : "bg-chip text-forest"}`}>
            <Clock size={18} />
            {formatSisa(sisa)}
          </span>
        </div>
      </div>

      {(saveErr || sendErr) && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-[#c00000]">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          {sendErr || saveErr}
        </p>
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Soal */}
        <section className={`${card} p-5 sm:p-7`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-forest">
              Soal {idx + 1} dari {total}
              <span className="ml-2 font-normal text-ink/55">• {cur.topik}</span>
            </p>
            <button
              type="button"
              onClick={() => toggleRagu(cur.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition ${ragu.has(cur.id) ? "bg-[#fff1b8] text-[#8a5a00]" : "bg-wash text-ink/75 hover:bg-[#d9f0e0]"}`}
            >
              <Bookmark size={14} />
              {ragu.has(cur.id) ? "Ditandai Ragu-ragu" : "Tandai Ragu-ragu"}
            </button>
          </div>

          <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-ink">{cur.teks}</p>

          <div className="mt-5 space-y-2.5">
            {cur.opsi.map((o, i) => {
              const h = HURUF[i];
              const dipilih = ans[cur.id] === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => pilih(cur.id, h)}
                  aria-pressed={dipilih}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-[15px] transition ${dipilih ? "border-forest bg-[#e3f5ea] font-medium text-ink" : "border-transparent bg-wash text-ink/90 hover:border-[#b9d9c4]"}`}
                >
                  <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${dipilih ? "bg-forest text-white" : "bg-white text-ink/70"}`}>
                    {h}
                  </span>
                  {o}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] text-ink/55">Klik pilihan yang sama sekali lagi untuk membatalkan jawaban.</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => setIdx((i) => i - 1)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Sebelumnya
            </button>
            {idx < total - 1 ? (
              <button type="button" onClick={() => setIdx((i) => i + 1)} className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800">
                Selanjutnya
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800">
                <Send size={15} />
                Kirim Jawaban
              </button>
            )}
          </div>
        </section>

        {/* Navigator */}
        <aside className={`${card} p-5 lg:sticky lg:top-[90px]`}>
          <h2 className="text-[16px] font-semibold text-ink">Navigasi Soal</h2>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5">
            {soal.map((s, i) => {
              const dijawab = Boolean(ans[s.id]);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Soal ${i + 1}`}
                  className={`relative inline-flex size-10 items-center justify-center rounded-lg text-[13px] font-semibold transition ${
                    dijawab ? "bg-forest text-white" : "bg-wash text-ink/75 hover:bg-[#d9f0e0]"
                  } ${i === idx ? "ring-2 ring-forest ring-offset-2" : ""}`}
                >
                  {i + 1}
                  {ragu.has(s.id) && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#f5b800]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-1.5 text-[11.5px] text-ink/70">
            <p className="flex items-center gap-2"><span className="size-3 rounded bg-forest" />Sudah dijawab</p>
            <p className="flex items-center gap-2"><span className="size-3 rounded bg-wash ring-1 ring-line" />Belum dijawab</p>
            <p className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#f5b800]" />Ragu-ragu</p>
          </div>

          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-forest text-[14px] font-semibold text-white transition hover:bg-brand-800"
          >
            <Send size={15} />
            Kirim Jawaban
          </button>
        </aside>
      </div>

      {confirm && (
        <Modal title="Kirim Jawaban?" subtitle="Setelah dikirim, ujian tidak dapat dibuka kembali." onClose={() => !busy && setConfirm(false)}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-wash p-3"><p className="text-[22px] font-semibold text-forest">{terjawab}</p><p className="text-[11px] text-ink/65">Terjawab</p></div>
            <div className="rounded-lg bg-wash p-3"><p className={`text-[22px] font-semibold ${kosong ? "text-[#c00000]" : "text-ink"}`}>{kosong}</p><p className="text-[11px] text-ink/65">Belum Dijawab</p></div>
            <div className="rounded-lg bg-wash p-3"><p className="text-[22px] font-semibold text-[#8a5a00]">{ragu.size}</p><p className="text-[11px] text-ink/65">Ragu-ragu</p></div>
          </div>
          {kosong > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1b8] px-3 py-2.5 text-[12.5px] text-[#8a5a00]">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" />
              Masih ada {kosong} soal yang belum dijawab. Sisa waktu Anda {formatSisa(sisa)}.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setConfirm(false)} className="h-10 rounded-md bg-wash px-5 text-[14px] font-semibold text-ink hover:bg-[#d9f0e0]">
              Periksa Lagi
            </button>
            <button type="button" disabled={busy} onClick={submit} className="h-10 rounded-md bg-forest px-5 text-[14px] font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {busy ? "Mengirim..." : "Ya, Kirim Jawaban"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}