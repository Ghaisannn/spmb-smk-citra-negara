USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS biodata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  tempat_lahir VARCHAR(100) NULL,
  tanggal_lahir DATE NULL,
  jenis_kelamin VARCHAR(20) NULL,
  agama VARCHAR(30) NULL,
  whatsapp VARCHAR(20) NULL,
  alamat VARCHAR(250) NULL,
  rt_rw VARCHAR(20) NULL,
  kelurahan VARCHAR(100) NULL,
  kecamatan VARCHAR(100) NULL,
  kode_pos VARCHAR(5) NULL,
  status_tinggal VARCHAR(50) NULL,
  npsn VARCHAR(8) NULL,
  nama_sekolah VARCHAR(150) NULL,
  status_sekolah VARCHAR(10) NULL,
  tahun_lulus VARCHAR(4) NULL,
  nisn VARCHAR(10) NULL,
  nama_ayah VARCHAR(100) NULL,
  pekerjaan_ayah VARCHAR(100) NULL,
  nama_ibu VARCHAR(100) NULL,
  whatsapp_ortu VARCHAR(20) NULL,
  step_selesai TINYINT NOT NULL DEFAULT 0,
  status ENUM('draft','terkirim') NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_biodata_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);