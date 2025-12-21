import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CREATE - Add new target/client
export const createTarget = mutation({
  args: {
    client: v.string(),
    address: v.string(),
    pic: v.id("users"),
    scheduleVisit: v.string(), // Format: YYYY-MM-DD
    nilaiKontrak: v.number(),
    statusClient: v.union(v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
    statusKunjungan: v.union(v.literal("TO_DO"), v.literal("VISITED")),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.string(),
    created_by: v.id("users"),
    visitTime: v.optional(v.string()), // Format: HH:MM
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const targetId = await ctx.db.insert("targets", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "create",
      entity: "targets",
      entityId: targetId,
      entityTableName: "targets",
      userId: args.created_by,
      createdAt: now,
    });

    return targetId;
  },
});

// READ - Get all targets (with optional filtering)
export const getTargets = query({
  args: {
    userId: v.optional(v.id("users")), // Filter by user role
    statusClient: v.optional(v.union(v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND"))),
    statusKunjungan: v.optional(v.union(v.literal("TO_DO"), v.literal("VISITED"))),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("targets");

    // Get all targets and filter in application code
    const allTargets = await query.collect();

    // Apply filters
    let targets = allTargets;
    if (args.statusClient) {
      targets = allTargets.filter(target => target.statusClient === args.statusClient);
    } else if (args.statusKunjungan) {
      targets = allTargets.filter(target => target.statusKunjungan === args.statusKunjungan);
    }

    // If userId is provided, filter based on user role
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        if (user.role === "staff") {
          // Staff can only see their own targets
          return targets.filter(target => target.pic === args.userId);
        } else if (user.role === "manager") {
          // Manager can see all targets
          return targets;
        }
        // Super admin can see all targets
      }
    }

    return targets;
  },
});

// READ - Get single target by ID
export const getTargetById = query({
  args: {
    targetId: v.id("targets"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      return null;
    }

    // Fetch PIC details
    const pic = await ctx.db.get(target.pic);

    return {
      ...target,
      picDetails: pic ? {
        name: pic.name,
        email: pic.email,
        staffId: pic.staffId,
      } : null,
    };
  },
});

// UPDATE - Update target
export const updateTarget = mutation({
  args: {
    targetId: v.id("targets"),
    updates: v.object({
      client: v.optional(v.string()),
      address: v.optional(v.string()),
      pic: v.optional(v.id("users")),
      scheduleVisit: v.optional(v.string()),
      statusClient: v.optional(v.union(v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND"))),
      statusKunjungan: v.optional(v.union(v.literal("TO_DO"), v.literal("VISITED"))),
      nilaiKontrak: v.optional(v.number()),
      contactPerson: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      location: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      salesAmount: v.optional(v.number()),
      notes: v.optional(v.string()),
      visitTime: v.optional(v.string()),
      updated_by: v.id("users"),
    }),
  },
  handler: async (ctx, args) => {
    const { targetId, updates } = args;

    // Get current target for comparison
    const existingTarget = await ctx.db.get(targetId);
    if (!existingTarget) {
      throw new Error("Target not found");
    }

    // If status is changing, add to visit history
    if (updates.statusKunjungan && updates.statusKunjungan !== existingTarget.statusKunjungan) {
      await ctx.db.insert("visitHistory", {
        targetId,
        oldStatus: existingTarget.statusKunjungan,
        newStatus: updates.statusKunjungan,
        changed_by: updates.updated_by,
        createdAt: Date.now(),
      });
    }

    const now = Date.now();
    const updatedTarget = await ctx.db.patch(targetId, {
      ...updates,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "update",
      entity: "targets",
      entityId: targetId,
      entityTableName: "targets",
      userId: updates.updated_by,
      createdAt: now,
    });

    return updatedTarget;
  },
});

// DELETE - Delete target
export const deleteTarget = mutation({
  args: {
    targetId: v.id("targets"),
    deleted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      throw new Error("Target not found");
    }

    // Delete target (soft delete by updating status, or hard delete)
    await ctx.db.delete(args.targetId);

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "delete",
      entity: "targets",
      entityId: args.targetId,
      entityTableName: "targets",
      details: { deletedTargetName: target.client },
      userId: args.deleted_by,
      createdAt: Date.now(),
    });

    return "Target deleted successfully";
  },
});

// Get targets for calendar view (next 30 days)
export const getUpcomingTargets = query({
  args: {
    userId: v.optional(v.id("users")),
    days: v.optional(v.number()), // Number of days ahead, default 30
  },
  handler: async (ctx, args) => {
    const today = new Date();
    const daysAhead = args.days || 30;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysAhead);

    const targets = await ctx.db
      .query("targets")
      .withIndex("by_scheduleVisit", (q) =>
        q.gte("scheduleVisit", today.toISOString().split('T')[0])
          .lte("scheduleVisit", endDate.toISOString().split('T')[0])
      )
      .collect();

    // Filter by user role if needed
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user && user.role === "staff") {
        return targets.filter(target => target.pic === args.userId);
      }
    }

    return targets.sort((a, b) => a.scheduleVisit.localeCompare(b.scheduleVisit));
  },
});

