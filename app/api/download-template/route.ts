import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

    // Mapping template types ke filenames
    const templateMap: Record<string, string> = {
      'kontak': 'template-import-kontak-20260408.xlsx',
      'kontak-latest': 'template-import-kontak-20260408.xlsx', // Akan di-update dinamis nanti
    };

    const filename = templateMap[type];

    if (!filename) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Path ke file template
    const templatePath = path.join(process.cwd(), 'templates', filename);

    // Cek apakah file ada
    try {
      await fs.access(templatePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Template file not found. Please generate template first using: npm run template:kontak' },
        { status: 404 }
      );
    }

    // Baca file
    const fileBuffer = await fs.readFile(templatePath);

    // Set headers untuk download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading template:', error);
    return NextResponse.json(
      { error: 'Failed to download template' },
      { status: 500 }
    );
  }
}
