import { importFromJSON } from "../convex/masterAssociate";
import fs from 'fs/promises';
import path from 'path';

async function pushAssociatesToConvex() {
  try {
    console.log('📂 Membaca data dari JSON...');

    // Read JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'master-associate.json');
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.associate || !Array.isArray(data.associate)) {
      throw new Error('Format JSON tidak valid');
    }

    console.log(`✅ Berhasil membaca ${data.associate.length} data associate`);
    console.log(`📋 Contoh data: ${JSON.stringify(data.associate[0], null, 2)}`);

    // Import ke Convex
    console.log('\n📤 Mulai mengimpor data ke Convex...');

    const result = await importFromJSON({}, { associates: data.associate });

    console.log(`✅ ${result.message}`);
    console.log('🎉 Import selesai!');

  } catch (error) {
    console.error('❌ Error saat import:', error);
    process.exit(1);
  }
}

pushAssociatesToConvex();
