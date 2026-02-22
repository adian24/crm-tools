// Run this in browser console on the Kolaborasi CRM page
// This will migrate all old jobDesk data from array to HTML format

const migrateJobDesk = async () => {
  try {
    const result = await convex.mutation(api.kolaborasiCrm.migrateJobDeskToHtml);
    console.log('✅ Migration successful:', result);
    alert(`✅ Migration completed!\nMigrated: ${result.migrated} staff\nTotal: ${result.total} staff`);
    // Refresh the page to see changes
    window.location.reload();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    alert('❌ Migration failed! Check console for details.');
  }
};

// Run migration
migrateJobDesk();
