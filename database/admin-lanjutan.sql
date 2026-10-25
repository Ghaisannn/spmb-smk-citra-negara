USE spmb_smk_citra_negara;

/* ===== 1. JADWAL TES ===== */
CREATE TABLE IF NOT EXISTS jadwal_tes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  gelombang TINYINT NOT NULL DEFAULT 1,
  tanggal DATE NOT NULL,
  mulai TIME NOT NULL,
  selesai TIME NOT NULL,
  lokasi VARCHAR(100) NOT NULL,
  kuota INT NOT NULL DEFAULT 80,
  terisi INT NOT NULL DEFAULT 0,
  pengawas VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO jadwal_tes (nama, gelombang, tanggal, mulai, selesai, lokasi, kuota, terisi, pengawas)
SELECT * FROM (
  SELECT 'Tes CBT Potensi Akademik & Minat Bakat (Sesi 1)' AS nama, 1 AS gelombang, '2026-04-08' AS tanggal, '08:00' AS mulai, '10:00' AS selesai, 'Lab Komputer (Gedung D Lt. 2)' AS lokasi, 80 AS kuota, 80 AS terisi, NULL AS pengawas
  UNION ALL SELECT 'Tes CBT Potensi Akademik & Minat Bakat (Sesi 2)', 1, '2026-04-08', '10:30', '12:30', 'Lab Komputer (Gedung B Lt. 2)', 80, 75, NULL
  UNION ALL SELECT 'Tes Wawancara Minat Bakat & Verifikasi Fisik', 1, '2026-04-09', '08:30', '14:00', 'Aula Pertemuan Utama SMK Citra Negara', 130, 130, NULL
  UNION ALL SELECT 'Tes CBT & Wawancara Pendaftar Gelombang 2', 2, '2026-05-16', '08:30', '12:00', 'Lab Komputer Multimedia', 100, 0, NULL
) x WHERE NOT EXISTS (SELECT 1 FROM jadwal_tes);

/* ===== 2. BANK SOAL ===== */
CREATE TABLE IF NOT EXISTS bank_soal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(12) NOT NULL UNIQUE,
  kategori VARCHAR(20) NOT NULL,
  topik VARCHAR(60) NOT NULL,
  tipe VARCHAR(10) NOT NULL DEFAULT 'pg',
  kesulitan ENUM('mudah','sedang','sulit') NOT NULL DEFAULT 'sedang',
  status ENUM('aktif','revisi') NOT NULL DEFAULT 'aktif',
  teks TEXT NOT NULL,
  opsi_a VARCHAR(255) NOT NULL,
  opsi_b VARCHAR(255) NOT NULL,
  opsi_c VARCHAR(255) NOT NULL,
  opsi_d VARCHAR(255) NOT NULL,
  opsi_e VARCHAR(255) NOT NULL,
  kunci CHAR(1) NOT NULL,
  bobot DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO bank_soal
  (kode, kategori, topik, kesulitan, teks, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci) VALUES
('MTH-01','matematika','Aljabar & Aritmatika','sedang',
 'Sebuah toko pakaian memberikan diskon bertingkat sebesar 20%, kemudian mendapatkan potongan tambahan lagi sebesar 10% dari harga setelah diskon pertama. Berapakah persentase diskon total yang sebenarnya didapatkan oleh pembeli?',
 '30%','28%','25%','18%','22%','B'),
('MTH-02','matematika','Persamaan Kuadrat','mudah',
 'Jika nilai x = 5 dan y = 3, maka nilai dari x^2 + 2xy - y^2 adalah ...',
 '40','46','52','34','49','B'),
('MTH-03','matematika','Geometri Ruang','sulit',
 'Sebuah kubus memiliki volume 216 cm3. Luas permukaan kubus tersebut adalah ...',
 '144 cm2','196 cm2','216 cm2','256 cm2','324 cm2','C'),
