# SPMB SMK Citra Negara

Sistem Penerimaan Murid Baru (SPMB) online SMK Citra Negara Depok, Tahun Ajaran 2026/2027.

Fitur utama:

- Landing page, portal login, dan pendaftaran akun calon siswa
- Dashboard **Calon Siswa**: biodata 3 tahap, pilih program keahlian, pembayaran, upload berkas, ujian CBT online, hasil seleksi, pengumuman, notifikasi
- Dashboard **Admin**: data pendaftar, verifikasi berkas dan pembayaran, kuota program, jadwal tes dan bank soal CBT (termasuk import Excel), hasil seleksi, pengumuman, kelola akun
- Dashboard **Kepala Sekolah**: monitoring seleksi, persetujuan hasil, laporan penerimaan, pengumuman final

## Teknologi

Next.js (App Router) + TypeScript, Tailwind CSS, MySQL (Laragon), JWT (jose), bcryptjs, ExcelJS.

## Cara menjalankan

1. Pastikan **Node.js 20+** dan **Laragon** (MySQL) terpasang, lalu jalankan MySQL dari Laragon.
2. Install dependensi:

   ```
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local`, lalu isi `SESSION_SECRET` dan data database.
4. Buat database dan tabel. Di HeidiSQL, jalankan file di folder `database/` **berurutan**:

   1. `schema.sql`
   2. `biodata.sql`
   3. `pembayaran.sql`
   4. `berkas.sql`
   5. `program-seleksi.sql`
   6. `admin.sql`
   7. `admin-lanjutan.sql`
   8. `cbt.sql`
   9. `kepsek.sql`
   10. `akun.sql`
   11. `notifikasi.sql`

5. Buat akun Admin dan Kepala Sekolah (CMD, satu per satu):

   ```
   set INITIAL_USER_PASSWORD=GantiDenganSandiKuat1
   npx tsx scripts/create-user.ts "Petugas SPMB" admin@contoh.sch.id admin
   set INITIAL_USER_PASSWORD=GantiDenganSandiKuat2
   npx tsx scripts/create-user.ts "Kepala Sekolah" kepsek@contoh.sch.id kepsek
   ```

6. Letakkan aset gambar di `public/images/` (logo, hero, program, portal).
7. Jalankan:

   ```
   npm run dev
   ```

   Buka http://localhost:3000

## Catatan keamanan

- Jangan pernah meng-commit `.env.local` atau folder `storage/` (berisi berkas dan bukti transfer siswa).
- Data contoh seperti nomor rekening, nomor WhatsApp helpdesk, dan alamat sekolah masih contoh. Ganti sebelum dipakai sungguhan.