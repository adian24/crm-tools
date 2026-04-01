import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all catatan tambahan
export const getCatatanTambahan = query({
  args: {},
  handler: async (ctx) => {
    const catatan = await ctx.db
      .query("catatanTambahan")
      .order("desc")
      .collect();

    // Fetch user details for created_by and updated_by
    const catatanWithUsers = await Promise.all(
      catatan.map(async (item) => {
        let createdByName = "Unknown";
        if (item.created_by) {
          const createdBy = await ctx.db.get(item.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (item.updated_by) {
          const updatedBy = await ctx.db.get(item.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...item,
          createdByName,
          updatedByName,
        };
      })
    );

    return catatanWithUsers;
  },
});

// Get catatan tambahan by year and month
export const getCatatanTambahanByMonth = query({
  args: {
    bulan: v.number(),
    tahun: v.number(),
  },
  handler: async (ctx, args) => {
    const catatan = await ctx.db
      .query("catatanTambahan")
      .withIndex("by_month_year", (q) =>
        q.eq("bulan", args.bulan).eq("tahun", args.tahun)
      )
      .collect();

    // Fetch user details
    const catatanWithUsers = await Promise.all(
      catatan.map(async (item) => {
        let createdByName = "Unknown";
        if (item.created_by) {
          const createdBy = await ctx.db.get(item.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (item.updated_by) {
          const updatedBy = await ctx.db.get(item.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...item,
          createdByName,
          updatedByName,
        };
      })
    );

    return catatanWithUsers;
  },
});

// Get catatan tambahan by ID
export const getCatatanTambahanById = query({
  args: { id: v.id("catatanTambahan") },
  handler: async (ctx, args) => {
    const catatan = await ctx.db.get(args.id);
    if (!catatan) {
      throw new Error("Catatan tambahan not found");
    }

    return catatan;
  },
});


// Create new catatan tambahan
export const createCatatanTambahan = mutation({
  args: {
    judul: v.string(),
    deskripsi: v.string(),
    gambarBase64: v.string(),
    bulan: v.number(),
    tahun: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const catatanId = await ctx.db.insert("catatanTambahan", {
      judul: args.judul,
      isiCatatan: args.deskripsi,
      gambarBase64: args.gambarBase64,
      bulan: args.bulan,
      tahun: args.tahun,
      status: "active",
      createdByName: "System", // Will be updated with actual user name from auth context
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      catatanId,
      message: "Catatan tambahan berhasil dibuat",
    };
  },
});

// Update catatan tambahan
export const updateCatatanTambahan = mutation({
  args: {
    id: v.id("catatanTambahan"),
    judul: v.optional(v.string()),
    deskripsi: v.optional(v.string()),
    gambarBase64: v.optional(v.string()),
    bulan: v.optional(v.number()),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, deskripsi, gambarBase64, ...updates } = args;
    const now = Date.now();

    const patchData: any = { ...updates, updatedAt: now };
    if (deskripsi !== undefined) {
      patchData.isiCatatan = deskripsi;
    }
    if (gambarBase64 !== undefined) {
      patchData.gambarBase64 = gambarBase64;
    }

    await ctx.db.patch(id, patchData);

    return {
      success: true,
      message: "Catatan tambahan berhasil diperbarui",
    };
  },
});

// Update status
export const updateCatatanTambahanStatus = mutation({
  args: {
    id: v.id("catatanTambahan"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Status berhasil diperbarui",
    };
  },
});

// Delete catatan tambahan
export const deleteCatatanTambahan = mutation({
  args: {
    id: v.id("catatanTambahan"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    return {
      success: true,
      message: "Catatan tambahan berhasil dihapus",
    };
  },
});
