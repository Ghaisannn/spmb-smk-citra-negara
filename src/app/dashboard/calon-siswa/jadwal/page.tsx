import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CircleCheck,
  CircleHelp,
  Clock,
  Contact,
  Download,
  ShieldCheck,
  Timer,
  User,
  Wifi,
} from "lucide-react";
import MulaiTesButton, { type ModeTes } from "@/components/dashboard/MulaiTesButton";
import PrintLink from "@/components/dashboard/PrintLink";
import { hariTanggal } from "@/lib/admin-config";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { MAPEL_CBT, formatSisa, labelSesi } from "@/lib/cbt-config";
import { getPercobaan, getSesiUntukSiswa } from "@/lib/cbt";
import { HELPDESK } from "@/lib/jadwal-config";

export const metadata = { title: "Jadwal & Tes | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Info({
  icon,
  label,
  children,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-wash p-4">
      <p className="flex items-center gap-1.5 text-[12px] text-ink/75">
        {icon}
        {label}
      </p>
      <div className="mt-1.5 text-[18px] font-medium leading-snug">{children}</div>
      <div className="mt-1 text-[12px] text-ink/70">{sub}</div>
    </div>
  );
}

export default async function JadwalPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);
  if (!state || state.status !== "terkirim") redirect(`${base}/biodata`);

  const percobaan = await getPercobaan(session.id);
  const sesi = await getSesiUntukSiswa(session.id);

  const noReg = nomorRegistrasi(session.id);
  const token = `CN-CBT-${noReg.split("-").pop()}`;
  const selesai = percobaan?.status === "selesai";
  const berjalan = percobaan?.status === "berjalan";
  const penuh = Boolean(sesi && !percobaan && sesi.terisi >= sesi.kuota);

  const mode: ModeTes = selesai
    ? "selesai"
    : berjalan
      ? "lanjut"
      : !sesi
        ? "kosong"
        : sesi.status === "dibuka"
          ? penuh
            ? "penuh"
            : "mulai"
          : sesi.status === "ditutup"
            ? "ditutup"
            : "tunggu";

  const durasi = sesi?.durasi ?? 120;
  const jumlah = percobaan?.total ?? sesi?.jumlahSoal ?? 50;

  const badge = selesai
    ? { t: "Ujian Selesai Dikerjakan", c: "bg-chip text-forest", d: "bg-forest" }
    : berjalan
      ? { t: "Sedang Dikerjakan", c: "bg-[#fff1b8] text-[#8a5a00]", d: "bg-orange-500 animate-pulse" }
      : mode === "mulai"
        ? { t: "Tersedia / Siap Dikerjakan", c: "bg-chip text-forest", d: "bg-forest" }
        : mode === "ditutup" || mode === "penuh"
          ? { t: mode === "penuh" ? "Kuota Sesi Penuh" : "Sesi Telah Ditutup", c: "bg-pastel text-ink/70", d: "bg-ink/40" }
          : { t: "Menunggu Dibuka Panitia", c: "bg-[#fff1b8] text-[#8a5a00]", d: "bg-orange-500" };

  const chipSesi = !sesi
    ? "Belum Dijadwalkan"
    : sesi.status === "dibuka"
      ? "Sedang Berlangsung"
      : sesi.status === "ditutup"
        ? "Sudah Ditutup"
        : "Belum Dibuka";

  const ketentuan = [
    "Pastikan koneksi internet stabil selama proses pengerjaan tes untuk menghindari putusnya sinkronisasi jawaban CBT.",
    "Ujian hanya dapat diselesaikan satu kali (tidak dapat diulang setelah menekan tombol submit akhir pada lembar soal).",
    `Kerjakan secara mandiri dan teliti sebelum batas waktu ${durasi} menit berakhir. Pengawas berhak membatalkan hasil bila terdapat kecurangan.`,
    <>
      Jika terjadi kendala sistem atau mati listrik, segera hubungi Helpdesk Panitia SPMB di{" "}
      <span className="text-forest">{HELPDESK.telp}</span> dengan menyertakan Nomor Pendaftaran.
    </>,
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Tahap 4 dari 5 : Ujian Seleksi &amp; Pemetaan Minat
          </p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Jadwal Ujian &amp; Tes Potensi</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/75">
            Ikuti Tes Potensi Akademik &amp; Minat Bakat secara online melalui portal SPMB sesuai dengan sesi yang dibuka oleh panitia.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-ink">
            <Timer size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-[12px] text-ink/70">Sesi Ujian CBT</span>
            <span className="block text-[15px] font-bold text-forest">{chipSesi}</span>
          </span>
        </div>
      </div>

      {/* Kartu ujian */}
      <section className={`${card} mt-6 p-5 sm:p-8`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold ${badge.c}`}>
            <span className={`size-2 rounded-full ${badge.d}`} />
            {badge.t}
          </span>
          <span className="text-[12px] text-ink/75">
            Token Sesi: <span className="font-mono font-bold text-ink">{token}</span>
          </span>
        </div>

        <h2 className="mt-5 text-[26px] font-semibold leading-tight text-ink">
          {sesi?.nama ?? "Tes Potensi Akademik & Minat Bakat (CBT)"}
        </h2>
        <p className="mt-1 text-[14px] text-ink/75">
          Tes berbasis komputer (Computer Based Test) untuk menilai kesiapan kompetensi akademik dasar serta analisis peminatan kejuruan.
        </p>

        {berjalan && percobaan && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#fff1b8] px-4 py-3 text-[13.5px] text-[#8a5a00]">
            <Clock size={17} className="mt-0.5 shrink-0" />
            Ujian Anda sedang berlangsung. Sisa waktu {formatSisa(percobaan.sisaDetik)} dan {percobaan.terjawab} dari {percobaan.total} soal sudah terjawab. Lanjutkan sebelum waktu habis.
          </p>
        )}
        {selesai && percobaan && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-chip/60 px-4 py-3 text-[13.5px] text-forest">
            <CircleCheck size={17} className="mt-0.5 shrink-0" />
            Jawaban Anda sudah dikumpulkan pada pukul {percobaan.selesai} WIB ({percobaan.terjawab} dari {percobaan.total} soal terjawab). Nilai CBT akan diumumkan bersama hasil seleksi.
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={<Calendar size={14} />} label="Tanggal Pelaksanaan" sub="Hari Pelaksanaan">
            {sesi ? hariTanggal(sesi.tanggal) : "-"}
          </Info>
          <Info icon={<Clock size={14} />} label="Waktu Ujian" sub={<span className="text-forest">Durasi: {durasi} Menit</span>}>
            {sesi ? `${sesi.mulai} - ${sesi.selesai} WIB` : "-"}
          </Info>
          <Info icon={<CircleHelp size={14} />} label="Jumlah Soal" sub={MAPEL_CBT}>
            {jumlah} Butir Pilihan Ganda
          </Info>
          <Info icon={<User size={14} />} label="Status Peserta" sub={sesi ? `Gelombang ${sesi.gelombang} • ${labelSesi(sesi.mulai)}` : "-"}>
            <span className={selesai ? "text-forest" : berjalan ? "text-[#8a5a00]" : "text-[#c2540a]"}>
              {selesai ? "Sudah Dikerjakan" : berjalan ? "Sedang Dikerjakan" : "Belum Dikerjakan"}
            </span>
          </Info>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink/70">
          <Wifi size={13} className="mt-0.5 shrink-0" />
          Pelaksanaan: online melalui portal SPMB, dapat dikerjakan dari laptop/PC maupun handphone Anda sendiri. Jika memakai handphone, jangan menutup browser selama ujian berlangsung.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-wash px-4 py-2.5 text-[12px] font-medium text-forest">
          <span className="inline-flex items-center gap-1.5"><CircleCheck size={14} />Kamera &amp; Audio Terdeteksi</span>
          <span className="inline-flex items-center gap-1.5"><CircleCheck size={14} />Browser Kompatibel (Chrome/Edge/Safari)</span>
          <span className="inline-flex items-center gap-1.5"><Wifi size={14} />Koneksi Stabil (24 Mbps)</span>
          <span className="font-normal text-ink/80 sm:ml-auto">Perangkat: Laptop / PC &amp; Handphone</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <MulaiTesButton mode={mode} jumlahSoal={jumlah} durasi={durasi} />
          <a
            href="/files/panduan-teknis-cbt.pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
          >
            <BookOpen size={17} />
            Panduan Teknis Ujian CBT
          </a>
        </div>
        {mode === "tunggu" && (
          <p className="mt-3 text-[12.5px] text-ink/65">Tombol akan aktif otomatis setelah panitia membuka sesi. Muat ulang halaman ini secara berkala.</p>
        )}
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_355px]">
        <section className="rounded-2xl bg-wash p-6 sm:p-7">
          <h2 className="flex items-center gap-3 text-[24px] font-semibold text-ink">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-forest text-white"><ShieldCheck size={19} /></span>
            Ketentuan Penting Pelaksanaan Ujian Online:
          </h2>
          <ol className="mt-5 space-y-3">
            {ketentuan.map((k, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/85">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-forest shadow-sm">{i + 1}</span>
                <span>{k}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
            <span className="text-ink/75">Layanan Helpdesk Online Aktif Pukul 07:30 - 16:00 WIB</span>
            <a href={HELPDESK.wa} target="_blank" rel="noreferrer" className="font-semibold text-forest">Hubungi WhatsApp Panitia</a>
          </div>
        </section>

        <section className={`${card} flex items-center gap-3 p-4`}>
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-chip text-forest"><Contact size={21} /></span>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="text-[14px] font-medium text-ink">Kartu Tanda Peserta Ujian</p>
            <p className="text-[11.5px] text-ink/70">Wajib diunduh untuk arsip calon siswa</p>
          </div>
          <PrintLink className="inline-flex h-11 shrink-0 flex-col items-center justify-center rounded-md bg-wash px-3 text-[11.5px] font-medium leading-tight text-ink transition hover:bg-[#d9f0e0] print:hidden">
            <Download size={13} />
            Unduh PDF
          </PrintLink>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <Link href={`${base}/program`} className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash">
          <ArrowLeft size={16} />
          Kembali ke Program Keahlian
        </Link>
        <Link href={`${base}/hasil`} className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800">
          Lanjut Cek Hasil Seleksi
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}