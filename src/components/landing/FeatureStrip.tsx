import { ArrowRight, FileCheck2, Laptop, MailCheck, MonitorSmartphone } from "lucide-react";
import Container from "@/components/ui/Container";

const features = [
  {
    icon: MonitorSmartphone,
    title: "Pendaftaran 100% Online",
    desc: "Daftar kapan saja dan di mana saja tanpa perlu antre di sekolah. Seluruh alur dapat diakses melalui gawai Anda.",
    link: "Sistem Otomatis",
  },
  {
    icon: FileCheck2,
    title: "Verifikasi Berkas Cepat",
    desc: "Sistem validasi dokumen digital yang transparan dan real-time. Status berkas langsung terkonfirmasi oleh panitia.",
    link: "Tracking Dokumen",
  },
  {
    icon: Laptop,
    title: "Tes Berbasis Komputer (CBT)",
    desc: "Ujian tes online adaptif dan objektif yang mengukur potensi akademik serta kesesuaian minat kejuruan calon murid.",
    link: "Hasil Terukur",
  },
  {
    icon: MailCheck,
    title: "Pengumuman Digital Real-Time",
    desc: "Akses surat hasil kelulusan resmi berkode QR langsung dari portal peserta pendaftaran secara instan dan akurat.",
    link: "Unduh Surat Resmi",
  },
];

export default function FeatureStrip() {
  return (
    <section id="tentang" className="scroll-mt-24 bg-brand-50 py-14">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, link }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-brand-100 bg-white p-7 shadow-[0_2px_12px_rgba(20,114,57,0.04)]"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-muted">
                <Icon size={20} />
              </span>
              <h3 className="mt-6 text-[16px] font-bold leading-snug text-ink">
                {title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {desc}
              </p>
              <a
                href="#alur"
                className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[12px] font-bold text-brand-700"
              >
                {link}
                <ArrowRight size={13} />
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}