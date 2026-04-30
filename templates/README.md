# 📊 Templates CRM Tools

Folder ini berisi template Excel untuk keperluan import data di sistem CRM Tools.

## 📁 Daftar Template

### 1. Template Import Kontak
**File:** `template-import-kontak-{timestamp}.xlsx`

**Deskripsi:** Template untuk bulk update informasi kontak perusahaan dan konsultan.

**Kolom:**
- **namaPerusahaan** (WAJIB) - Harus sama dengan data di sistem (case insensitive)
- **noTelp** - Nomor telepon perusahaan
- **email** - Email perusahaan
- **namaKonsultan** - Nama konsultan perusahaan
- **noTelpKonsultan** - Nomor telepon konsultan
- **emailKonsultan** - Email konsultan

⚠️ **PENTING**:
- Nama kolom di Excel SAMA PERSIS dengan field di database Convex
- Baris kosong akan otomatis di-skip oleh sistem
- Tidak perlu menghapus baris kosong manual di Excel

**Sheet:**
1. **Template Kontak** - Berisi format kolom dan sample data
2. **Petunjuk** - Panduan lengkap penggunaan template

## 🚀 Cara Download Template

### Di Production (Vercel)
Template di-generate **on-the-fly** oleh API:
- Buka halaman **Manajemen Kontak**
- Klik tombol **"📊 Template"**
- Template akan terdownload otomatis dengan tanggal hari ini

### Di Local Development
Jika ingin membuat template lokal:

```bash
npm run template:kontak
```

Template akan dibuat di folder ini dengan nama `template-import-kontak-{tanggal}.xlsx`

## 📋 Cara Penggunaan

1. **Download Template**
   - Buka halaman Manajemen Kontak
   - Klik tombol "📊 Template" (di production) atau gunakan npm script (local)

2. **Isi Data**
   - Buka file Excel
   - Baca sheet "Petunjuk" untuk panduan lengkap
   - Isi data sesuai format yang tertera

3. **Import ke Sistem**
   - Buka halaman Manajemen Kontak
   - Klik tombol "Import Excel" atau "Contact Bulk Update"
   - Pilih file template yang sudah diisi
   - Review preview data
   - Konfirmasi update

## ⚠️ Perhatian

- Pencocokan nama perusahaan **TIDAK case-sensitive** (huruf besar/kecil tidak berpengaruh)
- Contoh: "PT ABC", "pt abc", "Pt Abc" akan dianggap sama dan cocok
- Sistem akan otomatis menggunakan penulisan nama yang ada di database
- Pastikan **namaPerusahaan** TIDAK ADA TYPO (nama harus cocok, tapi case tidak masalah)
- Update akan diterapkan ke **SEMUA** data CRM dengan nama perusahaan yang sama
- Kolom yang dikosongkan akan menghapus data tersebut (set ke null)
- Selalu simpan backup data sebelum melakukan bulk update

## 🔧 Troubleshooting

### Download template gagal
- Pastikan sudah terdeploy dengan benar ke Vercel
- Cek API route `/api/download-template?type=kontak` accessible
- Clear browser cache dan coba lagi

### Nama perusahaan tidak ditemukan
- Cek kembali penulisan nama perusahaan (case insensitive)
- Pastikan tidak ada spasi berlebih di awal/akhir
- Cek data di sistem untuk nama persahaan yang benar

### Format salah
- Pastikan tidak mengubah nama kolom/header
- Jangan menghapus baris kosong di template
- Gunakan format yang sesuai (email harus valid, dll)

## 📞 Bantuan

Hubungi admin jika mengalami kendala dalam proses import data.
