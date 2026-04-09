import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * API Route untuk download template Excel
 *
 * GET /api/download-template?type=kontak
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Template type is required' }, { status: 400 });
    }

    if (type !== 'kontak') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Generate Excel template on-the-fly
    const workbook = XLSX.utils.book_new();

    // Sample data untuk template
    const sampleData = [
      {
        namaPerusahaan: 'PT CONTOH SEJAHTERA',
        noTelp: '021-12345678',
        email: 'info@contohsejahtera.co.id',
        namaKonsultan: 'Budi Santoso',
        noTelpKonsultan: '08123456789',
        emailKonsultan: 'budi.santoso@contohsejahtera.co.id',
        picDirect: 'Dewi Lestari',
      },
      {
        namaPerusahaan: 'CV MAJU JAYA',
        noTelp: '031-87654321',
        email: 'admin@majujaya.com',
        namaKonsultan: 'Siti Aminah',
        noTelpKonsultan: '08234567890',
        emailKonsultan: 'siti@majujaya.com',
        picDirect: 'Rudi Hartono',
      },
      {
        namaPerusahaan: 'PT BERKAH ABADI',
        noTelp: '061-98765432',
        email: 'contact@berkahabadi.co.id',
        namaKonsultan: 'Ahmad Rahman',
        noTelpKonsultan: '08345678901',
        emailKonsultan: 'ahmad.rahman@berkahabadi.co.id',
        picDirect: 'Maya Sari',
      },
      {
        namaPerusahaan: '',
        noTelp: '',
        email: '',
        namaKonsultan: '',
        noTelpKonsultan: '',
        emailKonsultan: '',
        picDirect: '',
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
      ['- picDirect - Nama PIC Direct', ''],
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

    // Sheet 1: Template dengan sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData, {
      header: [
        'namaPerusahaan',
        'noTelp',
        'email',
        'namaKonsultan',
        'noTelpKonsultan',
        'emailKonsultan',
        'picDirect',
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
      { wch: 30 }, // picDirect
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

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `template-import-kontak-${timestamp}.xlsx`;

    // Write buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers untuk download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', excelBuffer.length.toString());

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
