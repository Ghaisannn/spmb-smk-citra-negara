import Image from "next/image";
import { ArrowRight, BedDouble, Code, Files, Monitor, PenTool, Store } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const programs = [
  {
    icon: Monitor,
    name: "TJKT",
    desc: "Komputer, server, dan konektivitas",
    image: "/images/program/tjkt.jpg",
  },
  {
    icon: PenTool,
    name: "DKV",
    desc: "Visual branding dan multimedia",
    image: "/images/program/dkv.jpg",
  },
  {
    icon: Files,
    name: "MPLB",
    desc: "Administrasi kantor yang terstruktur",
    image: "/images/program/mplb.jpg",
  },
  {
    icon: Code,
    name: "PPLG",
    desc: "Pemrograman dan software modern",
    image: "/images/program/pplg.jpg",
  },
  {
    icon: BedDouble,
    name: "Perhotelan",
    desc: "Etika layanan dan kesiapan industri",
    image: "/images/program/perhotelan.jpg",
  },
  {
    icon: Store,
    name: "Pemasaran",
    desc: "Strategi promosi dan layanan pelanggan",
    image: "/images/program/pemasaran.jpg",
  },
];

export default function ProgramKeahlian() {
  return (
    <section id="jurusan" className="scroll-mt-24 bg-white py-20">
      <Container>
        <Reveal>
          <SectionHeading
            label="VOKASI MASA DEPAN"
            title="Pilihan Program Keahlian"
            subtitle="Kurikulum berbasis industri dengan sertifikasi kompetensi nasional BNSP dan mitra korporat global"
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs.map(({ icon: Icon, name, desc, image }, i) => (
            <Reveal key={name} delay={(i % 3) * 110}>
              <article className="group relative aspect-[432/470] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-200 to-brand-600 shadow-md">
                <Image
                  src={image}
                  alt={`Program keahlian ${name}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-4 top-4 inline-flex size-9 items-center justify-center rounded-xl border border-white/40 bg-white/25 text-white backdrop-blur-md">
                  <Icon size={16} />
                </span>

                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-white/25 p-4 text-white shadow-lg backdrop-blur-xl">
                  <h3 className="text-[22px] font-bold leading-none">{name}</h3>
                  <div className="my-3 h-px bg-white/50" />
                  <p className="text-[13px] text-white/90">{desc}</p>
                  <a
                    href="#"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white"
                  >
                    Selengkapnya
                    <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}