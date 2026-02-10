import { importFromJSON } from "../convex/masterAssociate";
import fs from 'fs/promises';
import path from 'path';

async function importMasterAssociate() {
  try {
    // Read JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'master-associate.json');
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    console.log(`📂 Membaca file: ${jsonPath}`);
    console.log(`✅ Berhasil membaca ${jsonData.associate.length} data associate`);

    // Import to Convex
    console.log('📤 Mulai mengimpor data ke Convex...');

    const result = await importFromJSON({}, { associates: jsonData.associate });

    console.log(`✅ ${result.message}`);
    console.log('🎉 Import selesai!');

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

importMasterAssociate();
