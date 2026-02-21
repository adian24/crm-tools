import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

// Get all active staff
export const getAllStaff = query({
  handler: async (ctx) => {
    const staff = await ctx.db
      .query("kolaborasiCrm")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return staff.map((s) => ({
      ...s,
      // Provide default for legacy data
      connections: s.connections || [],
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
    }));
  },
});

// Get staff by ID
export const getStaffById = query({
  args: { id: v.id("kolaborasiCrm") },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.id);
    if (!staff) return null;

    return {
      ...staff,
      // Provide default for legacy data
      connections: staff.connections || [],
      createdAt: new Date(staff.createdAt).toISOString(),
      updatedAt: new Date(staff.updatedAt).toISOString(),
    };
  },
});

// ==================== MUTATIONS ====================

// Create new staff
export const createStaff = mutation({
  args: {
    nama: v.string(),
    fotoUrl: v.optional(v.string()),
    jabatan: v.string(),
    jobDesk: v.array(v.string()),
    positionX: v.number(),
    positionY: v.number(),
    keterangan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const staffId = await ctx.db.insert("kolaborasiCrm", {
      ...args,
      connections: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return staffId;
  },
});

// Update staff
export const updateStaff = mutation({
  args: {
    id: v.id("kolaborasiCrm"),
    nama: v.optional(v.string()),
    fotoUrl: v.optional(v.string()),
    jabatan: v.optional(v.string()),
    jobDesk: v.optional(v.array(v.string())),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    keterangan: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Staff not found");
    }

    // Only update provided fields
    const updates: any = {};
    if (updateData.nama !== undefined) updates.nama = updateData.nama;
    if (updateData.fotoUrl !== undefined) updates.fotoUrl = updateData.fotoUrl;
    if (updateData.jabatan !== undefined) updates.jabatan = updateData.jabatan;
    if (updateData.jobDesk !== undefined) updates.jobDesk = updateData.jobDesk;
    if (updateData.positionX !== undefined) updates.positionX = updateData.positionX;
    if (updateData.positionY !== undefined) updates.positionY = updateData.positionY;
    if (updateData.keterangan !== undefined) updates.keterangan = updateData.keterangan;
    if (updateData.isActive !== undefined) updates.isActive = updateData.isActive;

    updates.updatedAt = Date.now();

    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete staff (soft delete)
export const deleteStaff = mutation({
  args: { id: v.id("kolaborasiCrm") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff not found");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Update position only (for drag & drop)
export const updateStaffPosition = mutation({
  args: {
    id: v.id("kolaborasiCrm"),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Staff not found");
    }

    await ctx.db.patch(args.id, {
      positionX: args.positionX,
      positionY: args.positionY,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Migration: Add connections field to existing staff
export const migrateConnections = mutation({
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("kolaborasiCrm").collect();

    for (const staff of allStaff) {
      if (staff.connections === undefined) {
        await ctx.db.patch(staff._id, {
          connections: [],
          updatedAt: Date.now(),
        });
      }
    }

    return { migrated: allStaff.length };
  },
});

// Add connection between two staff with metadata
export const addConnection = mutation({
  args: {
    fromId: v.id("kolaborasiCrm"),
    toId: v.id("kolaborasiCrm"),
    type: v.optional(v.string()), // "solid", "dashed", "dotted"
    label: v.optional(v.string()), // "reporting", "collaboration", "communication"
    color: v.optional(v.string()), // hex color
    routing: v.optional(v.string()), // "straight", "free", "siku"
  },
  handler: async (ctx, args) => {
    const fromStaff = await ctx.db.get(args.fromId);
    const toStaff = await ctx.db.get(args.toId);

    if (!fromStaff || !toStaff) {
      throw new Error("Staff not found");
    }

    // Check if connection already exists
    const existingConnection = fromStaff.connections?.find(
      (conn: any) => typeof conn === 'object' && conn.targetId === args.toId
    );
    if (existingConnection) {
      throw new Error("Connection already exists");
    }

    // Create connection object
    const connectionData = {
      targetId: args.toId,
      type: args.type || "solid",
      label: args.label || "collaboration",
      color: args.color || "#8b5cf6",
      routing: args.routing || "straight",
    };

    // Add connection to fromStaff
    await ctx.db.patch(args.fromId, {
      connections: [...(fromStaff.connections || []), connectionData],
      updatedAt: Date.now(),
    });

    // Add reverse connection to toStaff
    await ctx.db.patch(args.toId, {
      connections: [...(toStaff.connections || []), {
        ...connectionData,
        targetId: args.fromId,
      }],
      updatedAt: Date.now(),
    });

    return { fromId: args.fromId, toId: args.toId };
  },
});

// Update connection metadata
export const updateConnection = mutation({
  args: {
    fromId: v.id("kolaborasiCrm"),
    toId: v.id("kolaborasiCrm"),
    type: v.optional(v.string()),
    label: v.optional(v.string()),
    color: v.optional(v.string()),
    routing: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fromStaff = await ctx.db.get(args.fromId);
    const toStaff = await ctx.db.get(args.toId);

    if (!fromStaff || !toStaff) {
      throw new Error("Staff not found");
    }

    // Update connection on fromStaff
    const updatedConnectionsFrom = fromStaff.connections?.map((conn: any) => {
      if (typeof conn === 'object' && conn.targetId === args.toId) {
        return {
          ...conn,
          ...(args.type !== undefined && { type: args.type }),
          ...(args.label !== undefined && { label: args.label }),
          ...(args.color !== undefined && { color: args.color }),
          ...(args.routing !== undefined && { routing: args.routing }),
        };
      }
      return conn;
    }) || [];

    await ctx.db.patch(args.fromId, {
      connections: updatedConnectionsFrom,
      updatedAt: Date.now(),
    });

    // Update reverse connection on toStaff
    const updatedConnectionsTo = toStaff.connections?.map((conn: any) => {
      if (typeof conn === 'object' && conn.targetId === args.fromId) {
        return {
          ...conn,
          ...(args.type !== undefined && { type: args.type }),
          ...(args.label !== undefined && { label: args.label }),
          ...(args.color !== undefined && { color: args.color }),
          ...(args.routing !== undefined && { routing: args.routing }),
        };
      }
      return conn;
    }) || [];

    await ctx.db.patch(args.toId, {
      connections: updatedConnectionsTo,
      updatedAt: Date.now(),
    });

    return { fromId: args.fromId, toId: args.toId };
  },
});

// Remove connection between two staff
export const removeConnection = mutation({
  args: {
    fromId: v.id("kolaborasiCrm"),
    toId: v.id("kolaborasiCrm"),
  },
  handler: async (ctx, args) => {
    const fromStaff = await ctx.db.get(args.fromId);
    const toStaff = await ctx.db.get(args.toId);

    if (!fromStaff || !toStaff) {
      throw new Error("Staff not found");
    }

    // Remove connection from fromStaff
    const filteredFrom = fromStaff.connections?.filter((conn: any) => {
      const targetId = typeof conn === 'object' ? conn.targetId : conn;
      return targetId !== args.toId;
    }) || [];

    await ctx.db.patch(args.fromId, {
      connections: filteredFrom,
      updatedAt: Date.now(),
    });

    // Remove reverse connection from toStaff
    const filteredTo = toStaff.connections?.filter((conn: any) => {
      const targetId = typeof conn === 'object' ? conn.targetId : conn;
      return targetId !== args.fromId;
    }) || [];

    await ctx.db.patch(args.toId, {
      connections: filteredTo,
      updatedAt: Date.now(),
    });

    return { fromId: args.fromId, toId: args.toId };
  },
});
