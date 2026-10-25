export type Post = {
  id: string;
  featured?: boolean;
  kategori: string;
  tone: "urgent" | "green" | "gray";
  tanggal: string;
  waktu?: string;
  metaKanan?: { icon: "clock" | "cbt" | "id" | "megaphone"; teks: string };
  judul: string;
  // Tulis [[teks]] untuk menyorot teks dengan warna hijau.
  isi: string;
  file?: { nama: string; info: string; href: string };
  tags: string[];
  dilihat?: number;
  aksi?: {
    label: string;
    href: string;
    icon: "down" | "right" | "download" | "file";
    gaya: "tombol" | "link";
  }[];
};

export const POSTS: Post[] = [
  {
    id: "surat-edaran",
    featured: true,
    kategori: "PENTING & TERBARU",
    tone: "urgent",
    tanggal: "12 April 2026",
    metaKanan: { icon: "clock", teks: "Dipublikasikan 09:00 WIB" },
    judul:
      "Surat Edaran Pengumuman Hasil Seleksi Gelombang 1 & Prosedur Daftar Ulang Siswa Baru T.A. 2026/2027",
    isi: "Berdasarkan hasil rapat pleno panitia SPMB bersama Kepala Sekolah, pengumuman kelulusan seleksi gelombang 1 resmi diterbitkan. Calon siswa yang dinyatakan lolos diharapkan segera melakukan proses verifikasi fisik serta daftar ulang berkas administrasi pada tanggal [[14 - 18 April 2026]] di kampus SMK Citra Negara.",
    file: {
      nama: "Surat-Edaran-Kelulusan-Gel1-2026.pdf",
      info: "Dokumen Resmi Kepsek • 1.8 MB",
      href: "/files/Surat-Edaran-Kelulusan-Gel1-2026.pdf",
    },
    tags: ["#Pengumuman Kelulusan", "#Daftar Ulang", "#Gelombang 1"],
    dilihat: 1284,
  },
  {
    id: "panduan-cbt",
    kategori: "Akademik & Seleksi",
    tone: "green",
    tanggal: "5 April 2026",
    metaKanan: { icon: "cbt", teks: "Ujian CBT" },
    judul: "Jadwal dan Panduan Teknis Pelaksanaan Ujian CBT & Tes Minat Bakat Gelombang 1",
    isi: "Petunjuk komprehensif tata tertib pelaksanaan tes berbasis komputer (CBT) serta assessment minat bakat jurusan. Berisi panduan login aplikasi, ketentuan browser, dan tata cara pengerjaan soal secara mandiri.",
    tags: ["Panduan PDF (840 KB)", "Ujian Daring"],
    aksi: [
      { label: "Lihat Rincian Sesi", href: "/dashboard/calon-siswa/jadwal", icon: "down", gaya: "link" },
      { label: "Unduh Panduan", href: "/files/panduan-teknis-cbt.pdf", icon: "download", gaya: "tombol" },
    ],
  },
  {
    id: "verifikasi-berkas",
    kategori: "Berkas & Daftar Ulang",
    tone: "gray",
    tanggal: "28 Maret 2026",
    metaKanan: { icon: "id", teks: "Validasi Dukcapil" },
    judul: "Verifikasi Berkas Dokumen Persyaratan & Validasi NIK Pendaftar",
    isi: "Pemberitahuan penting bagi calon siswa yang unggahan Kartu Keluarga (KK) dan Akta Kelahiran belum terbaca jelas oleh tim validator. Segera perbarui scan dokumen melalui menu Berkas Pendaftaran sebelum batas waktu verifikasi.",
    tags: ["Perbaikan Berkas", "Admin Verifikator"],
    aksi: [
      { label: "Instruksi Unggah Ulang", href: "/dashboard/calon-siswa/berkas", icon: "right", gaya: "link" },
    ],
  },
  {
    id: "pembukaan",
    kategori: "Informasi Umum",
    tone: "green",
    tanggal: "1 Februari 2026",
    metaKanan: { icon: "megaphone", teks: "Pembukaan Jalur" },
    judul: "Pembukaan Pendaftaran Murid Baru Jalur Reguler & Prestasi Gelombang 1",
    isi: "SMK Citra Negara secara resmi membuka pendaftaran peserta didik baru 2026/2027. Tersedia 6 konsentrasi kejuruan unggulan berbasis industri serta program beasiswa prestasi bagi pendaftar terbaik.",
    tags: ["Kuota Terbatas", "Brosur SPMB 2026"],
    aksi: [
      { label: "Unduh Brosur", href: "/files/brosur-spmb-2026.pdf", icon: "file", gaya: "tombol" },
    ],
  },
];

// Jawaban FAQ masih contoh. Konfirmasi isinya ke panitia.
export const FAQ = [
  {
    q: "Kapan batas akhir daftar ulang Gelombang 1?",
    a: "Daftar ulang dan verifikasi fisik berkas dilakukan pada 14 - 18 April 2026 pukul 08.00 - 15.00 WIB di loket panitia SPMB.",
  },
  {
    q: "Bagaimana jika berkas verifikasi ditolak?",
    a: "Anda akan menerima pemberitahuan beserta alasannya. Unggah ulang berkas yang benar melalui menu Berkas Pendaftaran sebelum batas waktu verifikasi.",
  },
  {
    q: "Bisakah pindah pilihan program keahlian?",
    a: "Pilihan program dapat diubah selama formulir belum dikirim. Setelah dikirim, perubahan hanya dapat diajukan melalui panitia.",
  },
  {
    q: "Apakah biaya formulir dapat dikembalikan?",
    a: "Biaya pendaftaran yang sudah diverifikasi tidak dapat dikembalikan. Hubungi panitia jika terjadi kelebihan transfer.",
  },
];