import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Contact,
  GraduationCap,
  Headset,
  Info,
  MapPin,
  MessageSquareText,
  Pencil,
} from "lucide-react";
import ReviewActions from "@/components/dashboard/ReviewActions";
import { requireRole } from "@/lib/auth";
import { getBiodataState } from "@/lib/biodata";
import { formatTanggal, formatWa } from "@/lib/biodata-schema";
import { getProgramKode } from "@/lib/program";

export const metadata = { title: "Pratinjau Biodata | SMK Citra Negara" };

const base = "/dashboard/calon-siswa";
const card = "overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

function Badge({ children, lime }: { children: React.ReactNode; lime?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        lime ? "bg-chip text-forest" : "bg-pastel text-ink/70"
      }`}
    >
      {lime && <span className="size-1.5 rounded-full bg-forest" />}
      {children}
    </span>
  );
}

function Row({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink/70">{label}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[17px] font-medium text-ink">
        {children}
        {badge}
      </p>
    </div>
  );
}

function Section({
  icon,
  title,
  editLabel,
  editHref,
  locked,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  editLabel: string;
  editHref: string;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3 bg-wash px-5 py-3.5">
        <h2 className="flex items-center gap-3 text-[17px] font-semibold text-ink">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white text-forest">
            {icon}
          </span>
          {title}
        </h2>
        {!locked && (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest hover:underline print:hidden"
          >
            <Pencil size={13} />
            {editLabel}
          </Link>
        )}
      </div>
      <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function ReviewPage() {
  const session = await requireRole("calon_siswa");
  const state = await getBiodataState(session.id);

  if (!state || state.stepSelesai < 3) {
    redirect(`${base}/biodata?step=${Math.min((state?.stepSelesai ?? 0) + 1, 3)}`);
  }

  // Program keahlian harus dipilih sebelum formulir dikirim.
  if (state.status !== "terkirim" && !(await getProgramKode(session.id))) {
    redirect(`${base}/program`);
  }

  const { data: d, profile } = state;
  const locked = state.status === "terkirim";
  const [rt, rw] = d.rt_rw.split("/").map((s) => s.trim());

  const steps = [
    { t: "Tahap 1", n: "Data Pribadi", s: "Selesai" },
    { t: "Tahap 2", n: "Kontak & Alamat", s: "Selesai" },
    { t: "Tahap 3", n: "Data Sekolah & Wali", s: "Selesai" },
    { t: "Tahap 4 (Final)", n: "Konfirmasi & Simpan", s: "Tinjau Data Akhir" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink/80">
        <span className="size-1.5 rounded-full bg-forest" />
        Langkah Final • Konfirmasi Data Biodata
      </span>
      <h1 className="mt-3 text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
        Pratinjau &amp; Konfirmasi Seluruh Biodata Pendaftaran
      </h1>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-ink/75">
        Periksa kembali kelengkapan dan kebenaran data pribadi, kontak, alamat domisili, riwayat sekolah asal, serta data orang tua/wali sebelum disimpan permanen.
      </p>

      {/* Stepper final */}
      <div className={`${card} mt-6 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4`}>
        {steps.map((s, i) => (
          <div key={s.t} className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest text-white">
              {i === 3 ? <BadgeCheck size={19} /> : <Check size={19} strokeWidth={3} />}
            </span>
            <span className="leading-tight">
              <span className="block text-[11.5px] text-ink/70">{s.t}</span>
              <span className="block text-[16px] font-semibold text-ink">{s.n}</span>
              <span className="block text-[11.5px] font-medium text-forest">
                {i < 3 ? "● " : ""}
                {s.s}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 flex gap-3 rounded-xl bg-wash px-5 py-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-forest">
          <Info size={19} />
        </span>
        <div>
          <p className="text-[16px] font-semibold text-forest">
            Informasi Penting Sebelum Penguncian Data
          </p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/75">
            Data biodata yang telah disimpan akan dikunci untuk pencetakan Formulir Bukti Pendaftaran Resmi dan verifikasi berkas panitia. Anda masih dapat mengajukan perbaikan melalui loket Helpdesk SPMB jika terdapat kekeliruan data setelah proses finalisasi.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <Section
          icon={<Contact size={18} />}
          title="1. Data Pribadi Calon Siswa"
          editLabel="Ubah Data Pribadi"
          editHref={`${base}/biodata?step=1`}
          locked={locked}
        >
          <Row label="Nama Lengkap Sesuai Akta / Ijazah">{profile.nama}</Row>
          <Row label="Nomor Induk Kependudukan (NIK)" badge={<Badge lime>Terverifikasi Dukcapil</Badge>}>
            {profile.nik}
          </Row>
          <Row label="Tempat, Tanggal Lahir">
            {d.tempat_lahir}, {formatTanggal(d.tanggal_lahir)}
          </Row>
          <Row label="Jenis Kelamin">{d.jenis_kelamin}</Row>
          <Row label="Agama">{d.agama}</Row>
          <Row label="Kewarganegaraan">Warga Negara Indonesia (WNI)</Row>
        </Section>

        <Section
          icon={<MapPin size={18} />}
          title="2. Kontak & Alamat Domisili"
          editLabel="Ubah Kontak & Alamat"
          editHref={`${base}/biodata?step=2`}
          locked={locked}
        >
          <Row label="Nomor WhatsApp Calon Siswa" badge={<Badge lime>Terverifikasi OTP</Badge>}>
            {formatWa(d.whatsapp)}
          </Row>
          <Row label="Alamat Email Aktif" badge={<Badge>Google SSO</Badge>}>
            {profile.email}
          </Row>
          <Row label="Alamat Tempat Tinggal Lengkap">
            <span className="text-[15px]">{d.alamat}</span>
          </Row>
          <div className="hidden sm:block" />
          <Row label="RT / RW">
            RT {rt} / RW {rw}
          </Row>
          <Row label="Kelurahan / Desa">{d.kelurahan}</Row>
          <Row label="Kecamatan">{d.kecamatan}</Row>
          <Row label="Kota / Kabupaten">Kota Depok</Row>
          <Row label="Provinsi & Kode Pos">Jawa Barat ({d.kode_pos})</Row>
          <Row label="Status Kepemilikan">
            {d.status_tinggal === "Bersama Orang Tua" ? "Tinggal Bersama Orang Tua" : d.status_tinggal}
          </Row>
        </Section>

        <Section
          icon={<GraduationCap size={18} />}
          title="3. Asal Sekolah & Orang Tua / Wali"
          editLabel="Ubah Data Sekolah & Wali"
          editHref={`${base}/biodata?step=3`}
          locked={locked}
        >
          <Row label="NPSN Sekolah Asal">{d.npsn}</Row>
          <Row label="Nama Asal Sekolah" badge={<Badge>{d.status_sekolah}</Badge>}>
            {d.nama_sekolah}
          </Row>
          <Row label="Nomor Induk Siswa Nasional (NISN)" badge={<Badge lime>Tercatat di Dapodik</Badge>}>
            {d.nisn}
          </Row>
          <Row label="Tahun Kelulusan">
            {d.tahun_lulus}
            {d.tahun_lulus === "2026" && (
              <span className="text-[12px] font-normal text-ink/70">(Lulusan Tahun Ini)</span>
            )}
          </Row>
          <Row label="Nama Lengkap Ayah / Wali">{d.nama_ayah}</Row>
          <Row label="Pekerjaan Ayah / Wali">{d.pekerjaan_ayah}</Row>
          <Row label="Nama Lengkap Ibu Kandung">{d.nama_ibu}</Row>
          <Row label="Nomor WhatsApp Orang Tua / Wali" badge={<Badge lime>Notifikasi Seleksi Aktif</Badge>}>
            {formatWa(d.whatsapp_ortu)}
          </Row>
        </Section>
      </div>

      <ReviewActions locked={locked} />

      <div className={`${card} mt-6 flex flex-wrap items-center gap-3 px-4 py-3 text-[13px] text-ink/80`}>
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-wash text-forest">
          <Headset size={18} />
        </span>
        <span className="flex-1">
          Butuh bantuan pengisian atau koreksi data berkas? Hubungi Sekretariat Panitia SPMB SMK Citra Negara.
        </span>
        <a
          href="https://wa.me/6281123456789"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-forest"
        >
          <MessageSquareText size={15} />
          WhatsApp Helpdesk: 0811-2345-6789
        </a>
      </div>
    </div>
  );
}