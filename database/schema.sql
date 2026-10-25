CREATE DATABASE IF NOT EXISTS spmb_smk_citra_negara
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('calon_siswa', 'admin', 'kepsek')
    NOT NULL DEFAULT 'calon_siswa',
  nik VARCHAR(16) NULL UNIQUE,
  whatsapp VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);