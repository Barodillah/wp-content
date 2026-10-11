# WP Content Asset Manager

**WP Content Asset Manager** adalah sistem manajemen aset media modern berbasis web yang dibangun dengan arsitektur **React 18 SPA (Single Page Application)** pada sisi antarmuka dan **PHP REST API + MySQL** pada sisi backend. 

Aplikasi ini dirancang sebagai alternatif berkecepatan tinggi untuk mengelola file gambar, dokumen, video, dan media website Anda tanpa perlu masuk ke cPanel File Manager atau FTP, dengan kenyamanan navigasi mirip *Media Library* modern.

---

## Fitur Utama

- ⚡ **Antarmuka Modern & Cepat:** Dibangun dengan React 18, Vite, dan desain *glassmorphism* modern dengan transisi yang halus.
- 📁 **Manajemen Folder Bertingkat:** Buat, pindahkan, dan susun file ke dalam folder dan sub-folder dengan navigasi *Breadcrumb* yang interaktif.
- 📤 **Smart Drag & Drop Upload:** Seret file langsung ke browser untuk mengunggah banyak file sekaligus dengan antarmuka pratinjau sebelum dikirim.
- 🔗 **Fetch dari URL (Paste Link):** Unggah gambar langsung dari tautan website lain tanpa perlu mengunduhnya manual ke komputer.
- 📦 **Tindakan Massal (Bulk Actions):** Pilih banyak file sekaligus untuk Rename massal, Pindah folder massal, Hapus massal, atau Unduh sebagai arsip ZIP (*Bulk Download*).
- 👥 **Manajemen Multi-Pengguna & Hak Akses:**
  - **Superuser:** Kendali penuh sistem, manajemen user, dan konfigurasi sistem.
  - **User:** Hak akses granular yang dapat disesuaikan per individu (*Upload*, *Rename*, *Move*, *Delete*).
- 🔒 **Proteksi Keamanan Berlapis:**
  - Password dienkripsi dengan standar *bcrypt* PHP.
  - Peringatan keamanan wajib ganti password jika masih memakai akun bawaan (*admin/admin123*).
- 🌐 **Pengaturan Domain & Storage Terintegrasi:**
  - Otomatis mendeteksi domain aktif browser (`window.location.origin`).
  - Mode himbauan inisialisasi wajib jika tabel pengaturan sistem masih kosong.
- ⌨️ **Dukungan Shortcut Keyboard:**
  - `Ctrl + K` / `/` : Fokus ke kolom pencarian
  - `Ctrl + U` : Buka formulir upload file
  - `Ctrl + Shift + N` : Buat folder baru
  - `Ctrl + A` : Pilih semua file di folder saat ini
  - `Delete` : Hapus file yang dipilih
  - `?` : Tampilkan bantuan shortcut keyboard

---

## Persyaratan Sistem

- **Web Server:** Apache atau LiteSpeed (Modul `mod_rewrite` wajib aktif).
- **PHP:** Versi 7.4 atau lebih baru (Disarankan PHP 8.1+).
  - Ekstensi PHP: `pdo_mysql`, `curl`, `fileinfo`, `zip`, `json`.
- **Database:** MySQL 5.7+ atau MariaDB 10.3+.
- **Node.js (Opsional):** Node.js v18+ jika ingin memodifikasi source code frontend dan build sendiri.

---

## Struktur Folder Utama

```text
├── dist/                   # File hasil kompilasi produksi React (HTML, CSS, JS, .htaccess)
├── src/                    # Source code frontend (React 18 + Vite)
├── wp_api/                 # Backend REST API PHP
│   ├── api.php             # Endpoint router utama
│   ├── config.php          # Konfigurasi koneksi database & environment
│   ├── database.sql        # Skema database MySQL
│   ├── serve.php           # Interceptor penyaji file & tracking
│   └── upload.php          # Engine proses upload file
├── uploads/                # Direktori penyimpanan file fisik di server
├── system_settings.json    # File sinkronisasi pengaturan dinamis
├── vite.config.js          # Konfigurasi Vite & Proxy development
└── package.json            # Dependensi library frontend
```

---

## Panduan Instalasi & Deployment ke Server (Hosting / cPanel)

### 1. Siapkan Database
1. Buka **phpMyAdmin** atau manajemen database di hosting/cPanel Anda.
2. Buat database baru (misalnya `db_asset_manager`).
3. Import file `wp_api/database.sql` ke dalam database tersebut.

### 2. Atur Koneksi Database
Buka file `wp_api/config.php` dan sesuaikan kredensial koneksi database:
```php
$host = 'localhost';
$user = 'username_database';
$pass = 'password_database';
$db   = 'db_asset_manager';
```

### 3. Unggah File ke Server
Jika aplikasi diletakkan di dalam folder `wp-content/` (contoh: `domainanda.com/wp-content/`):
1. Unggah folder **`wp_api/`** ke dalam direktori tersebut.
2. Unggah **seluruh isi folder `dist/`** (termasuk file tersembunyi **`.htaccess`**, file `index.html`, dan folder `assets/`) langsung ke direktori tersebut.
3. Buat folder bernama **`uploads/`** (jika belum ada) dan pastikan folder tersebut memiliki izin tulis (`chmod 755` atau `775`).

> **PENTING:** Pastikan file `.htaccess` dari folder `dist/` terunggah dengan benar. File ini bertugas menangani routing SPA agar URL langsung seperti `domainanda.com/wp-content/folder/1` tidak menghasilkan Error 404.

### 4. Login Pertama Kali
Buka URL website Anda di browser (misal: `https://domainanda.com/wp-content/`).
Gunakan akun bawaan Super Administrator:
- **Username:** `admin`
- **Password:** `admin123`

### 5. Inisialisasi Pengaturan Sistem
Saat pertama kali login, jika tabel pengaturan sistem masih kosong, modal **Inisialisasi Pengaturan Sistem** akan otomatis muncul dalam mode wajib simpan:
1. Klik tombol **Gunakan Domain Saat Ini** untuk otomatis mengisi domain publik Anda.
2. Periksa kolom sub-path (misal `/wp-content` atau kosongkan jika di root domain).
3. Klik **Simpan & Aktifkan Sistem**.

### 6. Amankan Akun Administrator
Setelah pengaturan sistem tersimpan, sistem akan menampilkan dialog pengamanan akun. Segera ganti username, nama, dan password Anda demi keamanan server.

---

## Panduan Pengembangan Lokal (Local Development)

Jika Anda ingin mengembangkan atau memodifikasi kode:

1. **Jalankan Web Server Lokal & Database:**
   Pastikan XAMPP / Laragon aktif (Apache & MySQL).

2. **Install Dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Server Vite akan berjalan langsung di root:
   ```text
   http://localhost:5173/
   ```
   *Request API (`/wp_api`) otomatis di-proxy oleh Vite ke backend Apache lokal Anda.*

4. **Kompilasi Ulang untuk Produksi:**
   ```bash
   npm run build
   ```
   Hasil build akan diperbarui di dalam folder `dist/` lengkap dengan konfigurasi subpath deployment yang tepat.

---

## Lisensi & Kontribusi

Aplikasi ini dikembangkan untuk mempermudah pengelolaan media berbasis web secara cepat, aman, dan elegan.
Silakan kembangkan dan sesuaikan sesuai kebutuhan proyek Anda!
