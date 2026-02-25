import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all kunjungan engagement partnership
export const getKunjunganEngagementPartnership = query({
  args: {},
  handler: async (ctx) => {
    const kunjungan = await ctx.db
      .query("kunjunganEngagementPartnership")
      .order("desc")
      .collect();

    return kunjungan;
  },
});

// Get kunjungan engagement partnership by year and month
export const getKunjunganEngagementPartnershipByMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const kunjungan = await ctx.db
      .query("kunjunganEngagementPartnership")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();

    return kunjungan;
  },
});

// Get kunjungan engagement partnership by ID
export const getKunjunganEngagementPartnershipById = query({
  args: { id: v.id("kunjunganEngagementPartnership") },
  handler: async (ctx, args) => {
    const kunjungan = await ctx.db.get(args.id);
    if (!kunjungan) {
      throw new Error("Kunjungan Engagement Partnership not found");
    }

    return kunjungan;
  },
});

// Create new kunjungan engagement partnership
export const createKunjunganEngagementPartnership = mutation({
  args: {
    namaClient: v.string(),
    namaPicClient: v.string(),
    noHp: v.string(),
    picTsi: v.string(),
    tglKunjungan: v.string(),
    month: v.number(),
    year: v.number(),
    catatan: v.optional(v.string()),
    tindakLanjut: v.optional(v.string()),
    fotoBukti: v.optional(v.string()),
    createdByName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const kunjunganId = await ctx.db.insert("kunjunganEngagementPartnership", {
      namaClient: args.namaClient,
      namaPicClient: args.namaPicClient,
      noHp: args.noHp,
      picTsi: args.picTsi,
      tglKunjungan: args.tglKunjungan,
      month: args.month,
      year: args.year,
      catatan: args.catatan,
      tindakLanjut: args.tindakLanjut,
      fotoBukti: args.fotoBukti,
      createdByName: args.createdByName,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      kunjunganId,
      message: "Kunjungan Engagement Partnership berhasil dibuat",
    };
  },
});

// Update kunjungan engagement partnership
export const updateKunjunganEngagementPartnership = mutation({
  args: {
    id: v.id("kunjunganEngagementPartnership"),
    namaClient: v.optional(v.string()),
    namaPicClient: v.optional(v.string()),
    noHp: v.optional(v.string()),
    picTsi: v.optional(v.string()),
    tglKunjungan: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    catatan: v.optional(v.string()),
    tindakLanjut: v.optional(v.string()),
    fotoBukti: v.optional(v.string()),
    updatedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const kunjungan = await ctx.db.get(args.id);
    if (!kunjungan) {
      throw new Error("Kunjungan Engagement Partnership not found");
    }

    const { id, ...updateFields } = args;

    await ctx.db.patch(args.id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Kunjungan Engagement Partnership berhasil diupdate",
    };
  },
});

// Delete kunjungan engagement partnership
export const deleteKunjunganEngagementPartnership = mutation({
  args: {
    id: v.id("kunjunganEngagementPartnership"),
  },
  handler: async (ctx, args) => {
    const kunjungan = await ctx.db.get(args.id);
    if (!kunjungan) {
      throw new Error("Kunjungan Engagement Partnership not found");
    }

    // Delete the kunjungan engagement partnership document
    await ctx.db.delete(args.id);

    return {
      success: true,
      message: "Kunjungan Engagement Partnership berhasil dihapus",
    };
  },
});
