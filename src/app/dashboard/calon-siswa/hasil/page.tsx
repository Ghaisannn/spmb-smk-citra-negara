import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock,
  Contact,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Shirt,
  ShieldCheck,
} from "lucide-react";
import PrintLink from "@/components/dashboard/PrintLink";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { formatTanggal, nomorRegistrasi } from "@/lib/biodata-schema";
import { HELPDESK } from "@/lib/jadwal-config";
import { getProgramKode } from "@/lib/program";
import { getProgramInfo } from "@/lib/program-data";
import { getSeleksi, sisaHari } from "@/lib/seleksi";

export const metadata = { title: "Hasil Seleksi | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Cell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-wash px-4 py-3 ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink/70">{label}</p>
      <div className="mt-1 text-[16px] font-medium text-forest">{children}</div>
    </div>
  );
}

function Ring({ skor }: { skor: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, skor)) / 100;
  return (
    <div className="relative size-[82px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e3efe6" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#0b7a42"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[20px] font-bold text-forest">{skor}</span>
        <span className="mt-0.5 text-[7px] font-medium text-ink/70">SKOR AKHIR</span>
      </div>
    </div>
  );
}

export default async function HasilPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);
  if (!state || state.status !== "terkirim") redirect(`${base}/biodata`);

  const [seleksi, programKode] = await Promise.all([
    getSeleksi(session.id),
    getProgramKode(session.id),
  ]);
  const program = programKode ? getProgramInfo(programKode) : null;
  const noReg = nomorRegistrasi(session.id);
  const diterima = seleksi.hasil === "diterima";
  const sisa = seleksi.batasDaftarUlang ? sisaHari(seleksi.batasDaftarUlang) : null;

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-medium text-ink/80">
            <span className="size-1.5 rounded-full bg-forest" />
            Tahap 5 dari 5 : Hasil Akhir Seleksi Penerimaan
          </span>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Hasil Seleksi Penerimaan Murid Baru
          </h1>
          <p className="mt-1 text-[15px] text-ink/75">
            Pengumuman resmi kelulusan dan penetapan program keahlian Tahun Ajaran 2026/2027.
          </p>
        </div>
        {diterima && seleksi.noSk && (
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
            <ShieldCheck size={20} className="text-forest" />
            <span className="leading-tight">
              <span className="block text-[11.5px] text-ink/70">SK Keputusan</span>
              <span className="block text-[13.5px] font-bold text-ink">No. {seleksi.noSk}</span>
            </span>
          </div>
        )}
      </div>

      {/* BELUM DIUMUMKAN */}
      {seleksi.hasil === "belum" && (
        <section className={`${card} mt-6 p-8 text-center`}>
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-[#fff1b8] text-[#8a5a00]">
            <Clock size={26} />
          </span>
          <h2 className="mt-4 text-[24px] font-semibold text-ink">Hasil Seleksi Belum Diumumkan</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14.5px] leading-relaxed text-ink/75">
            Pengumuman hasil seleksi Gelombang 1 dijadwalkan pada 12 April 2026. Pantau terus halaman ini dan menu Pengumuman untuk informasi terbaru.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={`${base}/jadwal`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-wash px-5 text-[14px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
            >
              Lihat Jadwal &amp; Tes
            </Link>
            <Link
              href={`${base}/pengumuman`}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800"
            >
              Buka Pengumuman
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

            {/* TIDAK DITERIMA / CADANGAN */}
      {(seleksi.hasil === "tidak_diterima" || seleksi.hasil === "cadangan") && (
        <section className={`${card} mt-6 p-8`}>
          <h2 className="text-[24px] font-semibold text-ink">
            {seleksi.hasil === "cadangan"
              ? `Anda Masuk Daftar Cadangan, ${session.nama}`
              : `Mohon Maaf, ${session.nama}`}
          </h2>
          <p className="mt-2 max-w-[600px] text-[14.5px] leading-relaxed text-ink/75">
            {seleksi.hasil === "cadangan"
              ? "Berdasarkan hasil seleksi, Anda berada pada daftar cadangan. Panitia akan menghubungi Anda apabila terdapat kursi yang kosong. Pantau terus menu Pengumuman dan WhatsApp Anda."
              : "Berdasarkan hasil verifikasi administrasi dan tes pemetaan minat bakat, Anda belum dinyatakan lolos pada seleksi Gelombang 1. Silakan hubungi panitia SPMB untuk informasi lebih lanjut."}
          </p>
          <a
            href={HELPDESK.wa}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800"
          >
            <MessageSquare size={16} />
            Hubungi Panitia {HELPDESK.telp}
          </a>
        </section>
      )}

      {/* DITERIMA */}
      {diterima && (
        <>
          <section className={`${card} mt-6 p-6 sm:p-8`}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-[12px] font-semibold text-white">
              <CircleCheck size={14} />
              SELAMAT! ANDA DINYATAKAN DITERIMA
            </span>
            <h2 className="mt-4 max-w-[640px] text-[28px] font-semibold leading-tight text-forest sm:text-[32px]">
              Selamat, {session.nama} telah lolos seleksi penerimaan di SMK Citra Negara!
            </h2>
            <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-ink/80">
              Berdasarkan hasil verifikasi administrasi dan tes pemetaan minat bakat, Anda diterima pada program keahlian pilihan pertama. Seluruh berkas pendaftaran Anda telah tervalidasi secara sah oleh Dewan Penguji SPMB 2026.
            </p>
          </section>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <section className={`${card} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-[18px] font-medium text-ink">
                  <Contact size={18} className="text-forest" />
                  Rincian Keputusan Penerimaan
                </h3>
                <span className="text-[11.5px] text-ink/70">Status: Tetap / Sah</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Cell label="Nomor Registrasi">{noReg}</Cell>
                <Cell label="Nama Lengkap Siswa">{session.nama}</Cell>
                <Cell label="Asal Sekolah">{state.data.nama_sekolah}</Cell>
                <Cell label="Jalur Pendaftaran">Reguler Gelombang 1</Cell>
                <Cell label="Program Keahlian Diterima" className="sm:col-span-2">
                  <span className="block text-[18px]">
                    {program ? `${program.singkatan} — ${program.nama}` : "-"}
                  </span>
                  <span className="mt-1.5 inline-flex rounded bg-chip px-2 py-0.5 text-[11.5px] font-medium">
                    Pilihan Utama (Ke-1)
                  </span>
                </Cell>
                <Cell label="Tanggal Penetapan Yudisium" className="sm:col-span-2">
                  <span className="flex items-end justify-between gap-2">
                    <span className="text-ink">
                      {seleksi.tanggalYudisium ? formatTanggal(seleksi.tanggalYudisium) : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px]">
                      <BadgeCheck size={14} />
                      Terakreditasi A
                    </span>
                  </span>
                </Cell>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-ink/75">
                <span>
                  Kategori Kuota: {seleksi.kuotaTerisi ?? "-"} / {seleksi.kuotaTotal ?? "-"} Siswa (Kelas {seleksi.kelas})
                </span>
                <span>Kode Kelas: {programKode ?? "-"}-1-26</span>
              </div>
            </section>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl bg-wash p-5">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
                  <CalendarDays size={22} />
                </span>
                <div className="leading-snug">
                  <p className="text-[12.5px] font-medium text-ink">Tenggat Akhir Daftar Ulang</p>
                  <p className="text-[22px] font-semibold text-forest">
                    {seleksi.batasDaftarUlang ? formatTanggal(seleksi.batasDaftarUlang) : "-"}
                  </p>
                  <p className="text-[11.5px] text-ink/75">
                    {sisa === null
                      ? ""
                      : sisa > 0
                        ? `Sisa waktu ${sisa} hari lagi untuk konfirmasi berkas fisik`
                        : sisa === 0
                          ? "Hari ini adalah batas akhir konfirmasi berkas fisik"
                          : "Batas waktu daftar ulang telah berakhir"}
                  </p>
                </div>
              </div>

              {seleksi.skor !== null && (
                <div className={`${card} inline-flex flex-col items-center gap-2 px-6 py-4`}>
                  <Ring skor={seleksi.skor} />
                  {seleksi.peringkat !== null && seleksi.totalPeserta !== null && (
                    <span className="rounded-full bg-chip px-3 py-0.5 text-[11.5px] font-semibold text-forest">
                      Peringkat {seleksi.peringkat} / {seleksi.totalPeserta}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <section className={`${card} mt-6 p-6 sm:p-8`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[24px] font-semibold text-ink">Langkah Wajib Selanjutnya:</h3>
                <p className="mt-1 text-[14px] text-ink/75">
                  Pastikan tiga tahapan berikut diselesaikan sebelum batas masa registrasi berakhir.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-3 py-1 text-[12px] font-semibold text-forest">
                <span className="size-1.5 rounded-full bg-forest" />
                Wajib Diselesaikan
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: 1,
                  t: "Unduh Dokumen SKL",
                  d: "Unduh Surat Keputusan Hasil Seleksi resmi (SKL) berstempel sekolah sebagai bukti sah kelulusan Anda.",
                  f: "Format Dokumen: PDF (1.2 MB)",
                  icon: <FileText size={13} />,
                },
                {
                  n: 2,
                  t: "Verifikasi Fisik & Berkas",
                  d: "Lakukan daftar ulang dan verifikasi fisik berkas asli di loket panitia SPMB pada 14 - 18 April 2026.",
                  f: "Loket Buka: 08.00 - 15.00 WIB",
                  icon: <Clock size={13} />,
                },
                {
                  n: 3,
                  t: "Seragam & Administrasi",
                  d: "Konfirmasi ukuran seragam sekolah dan pembayaran administrasi awal secara langsung maupun via transfer bank.",
                  f: "Fitting & Penyerahan Buku",
                  icon: <Shirt size={13} />,
                },
              ].map((s) => (
                <div key={s.n} className="flex flex-col rounded-xl bg-wash p-4">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-forest text-[14px] font-bold text-white">
                    {s.n}
                  </span>
                  <h4 className="mt-3 text-[17px] font-medium text-ink">{s.t}</h4>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink/75">{s.d}</p>
                  <p className="mt-auto flex items-center gap-1.5 pt-3 text-[11.5px] font-medium text-forest">
                    {s.icon}
                    {s.f}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <PrintLink className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 print:hidden">
                <Download size={16} />
                Unduh Surat Keterangan Lulus (PDF)
              </PrintLink>
              <Link
                href={`${base}/pengumuman`}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-forest shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
              >
                Panduan &amp; Alur Daftar Ulang
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-wash px-4 py-3 text-[13.5px] text-ink/85">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-chip text-forest">
          <CircleHelp size={18} />
        </span>
        <span className="flex-1">
          Ada pertanyaan seputar daftar ulang? Hubungi Panitia SPMB via WhatsApp:{" "}
          <a href={HELPDESK.wa} target="_blank" rel="noreferrer" className="font-bold text-forest">
            {HELPDESK.telp}
          </a>
        </span>
        <span className="flex items-center gap-3 text-[11.5px] text-ink/75">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            Gedung Administrasi Lt. 1
          </span>
          <span>•</span>
          <span>Pelayanan Hari Kerja</span>
        </span>
      </div>
    </div>
  );
}