import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  ExternalLink,
  Headset,
  Info,
  Landmark,
  MessageSquare,
  XCircle,
} from "lucide-react";
import CopyButton from "@/components/dashboard/CopyButton";
import PembayaranForm from "@/components/dashboard/PembayaranForm";
import PrintButton from "@/components/dashboard/PrintButton";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { nomorRegistrasi } from "@/lib/biodata-schema";
import { getPembayaran } from "@/lib/pembayaran";
import { REKENING_TUJUAN, formatRupiah } from "@/lib/pembayaran-config";

export const metadata = { title: "Pembayaran | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

const statusUI = {
  belum_bayar: { label: "Belum Dibayar", cls: "bg-[#fff1b8] text-[#8a5a00]" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", cls: "bg-[#fff1b8] text-[#8a5a00]" },
  lunas: { label: "Lunas", cls: "bg-chip text-forest" },
  ditolak: { label: "Ditolak", cls: "bg-red-100 text-[#c00000]" },
} as const;

function waktu(iso: string | null) {
  if (!iso) return "-";
  return (
    new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-wash px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink/65">{label}</p>
        <p className="mt-0.5 break-words text-[16px] font-semibold text-ink">{value}</p>
      </div>
      {action}
    </div>
  );
}

export default async function PembayaranPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);

  // Pembayaran hanya bisa diakses setelah formulir biodata terkirim.
  if (!state || state.status !== "terkirim") redirect(`${base}/biodata`);

  const pay = await getPembayaran(session.id);
  const noReg = nomorRegistrasi(session.id);
  const ui = statusUI[pay.status];
  const bisaBayar = pay.status === "belum_bayar" || pay.status === "ditolak";

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink/80">
        <span className="size-1.5 rounded-full bg-forest" />
        Langkah Selanjutnya • Pembayaran
      </span>
      <h1 className="mt-3 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
        Pembayaran Biaya Pendaftaran
      </h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/75">
        Formulir biodata Anda sudah terkirim. Selesaikan pembayaran biaya pendaftaran SPMB agar berkas Anda dapat diproses oleh panitia.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {/* ====== MENUNGGU VERIFIKASI ====== */}
          {pay.status === "menunggu_verifikasi" && (
            <section className={`${card} p-6 sm:p-8`}>
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#fff1b8] text-[#8a5a00]">
                <Clock size={26} />
              </span>
              <h2 className="mt-4 text-[24px] font-semibold text-ink">
                Pembayaran Sedang Diverifikasi
              </h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">
                Bukti transfer Anda sudah kami terima. Panitia akan memeriksa pembayaran dalam 1x24 jam kerja. Status akan diperbarui otomatis di halaman ini.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoRow label="Bank Pengirim" value={pay.bankPengirim} />
                <InfoRow label="Nama Pengirim" value={pay.namaPengirim} />
                <InfoRow label="Dikirim Pada" value={waktu(pay.paidAt)} />
                <InfoRow
                  label="Bukti Transfer"
                  value="Lihat Bukti"
                  action={
                    <a
                      href="/api/pembayaran/bukti"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Buka bukti transfer"
                      className="inline-flex size-8 items-center justify-center rounded-md bg-white text-forest hover:bg-chip"
                    >
                      <ExternalLink size={15} />
                    </a>
                  }
                />
              </div>
              <Link
                href={base}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-wash px-5 text-[14px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
              >
                <ArrowLeft size={16} />
                Kembali ke Dashboard
              </Link>
            </section>
          )}

          {/* ====== LUNAS ====== */}
          {pay.status === "lunas" && (
            <section className={`${card} p-6 sm:p-8`}>
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-chip text-forest">
                <BadgeCheck size={28} />
              </span>
              <h2 className="mt-4 text-[24px] font-semibold text-ink">Pembayaran Lunas</h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink/75">
                Terima kasih. Pembayaran biaya pendaftaran Anda sudah diverifikasi oleh panitia. Silakan lanjutkan ke tahap berikutnya.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoRow label="Jumlah Dibayar" value={formatRupiah(pay.jumlah)} />
                <InfoRow label="Diverifikasi Pada" value={waktu(pay.verifiedAt)} />
                <InfoRow label="Bank Pengirim" value={pay.bankPengirim || "-"} />
                <InfoRow label="Nama Pengirim" value={pay.namaPengirim || "-"} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrintButton label="Cetak Bukti Pembayaran" />
                <Link
                  href={base}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white transition hover:bg-brand-800 print:hidden"
                >
                  Lanjut ke Dashboard
                </Link>
              </div>
            </section>
          )}

          {/* ====== BELUM BAYAR / DITOLAK ====== */}
          {bisaBayar && (
            <>
              {pay.status === "ditolak" && (
                <div className="flex gap-3 rounded-xl bg-red-50 px-5 py-4">
                  <XCircle size={22} className="mt-0.5 shrink-0 text-[#c00000]" />
                  <div>
                    <p className="text-[16px] font-semibold text-[#c00000]">
                      Bukti Pembayaran Ditolak
                    </p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/80">
                      {pay.catatan || "Bukti transfer tidak dapat diverifikasi."} Silakan unggah ulang bukti transfer yang benar pada formulir di bawah.
                    </p>
                  </div>
                </div>
              )}

              <section className={`${card} p-6 sm:p-8`}>
                <p className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
                  Total Pembayaran
                </p>
                <p className="mt-1 text-[38px] font-semibold leading-tight text-ink">
                  {formatRupiah(pay.jumlah)}
                </p>
                <p className="mt-1 text-[13.5px] text-ink/70">
                  Biaya pendaftaran SPMB SMK Citra Negara Tahun Ajaran 2026/2027.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-chip text-forest">
                    <Landmark size={19} />
                  </span>
                  <div>
                    <h2 className="text-[18px] font-semibold leading-tight text-ink">
                      Transfer ke Rekening Sekolah
                    </h2>
                    <p className="text-[12.5px] text-ink/70">
                      Pastikan nominal dan nomor rekening sesuai.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <InfoRow label="Bank Tujuan" value={REKENING_TUJUAN.bank} />
                  <InfoRow
                    label="Nomor Rekening"
                    value={<span className="tracking-wide">{REKENING_TUJUAN.nomor}</span>}
                    action={<CopyButton value={REKENING_TUJUAN.nomor} />}
                  />
                  <InfoRow label="Atas Nama" value={REKENING_TUJUAN.atasNama} />
                  <InfoRow
                    label="Nominal Transfer"
                    value={formatRupiah(pay.jumlah)}
                    action={<CopyButton value={String(pay.jumlah)} />}
                  />
                  <InfoRow
                    label="Berita / Keterangan Transfer"
                    value={`SPMB ${noReg}`}
                    action={<CopyButton value={`SPMB ${noReg}`} />}
                  />
                </div>

                <div className="mt-5 flex gap-3 rounded-xl bg-wash px-4 py-3.5">
                  <span className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-forest text-white">
                    <Info size={12} strokeWidth={3} />
                  </span>
                  <p className="text-[13px] leading-relaxed text-ink/80">
                    Cantumkan nomor registrasi pada berita transfer agar pembayaran mudah dicocokkan oleh panitia. Simpan bukti transfer, lalu unggah pada formulir konfirmasi di bawah.
                  </p>
                </div>
              </section>

              <section className={`${card} p-6 sm:p-8`}>
                <h2 className="text-[20px] font-semibold text-ink">Konfirmasi Pembayaran</h2>
                <p className="mt-1 text-[13.5px] text-ink/70">
                  Isi data pengirim dan unggah bukti transfer Anda.
                </p>
                <PembayaranForm namaAwal={pay.namaPengirim || session.nama} />
              </section>
            </>
          )}
        </div>

        {/* ====== RINGKASAN ====== */}
        <aside className="space-y-4 lg:sticky lg:top-[90px]">
          <div className={`${card} p-5`}>
            <h3 className="text-[16px] font-semibold text-forest">Ringkasan Tagihan</h3>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-ink/65">Nomor Registrasi</dt>
                <dd className="mt-0.5 font-bold text-forest">{noReg}</dd>
              </div>
              <div>
                <dt className="text-ink/65">Nama Calon Siswa</dt>
                <dd className="mt-0.5 font-semibold text-ink">{session.nama}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="text-ink/80">Biaya Pendaftaran</dt>
                <dd className="font-semibold text-ink">{formatRupiah(pay.jumlah)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-[17px] font-bold text-forest">{formatRupiah(pay.jumlah)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="text-ink/80">Status</dt>
                <dd className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ui.cls}`}>
                  {ui.label}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`${card} p-5 print:hidden`}>
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Headset size={17} className="text-forest" />
              Kendala pembayaran?
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">
              Hubungi Helpdesk SPMB, Senin - Sabtu pukul 08.00 - 15.00 WIB.
            </p>
            <a
              href="https://wa.me/6281123456789"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-wash text-[13px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
            >
              <MessageSquare size={15} />
              WhatsApp 0811-2345-6789
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}