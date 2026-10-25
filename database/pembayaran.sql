USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  jumlah INT NOT NULL DEFAULT 250000,
  bank_pengirim VARCHAR(50) NULL,
  nama_pengirim VARCHAR(100) NULL,
  bukti_file VARCHAR(255) NULL,
  status ENUM('belum_bayar','menunggu_verifikasi','lunas','ditolak')
    NOT NULL DEFAULT 'belum_bayar',
  catatan VARCHAR(255) NULL,
  paid_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pembayaran_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);