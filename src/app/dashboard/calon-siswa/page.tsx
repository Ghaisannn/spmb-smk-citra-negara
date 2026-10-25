import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  Check,
  CircleHelp,
  Contact,
  FileUp,
  GraduationCap,
  Headset,
  MessageSquare,
  RefreshCw,
  User,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getBerkas } from "@/lib/berkas";
import { hitungWajib } from "@/lib/berkas-config";
import { getBiodataState } from "@/lib/biodata";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { getPercobaan } from "@/lib/cbt";
import { getPembayaran } from "@/lib/pembayaran";
import { formatRupiah } from "@/lib/pembayaran-config";
import { getProgramKode } from "@/lib/program";
import { getSeleksi } from "@/lib/seleksi";

export const metadata = { title: "Dashboard Calon Siswa | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

type Tone = "done" | "active" | "todo" | "locked";
type Step = {
  no: number;
  title: string;
  desc: string;
  tone: Tone;
  label: string;
  href?: string;
};

const jadwal = [
  { label: "Pendaftaran Online", date: "1 Feb – 31 Mar 2026", bold: true },
  { label: "Verifikasi Berkas", date: "1 - 5 Apr 2026" },
  { label: "Tes Minat & Bakat", date: "8 Apr 2026" },
  { label: "Pengumuman Hasil", date: "12 Apr 2026" },
];

export default async function DashboardCalonSiswa() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);
  const submitted = state?.status === "terkirim";

  const program = await getProgramKode(session.id);
  const biodataHref = submitted
    ? `${base}/biodata/review`
    : state && state.stepSelesai >= 3
      ? program
        ? `${base}/biodata/review`
        : `${base}/program`
      : `${base}/biodata`;

  const pay = submitted ? await getPembayaran(session.id) : null;
  const berkas = submitted ? hitungWajib(await getBerkas(session.id)) : null;
  const cbt = submitted ? await getPercobaan(session.id) : null;
  const seleksi = submitted ? await getSeleksi(session.id) : null;
  const diumumkan = seleksi !== null && seleksi.hasil !== "belum";

  const payInfo =
    pay &&
    {
      belum_bayar: {
        title: "Selesaikan Pembayaran Biaya Pendaftaran",
        desc: `Formulir Anda sudah terkirim. Lakukan pembayaran sebesar ${formatRupiah(pay.jumlah)} agar berkas dapat diproses panitia.`,
        cta: "Bayar Sekarang",
        tone: "bg-[#fff1b8] text-[#8a5a00]",
      },
      menunggu_verifikasi: {
        title: "Pembayaran Sedang Diverifikasi",
        desc: "Bukti transfer Anda sudah kami terima dan sedang diperiksa panitia (1x24 jam kerja).",
        cta: "Lihat Status",
        tone: "bg-[#fff1b8] text-[#8a5a00]",
      },
      ditolak: {
        title: "Bukti Pembayaran Ditolak",
        desc: "Bukti transfer tidak dapat diverifikasi. Silakan unggah ulang bukti yang benar.",
        cta: "Unggah Ulang",
        tone: "bg-red-100 text-[#c00000]",
      },
      lunas: {
        title: "Pembayaran Lunas",
        desc: "Biaya pendaftaran Anda sudah diverifikasi. Silakan lanjutkan ke tahap berikutnya.",
        cta: "Lihat Detail",
        tone: "bg-chip text-forest",
      },
    }[pay.status];

  // Banner hasil seleksi (muncul setelah admin/Kepsek mempublikasikan)
  const hasilInfo =
    diumumkan && seleksi
      ? seleksi.hasil === "diterima"
        ? {
            title: "Selamat, Anda Dinyatakan Diterima",
            desc: "Hasil seleksi sudah diumumkan. Lihat rincian keputusan dan langkah daftar ulang.",
            tone: "bg-chip text-forest",
          }
        : seleksi.hasil === "cadangan"
          ? {
              title: "Anda Masuk Daftar Cadangan",
              desc: "Hasil seleksi sudah diumumkan. Panitia akan menghubungi Anda jika ada kursi yang kosong.",
              tone: "bg-[#fff1b8] text-[#8a5a00]",
            }
          : {
              title: "Hasil Seleksi Telah Diumumkan",
              desc: "Buka halaman Hasil Seleksi untuk melihat rinciannya.",
              tone: "bg-pastel text-forest",
            }
      : null;

  // Status langkah 3 (Berkas)
  let berkasTone: Tone = "todo";
  let berkasLabel = "Belum Unggah";
  if (berkas) {
    if (berkas.lengkap) {
      berkasTone = "done";
      berkasLabel = berkas.semuaDiterima ? "Selesai" : "Menunggu Verifikasi";
    } else {
      berkasTone = "active";
      berkasLabel =
        berkas.terunggah === 0
          ? "Belum Unggah"
          : `${berkas.terunggah}/${berkas.total} Terunggah`;
    }
  }

  const steps: Step[] = [
    { no: 1, title: "Akun", desc: "Registrasi akun berhasil", tone: "done", label: "Selesai" },
    {
      no: 2,
      title: "Biodata",
      desc: "Lengkapi data pribadi",
      tone: submitted ? "done" : "active",
      label: submitted ? "Selesai" : "Belum Lengkap",
      href: biodataHref,
    },
    {
      no: 3,
      title: "Berkas",
      desc: "Dokumen administrasi",
      tone: berkasTone,
      label: berkasLabel,
      href: submitted ? `${base}/berkas` : undefined,
    },
    {
      no: 4,
      title: "Jurusan",
      desc: "Pilihan kejuruan SMK",
      tone: program ? "done" : "todo",
      label: program ? "Selesai" : "Belum Dipilih",
      href: `${base}/program`,
    },
    {
      no: 5,
      title: "Tes Potensi",
      desc: "Ujian masuk & minat",
      tone:
        cbt?.status === "selesai"
          ? "done"
          : cbt?.status === "berjalan"
            ? "active"
            : submitted
              ? "todo"
              : "locked",
      label:
        cbt?.status === "selesai"
          ? "Selesai"
          : cbt?.status === "berjalan"
            ? "Sedang Dikerjakan"
            : submitted
              ? "Belum Dikerjakan"
              : "Terkunci",
      href: submitted ? `${base}/jadwal` : undefined,
    },
    {
      no: 6,
      title: "Pengumuman",
      desc: "Hasil seleksi resmi",
      tone: diumumkan ? "done" : submitted ? "todo" : "locked",
      label: diumumkan ? "Diumumkan" : submitted ? "Menunggu Hasil" : "Terkunci",
      href: submitted ? `${base}/hasil` : undefined,
    },
  ];

  const langkah = [
    {
      no: 1,
      icon: User,
      title: "Lengkapi Biodata Diri",
      badge: submitted
        ? { text: "Selesai", cls: "bg-chip text-forest" }
        : { text: "Harus Diisi", cls: "bg-[#fff1b8] text-[#8a5a00]" },
      desc: "Lengkapi rincian data pribadi, nomor kontak WhatsApp aktif calon siswa dan orang tua, serta data asal sekolah (SMP/MTs).",
      cta: submitted ? "Lihat Biodata" : "Lengkapi Biodata",
      href: biodataHref,
      primary: !submitted,
    },
    {
      no: 2,
      icon: FileUp,
      title: "Upload Dokumen Berkas",
      badge: berkas
        ? berkas.semuaDiterima
          ? { text: "Selesai", cls: "bg-chip text-forest" }
          : berkas.lengkap
            ? { text: "Menunggu Verifikasi", cls: "bg-[#fff1b8] text-[#8a5a00]" }
            : { text: `${berkas.terunggah}/${berkas.total} Terunggah`, cls: "bg-[#fff1b8] text-[#8a5a00]" }
        : undefined,
      desc: "Siapkan scan Kartu Keluarga (KK), Akta Kelahiran, Surat Keterangan Lulus / Ijazah SMP, dan Pas Foto terbaru latar merah/biru.",
      cta: berkas?.lengkap ? "Lihat Berkas" : "Upload Berkas",
      href: `${base}/berkas`,
      primary: Boolean(submitted && berkas && !berkas.lengkap),
    },
    {
      no: 3,
      icon: GraduationCap,
      title: "Pilih Program Keahlian",
      badge: program ? { text: "Selesai", cls: "bg-chip text-forest" } : undefined,
      desc: "Tersedia 6 kompetensi kejuruan unggulan (PPLG, TJKT, DKV, Pemasaran, Perhotelan, dan MPLB).",
      cta: program ? "Lihat Pilihan" : "Pilih Jurusan",
      href: `${base}/program`,
      primary: false,
    },
    {
      no: 4,
      icon: CalendarCheck,
      title: "Jadwal & Ujian Potensi",
      badge: undefined,
      desc: "Pantau tanggal tes pemetaan minat dan wawancara daring/luring setelah berkas Anda dinyatakan lolos verifikasi.",
      cta: "Lihat Jadwal",
      href: `${base}/jadwal`,
      primary: false,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-6">
      {/* Selamat datang */}
      <section className={`${card} p-6 sm:p-8`}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[12px] font-medium text-ink/80">
          <span className="size-1.5 rounded-full bg-forest" />
          Tahun Ajaran 2026/2027
        </span>
        <h1 className="mt-4 text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">
          Selamat datang, <span className="text-forest">{session.nama}</span>
        </h1>
        <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-ink/75">
          Lengkapi data dan ikuti setiap tahapan SPMB SMK Citra Negara secara bertahap untuk memastikan kelulusan administrasi Anda.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-ink/80">
          <span className="font-medium">Nomor Registrasi:</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-chip/60 px-2.5 py-1 font-bold text-forest">
            <Contact size={14} />
            {nomorRegistrasi(session.id)}
          </span>
          <span className="size-1.5 rounded-full bg-ink/20" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1 font-semibold text-forest">
            <BadgeCheck size={14} />
            Gelombang 1
          </span>
        </div>
      </section>

      {/* Hasil seleksi diumumkan */}
      {hasilInfo && (
        <section className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}>
          <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-lg ${hasilInfo.tone}`}>
            <BadgeCheck size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-ink">{hasilInfo.title}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink/75">{hasilInfo.desc}</p>
          </div>
          <Link
            href={`${base}/hasil`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800 sm:self-center"
          >
            Lihat Hasil
            <ArrowRight size={15} />
          </Link>
        </section>
      )}

      {/* Pembayaran */}
      {payInfo && (
        <section className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}>
          <span
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-lg ${payInfo.tone}`}
          >
            <Wallet size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-ink">{payInfo.title}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink/75">{payInfo.desc}</p>
          </div>
          <Link
            href={`${base}/pembayaran`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800 sm:self-center"
          >
            {payInfo.cta}
            <ArrowRight size={15} />
          </Link>
        </section>
      )}

      {/* Progres */}
      <section className={`${card} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
              Progres Berjalan
            </p>
            <h2 className="mt-1 text-[24px] font-semibold text-ink">Status Tahapan Pendaftaran</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-3 py-1 text-[12px] font-medium text-ink/80">
            <RefreshCw size={13} className="text-forest" />
            Pembaruan Otomatis
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {steps.map((s) => {
            const done = s.tone === "done";
            const active = s.tone === "active";

            const cls = `block rounded-xl p-3.5 ${
              active ? "bg-[#dcece1] shadow-sm" : "bg-[#eef5f0]"
            } ${s.href ? "transition hover:shadow-md hover:ring-1 hover:ring-forest/30" : ""}`;

            const inner = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {done ? (
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest text-white">
                      <Check size={15} strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full text-[12px] font-bold ${
                        active ? "bg-forest text-white" : "bg-white/70 text-ink/50"
                      }`}
                    >
                      {s.no}
                    </span>
                  )}
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-semibold text-forest">
                      <span className="size-1.5 rounded-full bg-forest" />
                      {s.label}
                    </span>
                  )}
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1b8] px-2 py-0.5 text-[11px] font-medium text-ink">
                      <span className="size-1.5 rounded-full bg-orange-500" />
                      {s.label}
                    </span>
                  )}
                  {!done && !active && (
                    <span className="text-[11.5px] text-ink/55">{s.label}</span>
                  )}
                </div>
                <p
                  className={`mt-3 text-[16px] font-semibold ${
                    done || active ? "text-ink" : "text-ink/55"
                  }`}
                >
                  {s.no}. {s.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-ink/60">{s.desc}</p>
              </>
            );

            return s.href ? (
              <Link key={s.no} href={s.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={s.no} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* Langkah selanjutnya + jadwal */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_298px]">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-[22px] font-semibold text-ink">Langkah Selanjutnya</h2>
            <span className="text-[12px] font-semibold text-ink/80">Lakukan secara berurutan</span>
          </div>

          <div className="space-y-4">
            {langkah.map(({ no, icon: Icon, title, badge, desc, cta, href, primary }) => (
              <div
                key={no}
                className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center`}
              >
                <span
                  className={`inline-flex size-12 shrink-0 items-center justify-center rounded-lg ${
                    no === 1 ? "bg-chip text-forest" : "bg-pastel text-forest"
                  }`}
                >
                  <Icon size={22} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        no === 1 ? "bg-forest text-white" : "bg-pastel text-ink/70"
                      }`}
                    >
                      {no}
                    </span>
                    <h3 className="text-[18px] font-medium text-ink">{title}</h3>
                    {badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink/75">{desc}</p>
                </div>

                <Link
                  href={href}
                  className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg px-5 text-[14px] font-semibold transition sm:self-center ${
                    primary
                      ? "bg-forest text-white hover:bg-brand-800"
                      : "bg-wash text-forest hover:bg-[#d9f0e0]"
                  }`}
                >
                  {cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <aside className={`${card} p-5`}>
          <h3 className="flex items-center gap-2 text-[16px] font-semibold text-forest">
            <Calendar size={18} />
            Jadwal Gelombang 1
          </h3>
          <div className="mt-3 space-y-2">
            {jadwal.map((j) => (
              <div
                key={j.label}
                className="flex items-center justify-between gap-2 rounded-md bg-[#eef5f0] px-3 py-2 text-[12px]"
              >
                <span className="text-ink/85">{j.label}</span>
                <span className={j.bold ? "font-bold text-forest" : "text-ink/70"}>{j.date}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Helpdesk */}
      <section className={`${card} flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center`}>
        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-chip text-forest">
          <Headset size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Helpdesk Panitia SPMB
          </p>
          <h3 className="mt-1 text-[24px] font-semibold leading-tight text-ink">
            Mengalami Kendala Saat Mengisi Data?
          </h3>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-ink/75">
            Tim panitia SPMB SMK Citra Negara siap mendampingi Anda dan orang tua dalam proses pendaftaran online setiap hari kerja (Senin - Sabtu, pukul 08.00 - 15.00 WIB).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/6281123456789"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800"
          >
            <MessageSquare size={16} />
            Hubungi via WhatsApp
          </a>
          <a
            href="/files/panduan-spmb.pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-5 text-[14px] font-semibold text-ink transition hover:bg-[#d9f0e0]"
          >
            <CircleHelp size={16} />
            Panduan SPMB (PDF)
          </a>
        </div>
      </section>
    </div>
  );
}