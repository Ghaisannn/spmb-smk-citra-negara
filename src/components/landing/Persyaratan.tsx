import {
  BookOpen,
  Contact,
  Download,
  Landmark,
  ScrollText,
  Trophy,
  Users,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const docs = [
  {
    icon: Users,
    title: "Kartu Keluarga (KK)",
    badge: "Wajib",
    desc: "Scan atau foto jelas KK asli atau fotokopi yang telah dilegalisir basah oleh instansi berwenang.",
  },
  {
    icon: Landmark,
    title: "Akta Kelahiran",
    badge: "Wajib",
    desc: "Pindaian Akta Kelahiran resmi calon peserta didik yang diterbitkan oleh Dinas Dukcapil.",
  },
  {
    icon: ScrollText,
    title: "Ijazah / SKL SMP/MTs",
    badge: "Wajib",
    desc: "Scan ijazah asli atau Surat Keterangan Lulus (SKL) resmi bercap basah dari pihak sekolah asal.",
  },
  {
    icon: Contact,
    title: "Pas Foto 3x4",
    badge: "Wajib",
    desc: "Pas foto resmi terbaru dengan seragam SMP/MTs berlatar belakang merah atau biru kontras.",
  },
  {
    icon: BookOpen,
    title: "Rapor Semester 1–5",
    badge: "Wajib",
    desc: "Nilai pengetahuan rapor semester 1 sampai dengan 5 yang telah dilegalisasi oleh kepala sekolah asal.",
  },
  {
    icon: Trophy,
    title: "Piagam Prestasi",
    badge: "Opsional",
    desc: "Sertifikat/piagam kejuaraan akademik, olahraga, seni, atau tahfidz minimal tingkat kota/kabupaten.",
  },
];

export default function Persyaratan() {
  return (
    <section id="persyaratan" className="scroll-mt-24 bg-brand-50 py-16">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              align="left"
              label="DOKUMEN PERSYARATAN"
              title="Persyaratan Pendaftaran"
              subtitle="Siapkan dokumen-dokumen berikut sebelum mengisi formulir digital SPMB"
            />
            <a
              href="#"
              className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl border border-brand-100 bg-white px-5 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-100 md:self-auto"
            >
              <Download size={15} />
              Download Format Berkas PDF
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {docs.map(({ icon: Icon, title, badge, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 110} className="h-full">
              <div className="lift flex h-full gap-4 rounded-2xl border border-brand-100 bg-white p-5">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-bold leading-snug text-ink">
                      {title}
                    </h3>
                    <span
                      className={`shrink-0 text-[11px] font-semibold ${
                        badge === "Wajib" ? "text-brand-700" : "text-muted"
                      }`}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                    {desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}