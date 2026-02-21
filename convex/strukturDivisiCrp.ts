import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

// Get all active staff
export const getAllStaff = query({
  handler: async (ctx) => {
    const staff = await ctx.db
      .query("strukturDivisiCrp")
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
  args: { id: v.id("strukturDivisiCrp") },
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
    keterangan: v.optional(v.string()),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const staffId = await ctx.db.insert("strukturDivisiCrp", {
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
    id: v.id("strukturDivisiCrp"),
    nama: v.optional(v.string()),
    fotoUrl: v.optional(v.string()),
    jabatan: v.optional(v.string()),
    keterangan: v.optional(v.string()),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
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
    if (updateData.keterangan !== undefined) updates.keterangan = updateData.keterangan;
    if (updateData.positionX !== undefined) updates.positionX = updateData.positionX;
    if (updateData.positionY !== undefined) updates.positionY = updateData.positionY;
    if (updateData.isActive !== undefined) updates.isActive = updateData.isActive;

    updates.updatedAt = Date.now();

    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete staff (soft delete)
export const deleteStaff = mutation({
  args: { id: v.id("strukturDivisiCrp") },
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
    id: v.id("strukturDivisiCrp"),
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

// Add connection between two staff with metadata
export const addConnection = mutation({
  args: {
    fromId: v.id("strukturDivisiCrp"),
    toId: v.id("strukturDivisiCrp"),
    type: v.optional(v.string()), // "solid", "dashed", "dotted"
    label: v.optional(v.string()), // "reporting", "collaboration", "communication"
    color: v.optional(v.string()), // hex color
    routing: v.optional(v.string()), // "straight", "free", "siku", "custom"
    fromConnector: v.optional(v.string()), // "top", "bottom", "left", "right"
    toConnector: v.optional(v.string()), // "top", "bottom", "left", "right"
    controlPoints: v.optional(v.array(v.object({
      x: v.number(),
      y: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const fromStaff = await ctx.db.get(args.fromId);
    const toStaff = await ctx.db.get(args.toId);

    if (!fromStaff || !toStaff) {
      throw new Error("Staff not found");
    }

    // Check if connection already exists (in either direction)
    const existingConnectionFrom = fromStaff.connections?.find(
      (conn: any) => {
        const targetId = typeof conn === 'object' ? conn.targetId : conn;
        return targetId === args.toId;
      }
    );

    const existingConnectionTo = toStaff.connections?.find(
      (conn: any) => {
        const targetId = typeof conn === 'object' ? conn.targetId : conn;
        return targetId === args.fromId;
      }
    );

    if (existingConnectionFrom || existingConnectionTo) {
      // Return success but don't create duplicate
      return { fromId: args.fromId, toId: args.toId, alreadyExists: true };
    }

    // Create connection object
    const connectionData = {
      targetId: args.toId,
      type: args.type || "solid",
      label: args.label || "reporting",
      color: args.color || "#3b82f6",
      routing: args.routing || "straight",
      fromConnector: args.fromConnector,
      toConnector: args.toConnector,
      controlPoints: args.controlPoints,
    };

    // Add connection ONLY from fromId to toId (unidirectional, respects drag direction)
    await ctx.db.patch(args.fromId, {
      connections: [...(fromStaff.connections || []), connectionData],
      updatedAt: Date.now(),
    });

    return { fromId: args.fromId, toId: args.toId, alreadyExists: false };
  },
});

// Update connection metadata
export const updateConnection = mutation({
  args: {
    fromId: v.id("strukturDivisiCrp"),
    toId: v.id("strukturDivisiCrp"),
    type: v.optional(v.string()),
    label: v.optional(v.string()),
    color: v.optional(v.string()),
    routing: v.optional(v.string()),
    controlPoints: v.optional(v.array(v.object({
      x: v.number(),
      y: v.number(),
    }))),
    verticalOffset: v.optional(v.number()),
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
          ...(args.controlPoints !== undefined && { controlPoints: args.controlPoints }),
          ...(args.verticalOffset !== undefined && { verticalOffset: args.verticalOffset }),
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
          ...(args.controlPoints !== undefined && { controlPoints: args.controlPoints }),
          ...(args.verticalOffset !== undefined && { verticalOffset: args.verticalOffset }),
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

// Update control points for a connection (for dragging control points)
export const updateConnectionControlPoints = mutation({
  args: {
    fromId: v.id("strukturDivisiCrp"),
    toId: v.id("strukturDivisiCrp"),
    controlPoints: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
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
          controlPoints: args.controlPoints,
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
          controlPoints: args.controlPoints,
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

// Clear all connections (for fixing corrupted data)
export const clearAllConnections = mutation({
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("strukturDivisiCrp").collect();

    for (const staff of allStaff) {
      if (staff.connections && staff.connections.length > 0) {
        await ctx.db.patch(staff._id, {
          connections: [],
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true, count: allStaff.length };
  },
});

// Remove connection between two staff
export const removeConnection = mutation({
  args: {
    fromId: v.id("strukturDivisiCrp"),
    toId: v.id("strukturDivisiCrp"),
  },
  handler: async (ctx, args) => {
    const fromStaff = await ctx.db.get(args.fromId);
    const toStaff = await ctx.db.get(args.toId);

    if (!fromStaff || !toStaff) {
      throw new Error("Staff not found");
    }

    // Remove connection only from fromId (unidirectional)
    const filteredFrom = fromStaff.connections?.filter((conn: any) => {
      const targetId = typeof conn === 'object' ? conn.targetId : conn;
      return targetId !== args.toId;
    }) || [];

    await ctx.db.patch(args.fromId, {
      connections: filteredFrom,
      updatedAt: Date.now(),
    });

    return { fromId: args.fromId, toId: args.toId };
  },
});