// Get target statistics for dashboard
export const getTargetStats = query({
  args: {
    userId: v.optional(v.id("users")),
    year: v.optional(v.number()),
    month: v.optional(v.number()), // 1-12 for monthly stats
  },
  handler: async (ctx, args) => {
    const currentYear = args.year || new Date().getFullYear();
    const filters: any = {};

    // Build date range filter
    if (args.month) {
      // Monthly stats
      const firstDay = `${currentYear}-${String(args.month).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, args.month, 0).toISOString().split('T')[0];
      filters.scheduleVisit = [firstDay, lastDay];
    } else {
      // Yearly stats
      const firstDay = `${currentYear}-01-01`;
      const lastDay = `${currentYear}-12-31`;
      filters.scheduleVisit = [firstDay, lastDay];
    }

    let query = ctx.db.query("targets");

    // Apply date range filter (this would need custom implementation since Convex doesn't support range queries directly)
    const allTargets = await query.collect();

    // Filter by date range in application code
    const filteredTargets = allTargets.filter(target => {
      const targetDate = target.scheduleVisit;
      const [from, to] = filters.scheduleVisit;
      return targetDate >= from && targetDate <= to;
    });

    // Filter by user role if needed
    let userTargets = filteredTargets;
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user && user.role === "staff") {
        userTargets = filteredTargets.filter(target => target.pic === args.userId);
      }
    }

    // Calculate statistics
    const total = userTargets.length;
    const visited = userTargets.filter(t => t.statusKunjungan === "VISITED").length;
    const todo = userTargets.filter(t => t.statusKunjungan === "TO_DO").length;
    const lanjut = userTargets.filter(t => t.statusClient === "LANJUT").length;
    const loss = userTargets.filter(t => t.statusClient === "LOSS").length;
    const suspend = userTargets.filter(t => t.statusClient === "SUSPEND").length;

    return {
      total,
      visited,
      todo,
      completionRate: total > 0 ? (visited / total) * 100 : 0,
      statusClient: {
        LANJUT: lanjut,
        LOSS: loss,
        SUSPEND: suspend,
      },
    };
  },
});

// BULK IMPORT - Import multiple targets from Excel
export const bulkImportTargets = mutation({
  args: {
    targets: v.array(v.object({
      client: v.string(),
      address: v.string(),
      picName: v.string(), // Staff name from Excel
      scheduleVisit: v.string(),
      visitTime: v.optional(v.string()),
      statusClient: v.union(v.literal("LANJUT"), v.literal("LOSS"), v.literal("SUSPEND")),
      nilaiKontrak: v.number(),
      statusKunjungan: v.union(v.literal("TO_DO"), v.literal("VISITED")),
      contactPerson: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      location: v.string(),
      photoUrl: v.optional(v.string()),
      salesAmount: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
    imported_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      importedIds: [] as string[],
    };

    // Get all users to map staff names to IDs
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map(user => [user.name.toLowerCase(), user._id]));

    for (let i = 0; i < args.targets.length; i++) {
      const targetData = args.targets[i];

      try {
        // Find user ID from staff name
        const userId = userMap.get(targetData.picName.toLowerCase());
        if (!userId) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Staff "${targetData.picName}" tidak ditemukan`);
          continue;
        }

        // Validate required fields
        if (!targetData.client.trim()) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Client name is required`);
          continue;
        }

        if (!targetData.address.trim()) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Address is required`);
          continue;
        }

        if (!targetData.scheduleVisit.trim()) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Schedule visit date is required`);
          continue;
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(targetData.scheduleVisit)) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Invalid date format. Use YYYY-MM-DD`);
          continue;
        }

        // Validate time format if provided
        if (targetData.visitTime) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(targetData.visitTime)) {
            results.failed++;
            results.errors.push(`Baris ${i + 1}: Invalid time format. Use HH:MM`);
            continue;
          }
        }

        // Insert target
        const targetId = await ctx.db.insert("targets", {
          client: targetData.client.trim(),
          address: targetData.address.trim(),
          pic: userId,
          scheduleVisit: targetData.scheduleVisit,
          visitTime: targetData.visitTime,
          statusClient: targetData.statusClient,
          nilaiKontrak: targetData.nilaiKontrak,
          statusKunjungan: targetData.statusKunjungan,
          contactPerson: targetData.contactPerson?.trim(),
          contactPhone: targetData.contactPhone?.trim(),
          location: targetData.location.trim(),
          photoUrl: targetData.photoUrl?.trim(),
          salesAmount: targetData.salesAmount,
          notes: targetData.notes?.trim(),
          created_by: args.imported_by,
          createdAt: now,
          updatedAt: now,
        });

        results.success++;
        results.importedIds.push(targetId);

        // Log activity for each successful import
        await ctx.db.insert("activityLogs", {
          action: "bulk_import",
          entity: "targets",
          entityId: targetId,
          entityTableName: "targets",
          details: {
            rowIndex: i + 1,
            clientName: targetData.client,
            staffName: targetData.picName,
          },
          userId: args.imported_by,
          createdAt: now,
        });

      } catch (error) {
        results.failed++;
        results.errors.push(`Baris ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create notification for bulk import completion
    await ctx.db.insert("notifications", {
      title: "Import Excel Selesai",
      message: `Berhasil mengimport ${results.success} target${results.failed > 0 ? ` dengan ${results.failed} gagal` : ''}`,
      type: results.failed > 0 ? "warning" : "success",
      isRead: false,
      userId: args.imported_by,
      createdAt: now,
    });

    return results;
  },
});