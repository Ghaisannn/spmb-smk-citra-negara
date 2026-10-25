USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS pilihan_program (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  program VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_program_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seleksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  tes_status ENUM('belum','selesai') NOT NULL DEFAULT 'belum',
  hasil ENUM('belum','diterima','tidak_diterima') NOT NULL DEFAULT 'belum',
  skor DECIMAL(4,1) NULL,
  peringkat INT NULL,
  total_peserta INT NULL,
  no_sk VARCHAR(60) NULL,
  tanggal_yudisium DATE NULL,
  batas_daftar_ulang DATE NULL,
  kuota_terisi INT NULL,
  kuota_total INT NULL,
  kelas VARCHAR(5) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_seleksi_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);