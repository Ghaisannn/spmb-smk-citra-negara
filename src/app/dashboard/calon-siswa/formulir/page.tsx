import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  Headset,
  LayoutDashboard,
  Lock,
  MessageSquare,
  ReceiptText,
  UserCheck,
  Wallet,
} from "lucide-react";
import PrintLink from "@/components/dashboard/PrintLink";
import { PROGRAM_ICON } from "@/components/dashboard/program-icons";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { HELPDESK } from "@/lib/jadwal-config";
import { getPembayaran } from "@/lib/pembayaran";
import { formatRupiah } from "@/lib/pembayaran-config";
import { getProgramKode } from "@/lib/program";
import { namaRingkas } from "@/lib/program-data";

export const metadata = { title: "Formulir Terkirim | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Tile({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-wash p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink/70">{label}</p>
      <div className="mt-1.5 text-[18px] font-medium leading-snug text-forest">{children}</div>
      {sub && <div className="mt-1.5 text-[12px] text-ink/75">{sub}</div>}
    </div>
  );
}

export default async function FormulirTerkirimPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);
  if (!state || state.status !== "terkirim") redirect(`${base}/biodata`);

  const [program, pay] = await Promise.all([
    getProgramKode(session.id),
    getPembayaran(session.id),
  ]);
  const noReg = nomorRegistrasi(session.id);
  const ProgIcon = program ? PROGRAM_ICON[program] : null;

  const checks = [
    { label: "Biodata Diri", ok: true },
    { label: "Kontak & Alamat", ok: true },
    { label: "Sekolah & Wali", ok: true },
    { label: "Dokumen Digital", ok: false },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-6">
      {/* Banner sukses */}
      <section className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:p-7`}>
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
          <BadgeCheck size={26} />
        </span>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-0.5 text-[11.5px] font-semibold text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Registrasi Terkunci &amp; Masuk Antrean Panitia
          </span>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight text-ink sm:text-[30px]">
            Formulir Pendaftaran Berhasil Dikirim &amp; Terverifikasi Sistem
          </h1>
          <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/75">
            Terima kasih, <span className="font-medium text-ink">{session.nama}</span>. Seluruh berkas dan data formulir pendaftaran Anda telah berhasil dikunci permanen serta diteruskan ke loket verifikasi panitia SPMB SMK Citra Negara Tahun Ajaran 2026/2027.
          </p>
        </div>
      </section>

      {/* Ajakan pembayaran */}
      {pay.status !== "lunas" && (
        <section className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 print:hidden`}>
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#fff1b8] text-[#8a5a00]">
            <Wallet size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-ink">
              {pay.status === "menunggu_verifikasi"
                ? "Pembayaran Sedang Diverifikasi"
                : "Langkah Berikutnya: Pembayaran Biaya Pendaftaran"}
            </h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink/75">
              {pay.status === "menunggu_verifikasi"
                ? "Bukti transfer Anda sudah kami terima dan sedang diperiksa panitia."
                : `Selesaikan pembayaran sebesar ${formatRupiah(pay.jumlah)} agar berkas Anda dapat diproses oleh panitia.`}
            </p>
          </div>
          <Link
            href={`${base}/pembayaran`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-forest px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800 sm:self-center"
          >
            {pay.status === "menunggu_verifikasi" ? "Lihat Status" : "Bayar Sekarang"}
            <ArrowRight size={15} />
          </Link>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_298px]">
        {/* Receipt */}
        <section className={`${card} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-forest px-5 py-3.5 text-white">
            <h2 className="flex items-center gap-2.5 text-[17px] font-medium">
              <ReceiptText size={20} />
              Tanda Terima Pendaftaran Resmi (Digital Receipt)
            </h2>
            <span className="rounded bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wide">
              SAH / TERDAFTAR
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-lg bg-wash p-4">
              <p className="text-[12px] text-ink/75">Nomor Registrasi Calon Siswa</p>
              <p className="mt-1 text-[26px] font-semibold tracking-wide text-forest">{noReg}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Tile
                label="Program Keahlian Pilihan"
                sub={
                  <span className="inline-flex rounded bg-chip px-2 py-0.5 text-[11.5px] font-medium text-forest">
                    Akreditasi A • Kuota Tersedia
                  </span>
                }
              >
                <span className="flex gap-2">
                  {ProgIcon && <ProgIcon size={16} className="mt-1.5 shrink-0" />}
                  <span className="text-ink">{program ? namaRingkas(program) : "-"}</span>
                </span>
              </Tile>

              <Tile
                label="Jalur & Gelombang Seleksi"
                sub={
                  <span className="inline-flex rounded bg-chip px-2 py-0.5 text-[11.5px] font-medium text-forest">
                    T.A. 2026/2027
                  </span>
                }
              >
                <span className="flex items-center gap-2 text-ink">
                  <UserCheck size={16} className="shrink-0 text-forest" />
                  Reguler • Gelombang 1
                </span>
              </Tile>

              <Tile
                label="Integritas & Kunci Data"
                sub="Perubahan biodata hanya melalui tiket verifikator panitia."
              >
                <span className="flex items-center gap-2">
                  <Lock size={16} className="shrink-0" />
                  Data Terkunci Permanen
                </span>
              </Tile>

              <Tile
                label="Validasi Persyaratan"
                sub="Formulir Terisi Penuh • Berkas dilengkapi di menu Berkas Pendaftaran"
              >
                <span className="flex items-center gap-2">
                  <CircleCheck size={16} className="shrink-0" />
                  100% Formulir Lengkap
                </span>
              </Tile>
            </div>

            <div className="pt-2">
              <p className="text-[13px] font-medium text-ink">Kelengkapan Formulir Tersimpan:</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {checks.map((c) => (
                  <span
                    key={c.label}
                    className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                      c.ok ? "text-forest" : "text-ink/50"
                    }`}
                  >
                    {c.ok ? <CircleCheck size={14} /> : <Clock size={14} />}
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            <PrintLink className="mt-2 inline-flex h-11 items-center gap-2 rounded-md bg-forest px-5 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 print:hidden">
              <Download size={16} />
              Unduh Bukti Pendaftaran (PDF)
            </PrintLink>
          </div>
        </section>

        {/* Bantuan */}
        <aside className={`${card} p-5 print:hidden`}>
          <h3 className="flex items-center gap-2 text-[17px] font-medium text-ink">
            <Headset size={19} className="text-forest" />
            Pusat Bantuan &amp; Helpdesk
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink/75">
            Mengalami kendala dokumen atau ada data yang perlu revisi khusus sebelum tes? Hubungi petugas loket resmi SPMB SMK Citra Negara.
          </p>

          <a
            href={HELPDESK.wa}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-lg bg-wash p-3.5"
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-forest">
              <MessageSquare size={14} />
              WhatsApp Loket SPMB
            </span>
            <span className="mt-1 block text-[19px] font-semibold text-ink">{HELPDESK.telp}</span>
            <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink/70">
              <Clock size={12} />
              Senin – Sabtu: 08.00 – 15.00 WIB
            </span>
          </a>

          <div className="mt-3 space-y-2">
            <Link
              href={base}
              className="flex items-center gap-2 rounded-lg bg-wash px-3 py-2.5 text-[13px] font-medium text-ink transition hover:bg-[#d9f0e0]"
            >
              <LayoutDashboard size={16} className="text-forest" />
              <span className="flex-1">Kembali ke Dashboard Utama</span>
              <ChevronRight size={15} />
            </Link>
            <Link
              href={`${base}/jadwal`}
              className="flex items-center gap-2 rounded-lg bg-wash px-3 py-2.5 text-[13px] font-medium text-ink transition hover:bg-[#d9f0e0]"
            >
              <CalendarCheck size={16} className="text-forest" />
              <span className="flex-1">Lihat Jadwal &amp; Lokasi Tes Seleksi</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}