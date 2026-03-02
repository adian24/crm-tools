import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// === QUERIES ===

// Get all PRM & Referral Pencapaian
export const getAllPrmReferralPencapaian = query({
  args: {},
  handler: async (ctx) => {
    const pencapaian = await ctx.db.query("prmReferralPencapaian").order("desc").collect();
    return pencapaian;
  },
});

// Get PRM & Referral Pencapaian by month and year
export const getPrmReferralPencapaianByMonthYear = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const pencapaian = await ctx.db
      .query("prmReferralPencapaian")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();
    return pencapaian;
  },
});

// Get PRM & Referral Pencapaian by category
export const getPrmReferralPencapaianByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const pencapaian = await ctx.db
      .query("prmReferralPencapaian")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
    return pencapaian;
  },
});

// Get PRM & Referral Pencapaian by year
export const getPrmReferralPencapaianByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const pencapaian = await ctx.db
      .query("prmReferralPencapaian")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    return pencapaian;
  },
});

// Get by ID
export const getPrmReferralPencapaian = query({
  args: { id: v.id("prmReferralPencapaian") },
  handler: async (ctx, args) => {
    const pencapaian = await ctx.db.get(args.id);
    return pencapaian;
  },
});

// === MUTATIONS ===

// Create PRM & Referral Pencapaian
export const createPrmReferralPencapaian = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    judul: v.string(),
    category: v.string(),
    target: v.number(),
    pencapaian: v.number(),
    deskripsi: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
    createdByName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const pencapaianId = await ctx.db.insert("prmReferralPencapaian", {
      ...args,
      createdAt: now,
      updatedAt: now,
      updated_by: args.created_by,
    });

    return pencapaianId;
  },
});

// Update PRM & Referral Pencapaian
export const updatePrmReferralPencapaian = mutation({
  args: {
    id: v.id("prmReferralPencapaian"),
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    judul: v.optional(v.string()),
    category: v.optional(v.string()),
    target: v.optional(v.number()),
    pencapaian: v.optional(v.number()),
    deskripsi: v.optional(v.string()),
    updated_by: v.optional(v.id("users")),
    updatedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, updatedByName, ...rest } = args;

    // Get existing data
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Pencapaian not found");
    }

    // Build updates object
    const updates: any = { updatedAt: Date.now() };

    // Process each field
    for (const [key, value] of Object.entries(rest)) {
      // Skip undefined fields (don't update)
      if (value === undefined) {
        continue;
      }
      // Include all other values
      updates[key] = value;
    }

    if (updated_by) {
      updates.updated_by = updated_by;
    }
    if (updatedByName) {
      updates.updatedByName = updatedByName;
    }

    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete PRM & Referral Pencapaian
export const deletePrmReferralPencapaian = mutation({
  args: { id: v.id("prmReferralPencapaian") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
