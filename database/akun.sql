USE spmb_smk_citra_negara;

SET @ada := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
);

SET @s1 := IF(@ada = 0,
  'ALTER TABLE users
     ADD COLUMN status ENUM(''aktif'',''nonaktif'') NOT NULL DEFAULT ''aktif'',
     ADD COLUMN last_login_at TIMESTAMP NULL',
  'SELECT ''Kolom akun sudah ada, dilewati'' AS info');
PREPARE p1 FROM @s1; EXECUTE p1; DEALLOCATE PREPARE p1;

CREATE TABLE IF NOT EXISTS akun_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  target_id INT NULL,
  target_nama VARCHAR(100) NOT NULL,
  target_role VARCHAR(20) NOT NULL,
  aksi VARCHAR(20) NOT NULL,
  detail VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);