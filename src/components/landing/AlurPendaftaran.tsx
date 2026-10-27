import {
  Clock,
  CloudUpload,
  ClipboardList,
  ContactRound,
  FileText,
  ListX,
  Medal,
  ShieldCheck,
  Timer,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  {
    no: "01",
    icon: UserPlus,
    title: "Registrasi Akun",
    desc: "Buat akun calon siswa baru dengan memasukkan NISN aktif, alamat email yang valid, nomor WhatsApp aktif, dan kata sandi login portal.",
    metaIcon: Clock,
    meta: "Estimasi: 3 Menit",
  },
  {
    no: "02",
    icon: ContactRound,
    title: "Lengkapi Biodata",
    desc: "Isi formulir online secara rinci mencakup identitas calon siswa, data orang tua/wali murid, asal sekolah SMP/MTs, dan pilihan kompetensi keahlian.",
    metaIcon: Clock,
    meta: "Estimasi: 10 Menit",
  },
  {
    no: "03",
    icon: CloudUpload,
    title: "Upload Berkas",
    desc: "Unggah pindaian digital berkas persyaratan: Kartu Keluarga, Akta Kelahiran, Rapor Semester 1–5, Ijazah/SKL, dan Pas Foto terbaru ukuran 3x4.",
    metaIcon: FileText,
    meta: "Format: PDF / JPG Max 2MB",
  },
  {
    no: "04",
    icon: ListX,
    title: "Verifikasi Berkas",
    desc: "Panitia seleksi SPMB memvalidasi keaslian dan kelengkapan dokumen. Calon siswa menerima notifikasi berkas diterima atau perlu perbaikan.",
    metaIcon: ShieldCheck,
    meta: "Proses: 1x24 Jam Kerja",
  },
  {
    no: "05",
    icon: ClipboardList,
    title: "Tes Seleksi Online",
    desc: "Mengikuti ujian CBT akademik dan tes pemetaan bakat minat kejuruan secara daring melalui aplikasi ujian terintegrasi portal SPMB.",
    metaIcon: Timer,
    meta: "Durasi: 60 Menit CBT",
  },
  {
    no: "06",
    icon: Medal,
    title: "Pengumuman & Daftar Ulang",
    desc: "Unduh Surat Keputusan Penerimaan resmi berbarcode, selesaikan administrasi daftar ulang, dan dapatkan jadwal orientasi siswa baru (MPLS).",
    metaIcon: UserCheck,
    meta: "Resmi Menjadi Siswa Baru",
  },
];

export default function AlurPendaftaran() {
  return (
    <section id="alur" className="scroll-mt-24 bg-white py-20">
      <Container>
        <Reveal>
          <SectionHeading
            label="PROSEDUR SPMB"
            title="Alur Pendaftaran SPMB"
            subtitle="6 Langkah mudah untuk bergabung bersama keluarga besar SMK Citra Negara Depok"
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(({ no, icon: Icon, title, desc, metaIcon: MetaIcon, meta }, i) => (
            <Reveal key={no} delay={(i % 3) * 110} className="h-full">
              <div className="lift flex h-full flex-col rounded-2xl border border-brand-100 bg-brand-50/70 p-7">
                <div className="flex items-start justify-between">
                  <span className="text-[52px] font-medium leading-none text-soft">
                    {no}
                  </span>
                  <Icon size={20} className="text-ink/70" />
                </div>
                <h3 className="mt-5 text-[18px] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {desc}
                </p>
                <div className="mt-auto pt-6">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-[12px] font-semibold text-ink/80">
                    <MetaIcon size={14} className="text-brand-600" />
                    {meta}
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