('MTH-04','matematika','Barisan & Deret','sedang',
 'Panitia ujian SPMB menyusun kursi dengan pola barisan 3, 7, 11, 15, ... Suku ke-10 dari barisan tersebut adalah ...',
 '35','37','39','41','43','C'),
('MTH-05','matematika','Statistika Deskriptif','sedang',
 'Rata-rata nilai tes 5 siswa adalah 80. Jika satu siswa bernilai 70 keluar dan seorang siswa baru bernilai 90 bergabung, rata-rata nilai yang baru adalah ...',
 '82','83','84','85','86','C');

/* ===== 3. HASIL SELEKSI (ubah tabel seleksi, jalankan SEKALI) ===== */
ALTER TABLE seleksi
  MODIFY hasil ENUM('belum','diterima','cadangan','tidak_diterima') NOT NULL DEFAULT 'belum',
  MODIFY skor DECIMAL(5,2) NULL,
  ADD COLUMN nilai_cbt DECIMAL(5,2) NULL,
  ADD COLUMN nilai_wawancara DECIMAL(5,2) NULL,
  ADD COLUMN jalur VARCHAR(30) NOT NULL DEFAULT 'Reguler',
  ADD COLUMN catatan VARCHAR(150) NULL,
  ADD COLUMN dipublikasi TINYINT(1) NOT NULL DEFAULT 0;

UPDATE seleksi SET dipublikasi = 1 WHERE hasil <> 'belum';

/* ===== 4. PENGUMUMAN ===== */
CREATE TABLE IF NOT EXISTS pengumuman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(150) NOT NULL,
  kategori VARCHAR(40) NOT NULL,
  target VARCHAR(80) NOT NULL DEFAULT 'Semua Pendaftar',
  tanggal DATE NOT NULL,
  status ENUM('dipublikasi','draft') NOT NULL DEFAULT 'draft',
  prioritas TINYINT(1) NOT NULL DEFAULT 0,
  isi TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO pengumuman (judul, kategori, target, tanggal, status, prioritas, isi)
SELECT * FROM (
  SELECT 'Jadwal dan Panduan Teknis Ujian CBT Gelombang 1' AS judul, 'Akademik & Seleksi' AS kategori, 'Semua Pendaftar Gelombang 1' AS target, '2026-03-22' AS tanggal, 'dipublikasi' AS status, 1 AS prioritas,
    'Diberitahukan kepada seluruh calon peserta bahwa pelaksanaan ujian CBT daring akan dimulai pada 8 April 2026. Harap mencetak kartu peserta dan memeriksa koneksi internet sebelum sesi dimulai.' AS isi
  UNION ALL SELECT 'Batas Akhir Unggah Berkas Persyaratan Administrasi', 'Informasi Umum', 'Pendaftar Belum Lengkap', '2026-03-18', 'dipublikasi', 0,
    'Mengingatkan kembali batas akhir upload Akta Kelahiran, KK, dan Surat Keterangan Lulus (SKL) adalah tanggal 25 Maret 2026 pukul 23.59 WIB.'
  UNION ALL SELECT 'Lokasi Ruangan dan Pembagian Sesi Wawancara Minat Bakat', 'Teknis', 'Semua Pendaftar Gelombang 1', '2026-03-15', 'dipublikasi', 0,
    'Wawancara minat bakat kejuruan dilaksanakan di Aula Pertemuan Utama Gedung B. Peserta diwajibkan membawa kartu pendaftaran dan bukti berkas asli.'
  UNION ALL SELECT 'Surat Keputusan Hasil Seleksi Akhir SPMB Gelombang 1', 'Pengumuman Kelulusan', 'Semua Pendaftar', '2026-03-24', 'draft', 0,
    'Draf pengumuman penetapan siswa yang diterima pada 6 program keahlian SMK Citra Negara Tahun Ajaran 2026/2027 menunggu persetujuan pleno.'
) x WHERE NOT EXISTS (SELECT 1 FROM pengumuman);