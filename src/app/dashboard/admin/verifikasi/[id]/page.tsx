import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleCheck,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import PaymentPanel from "@/components/admin/PaymentPanel";
import VerifikasiPanel, { type DocRow } from "@/components/admin/VerifikasiPanel";
import { requireRole } from "@/lib/auth";
import { getPendaftarDetail } from "@/lib/admin-data";
import { jam, tglPendek } from "@/lib/admin-format";
import { JENIS_BERKAS, hitungWajib } from "@/lib/berkas-config";
import { formatTanggal, formatWa, nomorRegistrasi } from "@/lib/biodata-schema";
import { formatRupiah } from "@/lib/pembayaran-config";
import { PROGRAM_ADMIN, kapasitasOf } from "@/lib/program-admin";

export const metadata = { title: "Verifikasi Berkas & Detail Pendaftaran | SMK Citra Negara" };

const base = "/dashboard/admin";
const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">{children}</p>;
}

function waktu(iso: string | null) {
  if (!iso) return "-";
  return `${tglPendek(iso)}, ${jam(new Date(iso))} WIB`;
}

export default async function DetailPendaftarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const d = await getPendaftarDetail(id);
  if (!d) notFound();

  const { state, items, pay, program, kuota } = d;
  const noReg = nomorRegistrasi(id);
  const back = `${base}/data-pendaftar`;

  if (state.status !== "terkirim") {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <Link href={back} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-forest">
          <ArrowLeft size={15} />
          Kembali ke Data Pendaftar
        </Link>
        <div className={`${card} mt-4 p-8 text-center`}>
          <h1 className="text-[24px] font-semibold text-ink">{state.profile.nama}</h1>
          <p className="mt-1 text-[13px] text-ink/60">No. Registrasi: {noReg}</p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink/75">
            Calon siswa ini belum mengirim formulir pendaftaran, sehingga berkas belum dapat diverifikasi.
          </p>
        </div>
      </div>
    );
  }

  const { data: b, profile } = state;
  const r = hitungWajib(items);
  const persen = Math.round((r.diterima / r.total) * 100);
  const menunggu = JENIS_BERKAS.some((j) => items[j.kode]?.status === "menunggu");

  const status = r.semuaDiterima
    ? { t: "Terverifikasi", c: "bg-chip text-forest", dot: "bg-forest" }
    : r.perbaikan > 0 && !menunggu
      ? { t: "Menunggu Revisi Siswa", c: "bg-red-100 text-[#c00000]", dot: "bg-[#c00000]" }
      : { t: "Menunggu Verifikasi Administrasi", c: "bg-[#fff1b8] text-[#8a5a00]", dot: "bg-orange-500" };

  const rows: DocRow[] = JENIS_BERKAS.map((j) => {
    const it = items[j.kode];
    return {
      kode: j.kode,
      nama: j.nama,
      wajib: j.wajib,
      item: it
        ? {
            namaAsli: it.namaAsli,
            ukuran: it.ukuran,
            status: it.status,
            tanggal: tglPendek(it.uploadedAt),
          }
        : null,
    };
  });

  const catatanAwal =
    JENIS_BERKAS.map((j) => items[j.kode]).find((x) => x?.status === "perlu_perbaikan")?.catatan ?? "";

  const [rt, rw] = b.rt_rw.split("/").map((s) => s.trim());
  const alamat = `${b.alamat}, RT ${rt} / RW ${rw}, Kelurahan ${b.kelurahan}, Kecamatan ${b.kecamatan}, Kota Depok, Jawa Barat ${b.kode_pos}`;
  const prog = program ? PROGRAM_ADMIN[program] : null;
  const [first, ...rest] = profile.nama.split(" ");

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink/70">
        <Link href={back} className="inline-flex items-center gap-1.5 font-medium text-forest hover:underline">
          <ArrowLeft size={14} />
          Kembali ke Data Pendaftar
        </Link>
        <span className="text-ink/30">/</span>
        No. Registrasi: #{noReg}
      </p>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[600px]">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">
              Verifikasi Berkas &amp; Detail Pendaftaran
            </h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${status.c}`}>
              <span className={`size-1.5 rounded-full ${status.dot}`} />
              {status.t}
            </span>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink/75">
            Pemeriksaan keabsahan dokumen persyaratan dan validasi data pokok calon siswa untuk kelayakan pendaftaran tahap seleksi.
          </p>
        </div>

        <div className={`${card} flex items-center gap-4 px-4 py-3`}>
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-wash text-forest">
            <ShieldCheck size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-[10.5px] font-medium uppercase tracking-wide text-ink/60">
              Progres Berkas
            </span>
            <span className="block text-[20px] font-semibold text-ink">
              {r.diterima} / {r.total} <span className="text-[15px]">Disetujui</span>
            </span>
          </span>
          <span className="self-end text-[12px] text-ink/60">({persen}%)</span>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Kiri */}
        <div className="space-y-6">
          <section className={`${card} p-5 sm:p-6`}>
            <div className="flex gap-4">
              {items.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/berkas/file?jenis=foto&user=${id}`}
                  alt={`Pas foto ${profile.nama}`}
                  className="h-[96px] w-[80px] shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="inline-flex h-[96px] w-[80px] shrink-0 items-center justify-center rounded-lg bg-pastel text-[24px] font-bold text-forest">
                  {first[0]}
                </span>
              )}
              <div className="min-w-0">
                <span className="inline-block rounded bg-chip px-2 py-0.5 text-[10.5px] font-bold uppercase text-forest">
                  Reguler 2026/2027
                </span>
                <h2 className="mt-1 text-[24px] font-medium leading-tight text-ink">
                  {first}
                  {rest.length > 0 && (
                    <>
                      <br />
                      {rest.join(" ")}
                    </>
                  )}
                </h2>
                <p className="mt-1 font-mono text-[11.5px] text-ink/65">{profile.nik}</p>
                <p className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-forest">
                  <CircleCheck size={13} />
                  Terverifikasi Dukcapil Kota Depok
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-wash p-4">
              <div>
                <Label>Tempat, Tgl Lahir</Label>
                <p className="mt-1 text-[16px] font-medium leading-snug text-ink">
                  {b.tempat_lahir}, {formatTanggal(b.tanggal_lahir)}
                </p>
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <p className="mt-1 text-[16px] font-medium text-ink">{b.jenis_kelamin}</p>
                <p className="mt-0.5 text-[11.5px] text-ink/65">Kewarganegaraan: WNI</p>
              </div>
            </div>
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[18px] font-medium text-ink">
                <IdCard size={19} className="text-forest" />
                Informasi Kontak Calon Siswa
              </h3>
              <span className="rounded bg-pastel px-2 py-0.5 text-[11px] text-ink/70">Aktif</span>
            </div>

            <div className="mt-4 space-y-4">
              {[
                { icon: <MessageSquare size={17} />, label: "No. Handphone / WhatsApp", val: formatWa(b.whatsapp) },
                { icon: <Mail size={17} />, label: "Alamat Email", val: profile.email },
                { icon: <MapPin size={17} />, label: "Alamat Domisili Sesuai KK", val: alamat },
              ].map((x) => (
                <div key={x.label} className="flex gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-wash text-forest">
                    {x.icon}
                  </span>
                  <div className="min-w-0">
                    <Label>{x.label}</Label>
                    <p className="mt-0.5 break-words text-[15px] leading-snug text-ink">{x.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <h3 className="flex items-center gap-2 text-[18px] font-medium text-ink">
              <GraduationCap size={19} className="text-forest" />
              Data Sekolah &amp; Pilihan Jurusan
            </h3>

            <div className="mt-4 flex items-start justify-between gap-3 rounded-lg bg-wash p-4">
              <div className="min-w-0">
                <Label>Asal Sekolah (SMP/MTs)</Label>
                <p className="mt-1 text-[17px] font-medium text-ink">{b.nama_sekolah}</p>
                <p className="mt-0.5 text-[11.5px] text-ink/65">
                  NPSN: {b.npsn} • {b.status_sekolah}
                </p>
              </div>
              <div className="text-right">
                <Label>Tahun Lulus</Label>
                <p className="mt-1 text-[20px] font-semibold text-forest">{b.tahun_lulus}</p>
                {b.tahun_lulus === "2026" && (
                  <p className="text-[11.5px] font-medium text-forest">Lulusan Baru</p>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-nav p-4 text-white">
              <p className="text-[10.5px] font-medium uppercase tracking-wide text-white/80">
                Kompetensi Keahlian Dipilih (Pilihan 1)
              </p>
              {prog ? (
                <>
                  <p className="mt-1.5 text-[20px] font-semibold leading-snug">
                    {prog.singkat}{" "}
                    <span className="text-[15px] font-normal text-white/85">({prog.nama})</span>
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-white/85">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} />
                      Kuota Jurusan: {kuota ? kapasitasOf(kuota.rombel) : "-"} Siswa
                    </span>
                    <span>Jalur: Reguler</span>
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-[15px]">Belum memilih program keahlian.</p>
              )}
            </div>
          </section>

          <PaymentPanel
            userId={id}
            status={pay.status}
            nominal={formatRupiah(pay.jumlah)}
            bank={pay.bankPengirim}
            pengirim={pay.namaPengirim}
            waktu={waktu(pay.paidAt)}
            catatan={pay.catatan}
            adaBukti={pay.adaBukti}
          />
        </div>

        {/* Kanan */}
        <VerifikasiPanel
          userId={id}
          rows={rows}
          catatanAwal={catatanAwal}
          backHref={back}
          diaksesLabel={`Hari ini, ${jam()} WIB`}
        />
      </div>
    </div>
  );
}