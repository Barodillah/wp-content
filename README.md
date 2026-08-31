# WP Content Asset Manager

WP Content Asset Manager adalah alat berbasis PHP sederhana dan elegan untuk mengelola aset media (gambar, video, dokumen, dll.) pada website Anda. Alat ini sangat berguna sebagai pengganti file manager bawaan server atau FTP, memberikan antarmuka yang cepat dan modern (mirip *Media Library* di WordPress).

## Fitur Utama

- **UI/UX Modern & Responsif:** Dibangun dengan Vanilla CSS, font *Inter*, dan desain *glassmorphism* modern.
- **Smart Drag & Drop:** Seret dan lepas file dari komputer Anda langsung ke dalam browser. Mendukung upload banyak file (multi-file) sekaligus dengan tampilan preview sebelum diunggah.
- **Fetch dari URL (Paste Link):** Punya gambar dari website lain? Cukup klik tombol *Paste* (ikon 📋) dan sistem akan mengunduhnya langsung ke server Anda tanpa perlu download manual ke komputer.
- **Thumbnail Otomatis:** Preview otomatis untuk format gambar (JPEG, PNG, WebP, dll.) dan indikator ikon untuk format file lainnya.
- **Manajemen Aset Lengkap:**
  - 👁️ **Preview:** Lihat gambar atau video langsung di dalam *modal* tanpa berpindah halaman.
  - 📋 **Copy Link:** Salin URL publik file dengan satu klik (dengan animasi umpan balik centang hijau).
  - ✏️ **Rename:** Ganti nama file agar lebih rapi (nama file akan diubah di *database*).
  - 📥 **Download:** Unduh file langsung ke perangkat Anda.
  - 🗑️ **Hapus:** Hapus file secara permanen dari server beserta datanya di *database*.
- **Keamanan Dasar:** Dilengkapi perlindungan PIN (default: `2098`) sebelum pengguna dapat mengakses halaman manajemen.

## Panduan Instalasi

1. **Upload File ke Server**
   Unggah seluruh file di dalam repositori ini ke folder server Anda (misal: `public_html/wp-content/`). Pastikan server Anda mendukung PHP 7.4 atau lebih baru.
   
2. **Buat Folder Upload**
   Buat sebuah folder bernama `uploads` di dalam direktori yang sama dengan `index.php`. Pastikan folder ini memiliki *permission* baca/tulis (`chmod 755` atau `777` jika diperlukan) agar PHP bisa menyimpan file.
   
3. **Konfigurasi Database**
   - Buat database MySQL di server Anda.
   - Import file `database.sql` ke dalam database tersebut untuk membuat tabel `assets`.
   - Buka file `config.php` dan sesuaikan kredensial koneksinya:
     ```php
     $host = 'localhost';
     $user = 'username_database';
     $pass = 'password_database';
     $db   = 'nama_database';
     ```
   - Di dalam `config.php`, jangan lupa untuk menyesuaikan `BASE_URL` dengan alamat website Anda.

## Cara Penggunaan

1. Buka URL tempat Anda meletakkan folder ini (contoh: `https://domainanda.com/wp-content/`).
2. Masukkan PIN akses (default adalah `2098`). Anda bisa mengubah PIN ini dengan mengedit variabel `$correct_pin` di dalam file `index.php`.
3. Setelah masuk, Anda akan melihat indikator koneksi database di pojok kanan atas. Jika berwarna hijau, Anda siap menggunakan alat ini!
4. **Upload File:** Seret file ke halaman atau klik kotak *Hero Banner*.
5. **Paste URL:** Klik tombol *Paste URL* di dalam *Hero Banner* jika Anda sudah menyalin (*copy*) URL gambar dari website lain.

## Teknologi yang Digunakan
- **Backend:** PHP & MySQL (PDO)
- **Frontend:** HTML5, Vanilla JavaScript, Vanilla CSS
- **Ikon:** Lucide Icons (via CDN)
