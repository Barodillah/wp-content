# Asset Manager (wp-content)

Repositori ini berisi sistem pengelola aset (Asset Manager) berbasis PHP dengan UI/UX yang modern, menggunakan Vanilla CSS, fitur drag-and-drop, serta integrasi ikon Lucide.

## Instruksi Penggunaan Git & GitHub

Berikut adalah langkah-langkah untuk menginisialisasi repositori lokal dan melakukan *push* (mengunggah) kode ini ke GitHub Anda di tautan `https://github.com/Barodillah/wp-content.git`.

### Persyaratan
Pastikan Anda sudah menginstal [Git](https://git-scm.com/) di komputer Anda dan sudah melakukan login ke akun GitHub Anda melalui terminal.

### Langkah-langkah Push ke GitHub

Buka terminal (Command Prompt, PowerShell, atau Git Bash) dan arahkan ke folder proyek Anda (`c:\laragon\www\wp-content`). Kemudian jalankan perintah-perintah berikut secara berurutan:

**1. Inisialisasi Repositori Git (Jika Belum)**
```bash
git init
```
*(Perintah ini akan membuat folder `.git` tersembunyi untuk mulai melacak perubahan file).*

**2. Tambahkan Semua File ke Staging Area**
```bash
git add .
```
*(Perintah ini akan menambahkan semua file dalam folder ke dalam daftar file yang siap di-commit).*

**3. Buat Commit Pertama**
```bash
git commit -m "Initial commit: Asset Manager dengan UI/UX modern"
```
*(Menyimpan versi kode saat ini dengan pesan commit).*

**4. Ubah Branch Utama ke 'main' (Standar GitHub Baru)**
```bash
git branch -M main
```

**5. Hubungkan dengan Repositori Remote GitHub Anda**
```bash
git remote add origin https://github.com/Barodillah/wp-content.git
```
*(Ini akan memberitahu Git lokal Anda ke mana kode harus dikirim. Jika Anda mendapatkan error remote 'origin' sudah ada, Anda bisa menghapusnya dulu dengan `git remote remove origin` lalu ulangi perintah di atas).*

**6. Push (Unggah) Kode ke GitHub**
```bash
git push -u origin main
```
*(Perintah ini akan mengirimkan semua file ke repositori GitHub Anda. Bendera `-u` mengatur branch default untuk ke depannya).*

---

### Update Kode di Masa Mendatang (Git Workflow)
Jika suatu saat Anda melakukan perubahan pada file (misal mengedit `index.php`) dan ingin memperbarui repositori GitHub, Anda hanya perlu menjalankan 3 perintah dasar ini:

```bash
git add .
git commit -m "Deskripsi perubahan yang Anda lakukan"
git push
```

## Struktur File Penting
- `index.php`: Antarmuka utama aplikasi (Frontend).
- `api.php`: Backend untuk memproses permintaan API (list, delete, rename).
- `upload.php`: Backend khusus untuk menangani proses upload file dan fetch URL.
- `config.php`: Konfigurasi koneksi database dan konstanta dasar.
- `database.sql`: Skema tabel database `assets`.
