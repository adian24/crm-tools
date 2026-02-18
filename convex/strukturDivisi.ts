import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all struktur divisi
export const getStrukturDivisi = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("strukturDivisi")
      .withIndex("by_year")
      .order("desc")
      .collect();

    return items.filter((item) => item.isActive);
  },
});

// Get by year
export const getStrukturDivisiByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("strukturDivisi")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();

    return items.filter((item) => item.isActive);
  },
});

// Add new struktur divisi
export const addStrukturDivisi = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    year: v.number(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const strukturDivisiId = await ctx.db.insert("strukturDivisi", {
      title: args.title,
      description: args.description,
      year: args.year,
      imageUrl: args.imageUrl,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const newItem = await ctx.db.get(strukturDivisiId);

    return {
      success: true,
      message: "Struktur organisasi berhasil ditambahkan",
      data: newItem,
    };
  },
});

// Update struktur divisi
export const updateStrukturDivisi = mutation({
  args: {
    id: v.id("strukturDivisi"),
    title: v.string(),
    description: v.optional(v.string()),
    year: v.number(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      return {
        success: false,
        message: "Struktur organisasi tidak ditemukan",
      };
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      year: args.year,
      imageUrl: args.imageUrl,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Struktur organisasi berhasil diupdate",
    };
  },
});

// Delete struktur divisi (soft delete)
export const deleteStrukturDivisi = mutation({
  args: { id: v.id("strukturDivisi") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      return {
        success: false,
        message: "Struktur organisasi tidak ditemukan",
      };
    }

    // Soft delete
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Struktur organisasi berhasil dihapus",
    };
  },
});
