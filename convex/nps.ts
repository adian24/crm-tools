import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all NPS
export const getNPS = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("nps")
      .withIndex("by_month_year")
      .order("desc")
      .collect();

    return items.filter((item) => item.isActive);
  },
});

// Get by month and year
export const getNPSByMonthYear = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("nps")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();

    return items.filter((item) => item.isActive);
  },
});

// Add new NPS
export const addNPS = mutation({
  args: {
    month: v.number(),
    year: v.number(),
    category: v.union(v.literal("ISO"), v.literal("ISPO")),
    detractors: v.number(),
    passives: v.number(),
    promoters: v.number(),
    npsDescription: v.optional(v.string()),
    customerRelation: v.number(),
    finance: v.number(),
    auditor: v.number(),
    admin: v.number(),
    sales: v.number(),
    ratingDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const npsId = await ctx.db.insert("nps", {
      month: args.month,
      year: args.year,
      category: args.category,
      detractors: args.detractors,
      passives: args.passives,
      promoters: args.promoters,
      npsDescription: args.npsDescription,
      customerRelation: args.customerRelation,
      finance: args.finance,
      auditor: args.auditor,
      admin: args.admin,
      sales: args.sales,
      ratingDescription: args.ratingDescription,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: "NPS berhasil ditambahkan",
    };
  },
});

// Update NPS
export const updateNPS = mutation({
  args: {
    id: v.id("nps"),
    month: v.number(),
    year: v.number(),
    category: v.union(v.literal("ISO"), v.literal("ISPO")),
    detractors: v.number(),
    passives: v.number(),
    promoters: v.number(),
    npsDescription: v.optional(v.string()),
    customerRelation: v.number(),
    finance: v.number(),
    auditor: v.number(),
    admin: v.number(),
    sales: v.number(),
    ratingDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      return {
        success: false,
        message: "NPS tidak ditemukan",
      };
    }

    await ctx.db.patch(args.id, {
      month: args.month,
      year: args.year,
      category: args.category,
      detractors: args.detractors,
      passives: args.passives,
      promoters: args.promoters,
      npsDescription: args.npsDescription,
      customerRelation: args.customerRelation,
      finance: args.finance,
      auditor: args.auditor,
      admin: args.admin,
      sales: args.sales,
      ratingDescription: args.ratingDescription,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "NPS berhasil diupdate",
    };
  },
});

// Delete NPS (soft delete)
export const deleteNPS = mutation({
  args: { id: v.id("nps") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      return {
        success: false,
        message: "NPS tidak ditemukan",
      };
    }

    // Soft delete
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "NPS berhasil dihapus",
    };
  },
});
