USE spmb_smk_citra_negara;

/* ===== 1. Kolom baru jadwal_tes ===== */
SET @sudah := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_tes' AND COLUMN_NAME = 'cbt_status'
);

SET @s1 := IF(@sudah = 0,
  'ALTER TABLE jadwal_tes
     ADD COLUMN tipe VARCHAR(12) NOT NULL DEFAULT ''cbt'',
     ADD COLUMN cbt_status ENUM(''tertutup'',''dibuka'',''ditutup'') NOT NULL DEFAULT ''tertutup'',
     ADD COLUMN durasi_menit SMALLINT NOT NULL DEFAULT 120,
     ADD COLUMN jumlah_soal SMALLINT NOT NULL DEFAULT 50',
  'SELECT ''Kolom jadwal sudah ada, dilewati'' AS info');
PREPARE p1 FROM @s1; EXECUTE p1; DEALLOCATE PREPARE p1;

SET @s2 := IF(@sudah = 0,
  'UPDATE jadwal_tes SET tipe = CASE
       WHEN nama LIKE ''%CBT%'' THEN ''cbt''
       WHEN nama LIKE ''%Wawancara%'' THEN ''wawancara''
       ELSE ''lainnya'' END WHERE id > 0',
  'SELECT ''Tipe jadwal tidak diubah'' AS info');
PREPARE p2 FROM @s2; EXECUTE p2; DEALLOCATE PREPARE p2;

/* ===== 2. Percobaan & jawaban ujian ===== */
CREATE TABLE IF NOT EXISTS cbt_percobaan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  sesi_id INT NOT NULL,
  soal_ids TEXT NOT NULL,
  mulai_at DATETIME NOT NULL,
  batas_at DATETIME NOT NULL,
  selesai_at DATETIME NULL,
  status ENUM('berjalan','selesai') NOT NULL DEFAULT 'berjalan',
  benar SMALLINT NULL,
  nilai DECIMAL(5,2) NULL,
  CONSTRAINT fk_cbtp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbtp_sesi FOREIGN KEY (sesi_id) REFERENCES jadwal_tes(id)
);

CREATE TABLE IF NOT EXISTS cbt_jawaban (
  percobaan_id INT NOT NULL,
  soal_id INT NOT NULL,
  jawaban CHAR(1) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (percobaan_id, soal_id),
  CONSTRAINT fk_cbtj_p FOREIGN KEY (percobaan_id) REFERENCES cbt_percobaan(id) ON DELETE CASCADE
);

/* ===== 3. Tambahan 45 soal contoh (total jadi 50) ===== */
INSERT IGNORE INTO bank_soal
  (kode, kategori, topik, kesulitan, teks, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci) VALUES
('MTH-06','matematika','Pecahan & Persen','mudah','Hasil dari 3/4 + 2/5 adalah ...','5/9','1 3/20','1 1/4','23/40','1 7/20','B'),
('MTH-07','matematika','Perbandingan','mudah','Perbandingan kelereng Ani dan Budi adalah 3 : 5. Jika jumlah kelereng mereka 48 butir, banyak kelereng Budi adalah ...','18 butir','24 butir','28 butir','30 butir','32 butir','D'),
('MTH-08','matematika','Kecepatan & Waktu','sedang','Sebuah motor menempuh jarak 150 km dengan kecepatan rata-rata 50 km/jam. Jika berangkat pukul 07.30, motor tersebut tiba pukul ...','09.30','10.00','10.30','11.00','11.30','C'),
('MTH-09','matematika','Persamaan Linear','sedang','Jika 2x + 5 = 17, maka nilai dari 3x - 4 adalah ...','12','14','16','18','20','B'),
('MTH-10','matematika','Luas & Keliling','sulit','Sebuah persegi panjang memiliki keliling 50 cm dan panjangnya 5 cm lebih dari lebarnya. Luas persegi panjang tersebut adalah ... cm2','120','125','144','150','156','D'),

