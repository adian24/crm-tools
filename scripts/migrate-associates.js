// Script sederhana untuk import data ke Convex
// Jalankan dengan: node scripts/migrate-associates.js

const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    // Baca file JSON
    const jsonPath = path.join(__dirname, '../data/master-associate.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    console.log(`📂 Membaca file: ${jsonPath}`);
    console.log(`✅ Berhasil membaca ${jsonData.associate.length} data associate`);
    console.log('\n📋 Data yang akan diimport:');
    console.log('   - Contoh:', jsonData.associate[0]);
    console.log(`\n🔧 Untuk import data, jalankan function importFromJSON dari Convex dashboard`);
    console.log('   atau gunakan Convex CLI dengan perintah:');
    console.log('   npx convex run --no-input importFromJSON --string "$(cat data/master-associate.json)"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
