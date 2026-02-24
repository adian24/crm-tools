import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all customer complains
export const getCustomerComplain = query({
  args: {},
  handler: async (ctx) => {
    const customerComplain = await ctx.db
      .query("customerComplain")
      .order("desc")
      .collect();

    // Fetch user details for created_by and updated_by
    const customerComplainWithUsers = await Promise.all(
      customerComplain.map(async (complain) => {
        let createdByName = "Unknown";
        if (complain.created_by) {
          const createdBy = await ctx.db.get(complain.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (complain.updated_by) {
          const updatedBy = await ctx.db.get(complain.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...complain,
          createdByName,
          updatedByName,
        };
      })
    );

    return customerComplainWithUsers;
  },
});

// Get customer complain by year and month
export const getCustomerComplainByMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const customerComplain = await ctx.db
      .query("customerComplain")
      .withIndex("by_month_year", (q) =>
        q.eq("month", args.month).eq("year", args.year)
      )
      .collect();

    // Fetch user details for created_by and updated_by
    const customerComplainWithUsers = await Promise.all(
      customerComplain.map(async (complain) => {
        let createdByName = "Unknown";
        if (complain.created_by) {
          const createdBy = await ctx.db.get(complain.created_by);
          createdByName = ((createdBy as any)?.name || (createdBy as any)?.email || (createdBy as any)?.staffId) || "Unknown";
        }

        let updatedByName = null;
        if (complain.updated_by) {
          const updatedBy = await ctx.db.get(complain.updated_by);
          updatedByName = ((updatedBy as any)?.name || (updatedBy as any)?.email || (updatedBy as any)?.staffId) || null;
        }

        return {
          ...complain,
          createdByName,
          updatedByName,
        };
      })
    );

    return customerComplainWithUsers;
  },
});

// Get customer complain by ID
export const getCustomerComplainById = query({
  args: { id: v.id("customerComplain") },
  handler: async (ctx, args) => {
    const complain = await ctx.db.get(args.id);
    if (!complain) {
      throw new Error("Customer Complain not found");
    }

    return complain;
  },
});

// Create new customer complain
export const createCustomerComplain = mutation({
  args: {
    namaPerusahaan: v.string(),
    komplain: v.string(),
    divisi: v.union(
      v.literal("Sales"),
      v.literal("CRM"),
      v.literal("Opration ISO"),
      v.literal("Opration ISPO"),
      v.literal("HR"),
      v.literal("Finance"),
      v.literal("Product Development"),
      v.literal("Tata Kelola"),
      v.literal("IT")
    ),
    tanggal: v.string(),
    month: v.number(),
    year: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical")),
    tanggalSelesai: v.optional(v.string()),
    penyelesaian: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const complainId = await ctx.db.insert("customerComplain", {
      namaPerusahaan: args.namaPerusahaan,
      komplain: args.komplain,
      divisi: args.divisi,
      tanggal: args.tanggal,
      month: args.month,
      year: args.year,
      status: args.status,
      priority: args.priority,
      tanggalSelesai: args.tanggalSelesai,
      penyelesaian: args.penyelesaian,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      complainId,
      message: "Customer Complain berhasil dibuat",
    };
  },
});

// Update customer complain
export const updateCustomerComplain = mutation({
  args: {
    id: v.id("customerComplain"),
    namaPerusahaan: v.optional(v.string()),
    komplain: v.optional(v.string()),
    divisi: v.optional(v.union(
      v.literal("Sales"),
      v.literal("CRM"),
      v.literal("Opration ISO"),
      v.literal("Opration ISPO"),
      v.literal("HR"),
      v.literal("Finance"),
      v.literal("Product Development"),
      v.literal("Tata Kelola"),
      v.literal("IT")
    )),
    tanggal: v.optional(v.string()),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    priority: v.optional(v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical"))),
    tanggalSelesai: v.optional(v.string()),
    penyelesaian: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const complain = await ctx.db.get(args.id);
    if (!complain) {
      throw new Error("Customer Complain not found");
    }

    const { id, ...updateFields } = args;

    await ctx.db.patch(args.id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Customer Complain berhasil diupdate",
    };
  },
});

// Delete customer complain
export const deleteCustomerComplain = mutation({
  args: {
    id: v.id("customerComplain"),
  },
  handler: async (ctx, args) => {
    const complain = await ctx.db.get(args.id);
    if (!complain) {
      throw new Error("Customer Complain not found");
    }

    // Delete the customer complain document
    await ctx.db.delete(args.id);

    return {
      success: true,
      message: "Customer Complain berhasil dihapus",
    };
  },
});

// Update customer complain status
export const updateCustomerComplainStatus = mutation({
  args: {
    id: v.id("customerComplain"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const complain = await ctx.db.get(args.id);
    if (!complain) {
      throw new Error("Customer Complain not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Customer Complain berhasil diubah menjadi ${args.status}`,
    };
  },
});
