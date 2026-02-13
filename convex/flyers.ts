import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all flyers
export const getFlyers = query({
  args: {},
  handler: async (ctx) => {
    const flyers = await ctx.db
      .query("flyers")
      .order("desc")
      .collect();

    // Fetch user details for created_by and updated_by
    const flyersWithUsers = await Promise.all(
      flyers.map(async (flyer) => {
        let createdByName = "Unknown";
        if (flyer.created_by) {
          const createdBy = await ctx.db.get(flyer.created_by);
          // Access fields safely with default fallback
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (flyer.updated_by) {
          const updatedBy = await ctx.db.get(flyer.updated_by);
          // Access fields safely with default fallback
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...flyer,
          createdByName,
          updatedByName,
        };
      })
    );

    return flyersWithUsers;
  },
});

// Get flyers by year and month
export const getFlyersByMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const flyers = await ctx.db
      .query("flyers")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();

    // Fetch user details for created_by and updated_by
    const flyersWithUsers = await Promise.all(
      flyers.map(async (flyer) => {
        let createdByName = "Unknown";
        if (flyer.created_by) {
          const createdBy = await ctx.db.get(flyer.created_by);
          // Access fields safely with default fallback
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (flyer.updated_by) {
          const updatedBy = await ctx.db.get(flyer.updated_by);
          // Access fields safely with default fallback
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...flyer,
          createdByName,
          updatedByName,
        };
      })
    );

    return flyersWithUsers;
  },
});

// Get flyer by ID
export const getFlyerById = query({
  args: { id: v.id("flyers") },
  handler: async (ctx, args) => {
    const flyer = await ctx.db.get(args.id);
    if (!flyer) {
      throw new Error("Flyer not found");
    }

    return flyer;
  },
});

// Generate upload URL for flyer image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create new flyer
export const createFlyer = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    month: v.number(),
    year: v.number(),
    imageUrl: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    category: v.union(v.literal("Training"), v.literal("Webinar"), v.literal("Promosi")),
    tanggalTerbit: v.optional(v.string()),
    tanggalBroadcast: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const flyerId = await ctx.db.insert("flyers", {
      title: args.title,
      description: args.description,
      month: args.month,
      year: args.year,
      imageUrl: args.imageUrl,
      status: args.status,
      category: args.category,
      tanggalTerbit: args.tanggalTerbit,
      tanggalBroadcast: args.tanggalBroadcast,
      // Note: created_by should be set to actual user ID from auth context
      // For now, we'll insert without it and let the database handle defaults
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      flyerId,
      message: "Flyer berhasil dibuat",
    };
  },
});

// Update flyer
export const updateFlyer = mutation({
  args: {
    id: v.id("flyers"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    category: v.optional(v.union(v.literal("Training"), v.literal("Webinar"), v.literal("Promosi"))),
    tanggalTerbit: v.optional(v.string()),
    tanggalBroadcast: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flyer = await ctx.db.get(args.id);
    if (!flyer) {
      throw new Error("Flyer not found");
    }

    const { id, ...updateFields } = args;

    await ctx.db.patch(args.id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Flyer berhasil diupdate",
    };
  },
});

// Delete flyer
export const deleteFlyer = mutation({
  args: {
    id: v.id("flyers"),
  },
  handler: async (ctx, args) => {
    const flyer = await ctx.db.get(args.id);
    if (!flyer) {
      throw new Error("Flyer not found");
    }

    // Delete the image from storage
    if (flyer.imageUrl) {
      // Extract storage ID from URL
      const url = new URL(flyer.imageUrl);
      const storageId = url.pathname.split("/").pop();
      if (storageId) {
        try {
          await ctx.storage.delete(storageId as any);
        } catch (error) {
          console.error("Failed to delete image from storage:", error);
        }
      }
    }

    // Delete the flyer document
    await ctx.db.delete(args.id);

    return {
      success: true,
      message: "Flyer berhasil dihapus",
    };
  },
});

// Update flyer status
export const updateFlyerStatus = mutation({
  args: {
    id: v.id("flyers"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const flyer = await ctx.db.get(args.id);
    if (!flyer) {
      throw new Error("Flyer not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Flyer berhasil diubah menjadi ${args.status}`,
    };
  },
});
