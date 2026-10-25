USE spmb_smk_citra_negara;

CREATE TABLE IF NOT EXISTS program_kuota (
  kode VARCHAR(20) PRIMARY KEY,
  rombel TINYINT NOT NULL DEFAULT 2,
  kepala VARCHAR(100) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO program_kuota (kode, rombel, kepala) VALUES
  ('PPLG', 4, 'Ayu Budi Lestari, S.Kom'),
  ('DKV', 3, 'Ibnu Purbani Lantib, S.Ds'),
  ('TJKT', 3, 'Aulia Fitri Hadiningtyas, S.Kom'),
  ('MPLB', 2, 'Lena Octasari, S.Kom'),
  ('PEMASARAN', 2, 'Alvino Andina Rahman'),
  ('PERHOTELAN', 2, 'Pamungkas Paksi Jaladara, SS')
ON DUPLICATE KEY UPDATE kode = kode;