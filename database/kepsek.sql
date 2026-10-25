USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS persetujuan_hasil (
  id TINYINT PRIMARY KEY,
  status ENUM('menunggu','disetujui','revisi') NOT NULL DEFAULT 'menunggu',
  no_berkas VARCHAR(60) NOT NULL DEFAULT 'BA.042/SPMB-CN/III/2026',
  diajukan_oleh VARCHAR(100) NOT NULL DEFAULT 'Drs. Supriyadi, M.Pd',
  jabatan_pengusul VARCHAR(100) NOT NULL DEFAULT 'Ketua Panitia SPMB 2026',
  catatan_panitia TEXT NOT NULL,
  diajukan_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  keputusan_oleh INT NULL,
  keputusan_at TIMESTAMP NULL,
  catatan_revisi VARCHAR(255) NULL
);

INSERT IGNORE INTO persetujuan_hasil (id, catatan_panitia) VALUES
  (1, 'Seluruh berkas administrasi dan tes CBT serta wawancara telah dirapatkan dalam sidang pleno panitia. Alokasi kuota telah sesuai pagu rombel dan nilai passing grade minimum 70.00.');

CREATE TABLE IF NOT EXISTS kepsek_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis VARCHAR(20) NOT NULL,
  judul VARCHAR(120) NOT NULL,
  detail VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS draft_sk (
  id TINYINT PRIMARY KEY,
  judul VARCHAR(150) NOT NULL,
  nomor_surat VARCHAR(60) NOT NULL,
  tanggal DATE NOT NULL,
  sambutan TEXT NOT NULL,
  versi INT NOT NULL DEFAULT 1,
  status ENUM('draft','terbit') NOT NULL DEFAULT 'draft',
  pengumuman_id INT NULL,
  published_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO draft_sk (id, judul, nomor_surat, tanggal, sambutan) VALUES
  (1,
   'Surat Keputusan Kelulusan Seleksi Penerimaan Murid Baru (SPMB) Gelombang 1',
   '421.5/082/SMK-CN/SPMB/III/2026',
   CURDATE(),
   'Selamat kepada calon peserta didik baru SMK Citra Negara yang telah berhasil menempuh seluruh tahapan seleksi. Manfaatkan kesempatan ini dengan sebaik-baiknya melalui proses daftar ulang tertib sesuai panduan tertera. Bersama kita membangun keahlian vokasi unggul berwawasan teknologi.');

INSERT INTO kepsek_log (jenis, judul, detail)
SELECT 'pengumuman', 'Penyusunan Draf Awal', 'Inisiasi draf awal surat pengumuman penetapan hasil tes CBT & wawancara kejuruan.'
WHERE NOT EXISTS (SELECT 1 FROM kepsek_log WHERE jenis = 'pengumuman');

INSERT INTO kepsek_log (jenis, judul, detail)
SELECT 'persetujuan', 'Pengajuan dari Panitia SPMB', 'Usulan penetapan hasil seleksi Gelombang 1 diajukan ke Kepala Sekolah untuk disahkan.'
WHERE NOT EXISTS (SELECT 1 FROM kepsek_log WHERE jenis = 'persetujuan');

-- Nama Kepala Sekolah sesuai Figma (login ulang supaya nama di header berubah)
UPDATE users SET nama = 'Abdul Kodir Zaelani, S.Pd.I' WHERE role = 'kepsek';