('IND-01','indonesia','Kata Baku','mudah','Penulisan kata baku yang benar adalah ...','apotik','apotek','apotick','afotek','apoteck','B'),
('IND-02','indonesia','Sinonim','mudah','Sinonim kata "gigih" adalah ...','malas','lemah','ragu','tekun','lalai','D'),
('IND-03','indonesia','Antonim','mudah','Antonim kata "hemat" adalah ...','boros','ringkas','cermat','irit','pelit','A'),
('IND-04','indonesia','Kalimat Efektif','sedang','Kalimat yang tidak mengandung pemborosan kata (efektif) adalah ...','Para hadirin sekalian dimohon untuk berdiri.','Ayah membeli mobil baru yang masih baru.','Siswa itu naik ke atas panggung untuk menerima piala.','Rapat dimulai pukul delapan pagi.','Mereka saling tolong-menolong satu sama lain.','D'),
('IND-05','indonesia','Ide Pokok','sedang','Bacalah kutipan berikut. "Membaca setiap hari melatih otak agar tetap aktif. Selain menambah wawasan, kebiasaan ini memperkaya kosakata dan meningkatkan kemampuan berpikir kritis." Ide pokok kutipan tersebut adalah ...','Membaca membuat mata cepat lelah.','Manfaat membaca setiap hari.','Cara memilih buku yang baik.','Kosakata dalam bahasa Indonesia.','Pentingnya perpustakaan sekolah.','B'),
('IND-06','indonesia','Majas','sedang','Majas yang terdapat pada kalimat "Ia bagaikan singa saat berbicara di depan kelas" adalah ...','Metafora','Personifikasi','Simile (perumpamaan)','Hiperbola','Sarkasme','C'),
('IND-07','indonesia','Kata Dasar','sedang','Kata dasar dari "pertandingan" adalah ...','tanding','pertanding','tandingan','bertanding','tinding','A'),
('IND-08','indonesia','Kalimat Majemuk','sulit','Kalimat "Rina membaca buku, sedangkan adiknya bermain di halaman." termasuk kalimat majemuk ...','bertingkat','setara','campuran','rapatan','tunggal','B'),
('IND-09','indonesia','Huruf Kapital','mudah','Kalimat yang menggunakan huruf kapital dengan benar adalah ...','Ayah bekerja di kota depok.','Dia adalah Guru matematika kami.','Kakak kuliah di universitas indonesia.','Kami berlibur pada bulan Agustus.','Ibu pergi ke Pasar kemarin pagi.','D'),
('IND-10','indonesia','Struktur Paragraf','sedang','Paragraf deduktif memiliki kalimat utama yang terletak di ...','akhir paragraf','tengah paragraf','seluruh bagian paragraf','awal paragraf','tidak ada kalimat utama','D'),

('ENG-01','inggris','Simple Present','mudah','She ___ to school every day.','go','goes','going','gone','went','B'),
('ENG-02','inggris','Vocabulary','mudah','The opposite of "big" is ...','tall','small','wide','heavy','long','B'),
('ENG-03','inggris','Vocabulary','mudah','A person who teaches students at school is called a ...','doctor','farmer','teacher','driver','chef','C'),
('ENG-04','inggris','Past Continuous','sedang','They ___ football when it started to rain.','play','played','were playing','are playing','have played','C'),
('ENG-05','inggris','Preposition','sedang','The meeting will start ___ 9 o''clock.','in','on','at','by','from','C'),
('ENG-06','inggris','Reading','sedang','Read the text. "Dina wakes up at 5 a.m. every day. She prays, cleans her room, and has breakfast. She leaves for school at 6.30." What time does Dina leave for school?','5.00','5.30','6.00','6.30','7.00','D'),
('ENG-07','inggris','Conditional Sentence','sedang','If I ___ enough money, I would buy a new laptop.','have','had','will have','having','has','B'),
('ENG-08','inggris','Passive Voice','sulit','The letter ___ by the secretary yesterday.','writes','wrote','is written','was written','has written','D'),
('ENG-09','inggris','Vocabulary','mudah','"Enormous" has the closest meaning to ...','tiny','huge','quiet','quick','cheap','B'),
('ENG-10','inggris','Comparison','sedang','He is ___ than his brother.','tall','tallest','taller','more tall','most tall','C'),

