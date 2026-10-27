import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CirclePlay,
  GraduationCap,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";

const stats = [
  { icon: BadgeCheck, value: "Akreditasi A", caption: "Predikat Unggul BAN-SM" },
  { icon: Briefcase, value: "95% Lulusan", caption: "Terserap Industri Global" },
  { icon: GraduationCap, value: "6 Program", caption: "Keahlian Unggulan" },
];

export default function Hero() {
  return (
    <section id="beranda" className="scroll-mt-24 bg-white">
      <Container>
        <div className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_1fr] lg:py-16">
          <div>
            <Reveal>
              <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[52px] lg:text-[58px]">
                Mulai Langkahmu Bersama{" "}
                <span className="block text-brand-600">SMK Citra Negara</span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 max-w-[600px] text-[17px] leading-relaxed text-muted">
                Daftarkan dirimu melalui SPMB SMK Citra Negara dan raih kesempatan
                untuk menjadi bagian dari generasi unggul, kompeten, dan siap
                kerja di industri global.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link
                  href="/portal"
                  className="inline-flex h-[54px] items-center gap-2 rounded-xl bg-brand-600 px-7 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
                >
                  Daftar Sekarang
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#alur"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink transition hover:text-brand-600"
                >
                  <CirclePlay size={18} />
                  Lihat Alur Pendaftaran
                </a>
              </div>
            </Reveal>

            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map(({ icon: Icon, value, caption }, i) => (
                <Reveal key={value} delay={360 + i * 100}>
                  <div className="flex items-center gap-1.5 text-[16px] font-bold text-brand-700">
                    <Icon size={16} />
                    {value}
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{caption}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal from="right" delay={200} className="relative mx-auto w-full max-w-[640px]">
            <Image
              src="/images/hero/hero-siswa.png"
              alt="Siswa-siswi SMK Citra Negara"
              width={760}
              height={620}
              priority
              className="h-auto w-full"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}