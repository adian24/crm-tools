import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ASSOCIATES_DATA } from "./associatesData";

// Import semua data associate dari JSON
export const importBatch = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Clear existing data
    const existing = await ctx.db.query("masterAssociate").collect();
    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Import new data
    for (const associate of ASSOCIATES_DATA) {
      await ctx.db.insert("masterAssociate", {
        kode: associate.kode,
        nama: associate.nama,
        kategori: associate.kategori,
        status: associate.status,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, message: `Berhasil mengimpor ${ASSOCIATES_DATA.length} associate` };
  },
});
