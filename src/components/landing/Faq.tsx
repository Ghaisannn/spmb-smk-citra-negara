"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const faqs = [
  {
    q: "Bagaimana cara membuat akun dan mendaftar di SPMB SMK Citra Negara?",
    a: "Klik tombol 'Daftar Sekarang' pada bagian atas halaman, lengkapi formulir akun dengan NISN aktif, alamat email, dan nomor WhatsApp. Setelah menerima email verifikasi, login ke dalam portal peserta untuk melengkapi profil data diri, data orang tua, riwayat sekolah asal, serta mengunggah berkas syarat pendaftaran.",
  },
  {
    q: "Apa saja dokumen yang wajib diunggah pada tahap awal?",
    a: "Dokumen wajib yang perlu disiapkan dalam format JPG/PDF (maksimal 2MB per file) adalah: Kartu Keluarga (KK), Akta Kelahiran, Rapor semester 1 hingga 5, Pas Foto berlatar belakang merah/biru, dan Ijazah atau Surat Keterangan Lulus (SKL) bagi yang telah diterbitkan oleh pihak SMP/MTs.",
  },
  {
    q: "Kapan dan bagaimana pelaksanaan tes seleksi online (CBT)?",
    a: "Tes Computer Based Test (CBT) dilaksanakan sesuai jadwal gelombang pendaftaran secara daring dari perangkat masing-masing (laptop atau smartphone yang memiliki kamera). Link dan token ujian akan dikirimkan otomatis di portal akun calon murid setelah dinyatakan terverifikasi oleh panitia.",
  },
  {
    q: "Bagaimana cara melihat hasil kelulusan dan mendapatkan surat seleksi resmi?",
    a: "Hasil kelulusan akan diumumkan serentak pada tanggal 22 Maret 2026 pukul 09.00 WIB langsung melalui dashboard akun peserta. Calon siswa yang dinyatakan diterima dapat langsung mengunduh Surat Keputusan (SK) Penerimaan resmi yang dilengkapi tanda tangan elektronik dan QR Code verifikasi.",
  },
];

export default function Faq() {
  // Di desain semua item terbuka, jadi default-nya semua terbuka
  const [openItems, setOpenItems] = useState<number[]>([0, 1, 2, 3]);

  const toggle = (i: number) =>
    setOpenItems((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20">
      <Container>
        <SectionHeading
          label="PUSAT BANTUAN"
          title="Pertanyaan yang Sering Diajukan"
          subtitle="Temukan jawaban cepat seputar tata cara pendaftaran dan sistem seleksi online SPMB"
        />

        <div className="mx-auto mt-12 max-w-[940px] space-y-4">
          {faqs.map(({ q, a }, i) => {
            const isOpen = openItems.includes(i);
            return (
              <div
                key={q}
                className="rounded-2xl border border-brand-100 bg-brand-50/80"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-bold leading-snug text-ink">
                    {q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-ink/70 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[13px] leading-relaxed text-muted">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}