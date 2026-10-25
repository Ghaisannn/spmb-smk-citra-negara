USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS notifikasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jenis VARCHAR(20) NOT NULL,
  tone VARCHAR(12) NOT NULL DEFAULT 'info',
  judul VARCHAR(120) NOT NULL,
  isi VARCHAR(300) NOT NULL,
  href VARCHAR(160) NOT NULL DEFAULT '/dashboard/calon-siswa',
  dibaca TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, dibaca, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Siswa yang sudah ada mendapat satu notifikasi pembuka
INSERT INTO notifikasi (user_id, jenis, tone, judul, isi, href)
SELECT u.id, 'akun', 'info', 'Fitur notifikasi kini aktif',
       'Perkembangan pendaftaran Anda, mulai dari verifikasi berkas, pembayaran, sesi ujian, sampai hasil seleksi, akan tampil di sini.',
       '/dashboard/calon-siswa'
FROM users u
WHERE u.role = 'calon_siswa'
  AND NOT EXISTS (SELECT 1 FROM notifikasi n WHERE n.user_id = u.id);