('TPS-01','potensi','Deret Angka','mudah','Angka berikutnya dari deret 2, 4, 8, 16, ... adalah ...','24','30','32','34','36','C'),
('TPS-02','potensi','Analogi','mudah','Siang : Terang = Malam : ...','Tidur','Bulan','Gelap','Sunyi','Dingin','C'),
('TPS-03','potensi','Silogisme','sedang','Semua siswa SMK mengikuti praktik kerja. Dina adalah siswa SMK. Kesimpulan yang tepat adalah ...','Dina tidak mengikuti praktik kerja.','Dina mengikuti praktik kerja.','Sebagian siswa SMK tidak praktik kerja.','Dina bukan siswa SMK.','Semua yang praktik kerja adalah siswa SMK.','B'),
('TPS-04','potensi','Deret Angka','sedang','Angka berikutnya dari deret 1, 4, 9, 16, 25, ... adalah ...','30','36','34','42','49','B'),
('TPS-05','potensi','Analogi','sedang','Dokter : Rumah Sakit = Guru : ...','Murid','Buku','Sekolah','Kelas','Ijazah','C'),
('TPS-06','potensi','Logika Urutan','sulit','Andi lebih tinggi dari Budi. Budi lebih tinggi dari Cici. Dedi lebih pendek dari Cici. Siapa yang paling pendek?','Andi','Budi','Cici','Dedi','Tidak dapat ditentukan','D'),
('TPS-07','potensi','Penalaran Kuantitatif','sedang','Lima pekerja menyelesaikan suatu pekerjaan dalam 12 hari. Berapa hari yang dibutuhkan 6 pekerja dengan kemampuan yang sama?','8 hari','9 hari','10 hari','12 hari','15 hari','C'),
('TPS-08','potensi','Antonim Penalaran','mudah','Lawan kata dari "optimis" adalah ...','pesimis','realistis','idealis','humoris','egois','A'),
('TPS-09','potensi','Deret Huruf','sulit','Huruf berikutnya pada pola A, C, F, J, O, ... adalah ...','T','U','V','W','X','B'),
('TPS-10','potensi','Penalaran Kuantitatif','sedang','Harga 3 buku adalah Rp45.000. Harga 5 buku yang sama adalah ...','Rp60.000','Rp70.000','Rp75.000','Rp80.000','Rp90.000','C'),

('MNT-01','minat','Teknologi Informasi','mudah','Perangkat yang berfungsi sebagai pusat pemrosesan data pada komputer adalah ...','Monitor','Keyboard','CPU','Speaker','Printer','C'),
('MNT-02','minat','Jaringan Komputer','mudah','Perangkat yang menghubungkan beberapa komputer dalam jaringan lokal (LAN) adalah ...','Scanner','Switch','Webcam','Joystick','Proyektor','B'),
('MNT-03','minat','Pemrograman Web','sedang','Bahasa yang umum digunakan untuk membuat struktur halaman web adalah ...','HTML','SQL','Python','Java','Pascal','A'),
('MNT-04','minat','Desain Grafis','mudah','Tiga warna primer pada model warna cahaya (RGB) adalah ...','Merah, kuning, biru','Merah, hijau, biru','Cyan, magenta, kuning','Hitam, putih, abu-abu','Oranye, hijau, ungu','B'),
('MNT-05','minat','Desain Grafis','sedang','Format gambar yang mendukung latar belakang transparan adalah ...','JPG','BMP','PNG','DOC','MP3','C'),
('MNT-06','minat','Administrasi Perkantoran','sedang','Surat resmi yang dibuat oleh instansi pemerintah atau sekolah untuk keperluan kedinasan disebut surat ...','pribadi','dinas','niaga','undangan','keluarga','B'),
('MNT-07','minat','Pemasaran','sedang','Bauran pemasaran (marketing mix) 4P terdiri atas product, price, place, dan ...','people','promotion','process','profit','plan','B'),
('MNT-08','minat','Layanan Pelanggan','mudah','Sikap yang paling tepat saat melayani pelanggan yang sedang mengeluh adalah ...','mengabaikan keluhan','membalas dengan nada tinggi','mendengarkan dengan sabar dan menawarkan solusi','menyuruh pelanggan pergi','menyalahkan pelanggan','C'),
('MNT-09','minat','Perhotelan','mudah','Bagian hotel yang bertugas menerima tamu saat check-in adalah ...','Housekeeping','Front office','Kitchen','Security','Laundry','B'),
('MNT-10','minat','Perhotelan','sedang','Bagian hotel yang bertanggung jawab atas kebersihan dan kerapian kamar tamu adalah ...','Front office','Food & beverage','Housekeeping','Sales & marketing','Engineering','C');