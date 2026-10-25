USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS berkas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jenis VARCHAR(20) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  nama_asli VARCHAR(255) NOT NULL,
  ukuran INT NOT NULL,
  status ENUM('menunggu','diterima','perlu_perbaikan')
    NOT NULL DEFAULT 'menunggu',
  catatan VARCHAR(255) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  UNIQUE KEY uq_berkas_user_jenis (user_id, jenis),
  CONSTRAINT fk_berkas_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);