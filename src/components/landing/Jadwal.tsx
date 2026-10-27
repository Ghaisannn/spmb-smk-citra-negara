import { CalendarCheck, ClipboardCheck, Megaphone, MonitorCheck } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const schedule = [
  {
    icon: CalendarCheck,
    status: "Sedang Aktif",
    active: true,
    title: "Pendaftaran Dibuka",
    desc: "Pengisian formulir online, pembuatan akun siswa, dan penyerahan pindaian berkas persyaratan.",
    date: "01 Januari – 28 Februari 2026",
  },
  {
    icon: ClipboardCheck,
    status: "Akan Datang",
    active: false,
    title: "Verifikasi Berkas",
    desc: "Pemeriksaan menyeluruh keabsahan berkas oleh tim panitia SPMB dan penerbitan kartu tes CBT.",
    date: "01 Maret – 10 Maret 2026",
  },
  {
    icon: MonitorCheck,
    status: "Akan Datang",
    active: false,
    title: "Ujian Tes Seleksi (CBT)",
    desc: "Pelaksanaan Computer Based Test meliputi Matematika Dasar, Bhs. Inggris, & Peminatan.",
    date: "15 Maret – 17 Maret 2026",
  },
  {
    icon: Megaphone,
    status: "Akan Datang",
    active: false,
    title: "Pengumuman Kelulusan",
    desc: "Publikasi Surat Keputusan Penerimaan resmi kelulusan di portal peserta serta jadwal resmi daftar ulang.",
    date: "22 Maret 2026 (Pukul 09.00 WIB)",
  },
];

export default function Jadwal() {
  return (
    <section id="jadwal" className="scroll-mt-24 bg-brand-50 py-16">
      <Container>
        <Reveal>
          <SectionHeading
            label="AGENDA SELEKSI"
            title="Jadwal SPMB 2026/2027"
            subtitle="Catat tanggal penting seluruh rangkaian seleksi penerimaan murid baru Gelombang 1"
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {schedule.map(({ icon: Icon, status, active, title, desc, date }, i) => (
            <Reveal key={title} delay={i * 90} className="h-full">
              <div
                className={`lift flex h-full flex-col rounded-2xl p-5 ${
                  active
                    ? "border-t-[3px] border-brand-600 bg-white shadow-[0_8px_24px_rgba(20,114,57,0.10)]"
                    : "border border-brand-100 bg-white/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  {active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">
                      <span className="size-1.5 rounded-full bg-white" />
                      {status}
                    </span>
                  ) : (
                    <span className="rounded-md bg-brand-100/70 px-2.5 py-1 text-[11px] font-semibold text-muted">
                      {status}
                    </span>
                  )}
                  <Icon
                    size={18}
                    className={active ? "text-brand-700" : "text-muted"}
                  />
                </div>

                <h3 className="mt-5 text-[17px] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {desc}
                </p>

                <div className="mt-auto pt-5">
                  <div
                    className={`rounded-lg px-3 py-2.5 text-[11.5px] font-bold ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "bg-brand-50 text-ink/70"
                    }`}
                  >
                    {date}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}