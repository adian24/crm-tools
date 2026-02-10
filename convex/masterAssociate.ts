import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all associates
export const getAssociates = query({
  args: {},
  handler: async (ctx) => {
    const associates = await ctx.db
      .query("masterAssociate")
      .withIndex("by_creationTime")
      .order("desc")
      .collect();

    return associates;
  },
});

// Get associate by kode
export const getAssociateByKode = query({
  args: { kode: v.string() },
  handler: async (ctx, args) => {
    const associate = await ctx.db
      .query("masterAssociate")
      .withIndex("by_kode", (q) => q.eq("kode", args.kode))
      .first();

    return associate;
  },
});

// Add new associate
export const addAssociate = mutation({
  args: {
    nama: v.string(),
    kategori: v.union(v.literal("Direct"), v.literal("Associate")),
    status: v.union(v.literal("Aktif"), v.literal("Non-Aktif")),
  },
  handler: async (ctx, args) => {
    // Check for duplicate name (case-insensitive)
    const existingAssociates = await ctx.db.query("masterAssociate").collect();
    const isDuplicate = existingAssociates.some(
      (assoc) => assoc.nama.toLowerCase().trim() === args.nama.toLowerCase().trim()
    );

    if (isDuplicate) {
      return {
        success: false,
        message: `Nama associate "${args.nama}" sudah ada. Gunakan nama lain.`,
      };
    }

    // Generate new kode (ASS + next number)
    const maxCode = existingAssociates.reduce((max, assoc) => {
      const num = parseInt(assoc.kode.replace("ASS", ""));
      return num > max ? num : max;
    }, 0);

    const newKode = `ASS${String(maxCode + 1).padStart(3, "0")}`;

    const now = Date.now();

    const associateId = await ctx.db.insert("masterAssociate", {
      kode: newKode,
      nama: args.nama,
      kategori: args.kategori,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    const newAssociate = await ctx.db.get(associateId);

    return {
      success: true,
      message: "Associate berhasil ditambahkan",
      data: newAssociate,
    };
  },
});

// Update associate
export const updateAssociate = mutation({
  args: {
    kode: v.string(),
    nama: v.string(),
    kategori: v.union(v.literal("Direct"), v.literal("Associate")),
    status: v.union(v.literal("Aktif"), v.literal("Non-Aktif")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("masterAssociate")
      .withIndex("by_kode", (q) => q.eq("kode", args.kode))
      .first();

    if (!existing) {
      return {
        success: false,
        message: "Associate tidak ditemukan",
      };
    }

    // Check for duplicate name (case-insensitive), excluding current record
    const allAssociates = await ctx.db.query("masterAssociate").collect();
    const isDuplicate = allAssociates.some(
      (assoc) =>
        assoc._id !== existing._id &&
        assoc.nama.toLowerCase().trim() === args.nama.toLowerCase().trim()
    );

    if (isDuplicate) {
      return {
        success: false,
        message: `Nama associate "${args.nama}" sudah ada. Gunakan nama lain.`,
      };
    }

    await ctx.db.patch(existing._id, {
      nama: args.nama,
      kategori: args.kategori,
      status: args.status,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Associate berhasil diupdate",
    };
  },
});

// Delete associate
export const deleteAssociate = mutation({
  args: { kode: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("masterAssociate")
      .withIndex("by_kode", (q) => q.eq("kode", args.kode))
      .first();

    if (!existing) {
      return {
        success: false,
        message: "Associate tidak ditemukan",
      };
    }

    await ctx.db.delete(existing._id);

    return {
      success: true,
      message: "Associate berhasil dihapus",
    };
  },
});

// Import data from JSON (one-time migration)
export const importFromJSON = mutation({
  args: {
    associates: v.array(
      v.object({
        kode: v.string(),
        nama: v.string(),
        kategori: v.union(v.literal("Direct"), v.literal("Associate")),
        status: v.union(v.literal("Aktif"), v.literal("Non-Aktif")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Clear existing data
    const existing = await ctx.db.query("masterAssociate").collect();
    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Import new data
    for (const associate of args.associates) {
      await ctx.db.insert("masterAssociate", {
        kode: associate.kode,
        nama: associate.nama,
        kategori: associate.kategori,
        status: associate.status,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: `Berhasil mengimpor ${args.associates.length} associate`,
    };
  },
});
