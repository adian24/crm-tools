import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Generate Excel Template for Import Update Kontak
 *
 * Run with: npx tsx scripts/generate-kontak-template.ts
 */

interface KontakTemplate {
  namaPerusahaan: string;
  noTelp: string;
  email: string;
  namaKonsultan: string;
  noTelpKonsultan: string;
  emailKonsultan: string;
}

// Sample data untuk template
const sampleData: KontakTemplate[] = [
  {
    namaPerusahaan: 'PT CONTOH SEJAHTERA',
    noTelp: '021-12345678',
    email: 'info@contohsejahtera.co.id',
    namaKonsultan: 'Budi Santoso',
    noTelpKonsultan: '08123456789',
    emailKonsultan: 'budi.santoso@contohsejahtera.co.id',
  },
  {
    namaPerusahaan: 'CV MAJU JAYA',
    noTelp: '031-87654321',
    email: 'admin@majujaya.com',
    namaKonsultan: 'Siti Aminah',
    noTelpKonsultan: '08234567890',
    emailKonsultan: 'siti@majujaya.com',
  },
  {
    namaPerusahaan: 'PT BERKAH ABADI',
    noTelp: '061-98765432',
    email: 'contact@berkahabadi.co.id',
    namaKonsultan: 'Ahmad Rahman',
    noTelpKonsultan: '08345678901',
    emailKonsultan: 'ahmad.rahman@berkahabadi.co.id',
  },
  {
    namaPerusahaan: '',
    noTelp: '',
    email: '',
    namaKonsultan: '',
    noTelpKonsultan: '',
    emailKonsultan: '',
  },
];

// Instructions untuk sheet kedua
const instructions = [
  ['PETUNJUK PENGGUNAAN TEMPLATE', ''],
  ['', ''],
  ['1. FORMAT FILE', ''],
  ['- Kolom "namaPerusahaan" WAJIB diisi', ''],
  ['- Kolom lain bersifat OPSIONAL - isi hanya data yang ingin diupdate', ''],
  ['- Jika field dikosongkan, data akan dihapus/nilainya di-set null', ''],
  ['', ''],
  ['2. NAMA KOLOM (SAMA dengan Database)', ''],
  ['- namaPerusahaan (WAJIB) - Nama lengkap perusahaan', ''],
  ['- noTelp - Nomor telepon perusahaan', ''],
  ['- email - Email perusahaan', ''],
  ['- namaKonsultan - Nama konsultan', ''],
  ['- noTelpKonsultan - Nomor telepon konsultan', ''],
  ['- emailKonsultan - Email konsultan', ''],
  ['- Baris kosong akan otomatis di-skip oleh sistem', ''],
  ['', ''],
  ['3. PENCOCOKAN NAMA PERUSAHAAN', ''],
  ['- Pencocokan TIDAK case-sensitive (huruf besar/kecil tidak berpengaruh)', ''],
  ['- Contoh: "PT ABC", "pt abc", "Pt Abc" akan dianggap sama', ''],
  ['- Sistem akan otomatis menggunakan penulisan nama yang ada di database', ''],
  ['', ''],
  ['4. CARA IMPORT', ''],
  ['- Download template ini', ''],
  ['- Isi data kontak sesuai format di atas', ''],
  ['- Upload file di halaman Manajemen Kontak', ''],
  ['- Review preview data sebelum konfirmasi update', ''],
  ['', ''],
  ['5. PERHATIAN', ''],
  ['- Update akan diterapkan ke SEMUA data CRM dengan nama perusahaan yang sama', ''],
  ['- Pastikan nama perusahaan TIDAK ada typo', ''],
  ['- Simpan backup data sebelum melakukan bulk update', ''],
  ['- Format email harus valid (contoh: user@domain.com)', ''],
  ['- Nomor telepon bisa berupa format apapun', ''],
  ['', ''],
  ['6. CONTOH PENGGISIAN', ''],
  ['- Jika ingin update hanya email: isi hanya kolom namaPerusahaan dan email', ''],
  ['- Jika ingin update semua kontak: isi semua kolom', ''],
  ['- Jika ingin menghapus data: kosongkan kolom yang ingin dihapus', ''],
  ['', ''],
  ['7. KONTAK', ''],
  ['- Hubungi admin jika mengalami kendala dalam proses import', ''],
];

function generateTemplate() {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Template dengan sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleData, {
    header: [
      'namaPerusahaan',
      'noTelp',
      'email',
      'namaKonsultan',
      'noTelpKonsultan',
      'emailKonsultan',
    ],
  });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 35 }, // namaPerusahaan
    { wch: 20 }, // noTelp
    { wch: 35 }, // email
    { wch: 30 }, // namaKonsultan
    { wch: 20 }, // noTelpKonsultan
    { wch: 35 }, // emailKonsultan
  ];

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Kontak');

  // Sheet 2: Petunjuk penggunaan
  const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionSheet['!cols'] = [
    { wch: 50 }, // Column A
    { wch: 50 }, // Column B
  ];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Petunjuk');

  // Output directory
  const outputDir = path.join(process.cwd(), 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename dengan timestamp
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `template-import-kontak-${timestamp}.xlsx`;
  const filepath = path.join(outputDir, filename);

  // Write file
  XLSX.writeFile(workbook, filepath);

  console.log('✅ Template berhasil dibuat!');
  console.log(`📁 Lokasi: ${filepath}`);
  console.log(`📊 Sheet: "Template Kontak" dan "Petunjuk"`);
  console.log(`📝 Sample data: ${sampleData.length - 1} baris contoh`);
  console.log('\n📋 Informasi:');
  console.log(`   - Total kolom: 6`);
  console.log(`   - Kolom wajib: namaPerusahaan`);
  console.log(`   - Kolom opsional: noTelp, email, namaKonsultan, noTelpKonsultan, emailKonsultan`);
  console.log(`\n🔑 Nama kolom SAMA dengan database (no camelCase conversion)`);

  return filepath;
}

// Run
generateTemplate();
