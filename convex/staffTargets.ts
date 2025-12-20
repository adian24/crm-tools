import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CREATE - Set staff target for a period
export const createStaffTarget = mutation({
  args: {
    userId: v.id("users"),
    year: v.number(),
    month: v.optional(v.number()), // 0-11 (Jan-Dec), null for yearly target
    targetAmount: v.number(),
    bonus: v.optional(v.number()),
    notes: v.optional(v.string()),
    created_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const staffTargetId = await ctx.db.insert("staffTargets", {
      ...args,
      actualAmount: 0, // Start with 0 actual visits
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "create",
      entity: "staffTargets",
      entityId: staffTargetId,
      entityTableName: "staffTargets",
      userId: args.created_by,
      createdAt: now,
    });

    return staffTargetId;
  },
});

// READ - Get staff targets
export const getStaffTargets = query({
  args: {
    userId: v.optional(v.id("users")), // Filter by specific user
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    role: v.optional(v.union(v.literal("staff"), v.literal("manager"), v.literal("super_admin"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("staffTargets");

    // Apply filters
    const targets = await query.collect();
    let filteredTargets = targets;

    if (args.userId && args.year) {
      filteredTargets = targets.filter(target =>
        target.userId === args.userId && target.year === args.year &&
        (args.month === undefined || target.month === args.month)
      );
    } else if (args.userId) {
      filteredTargets = targets.filter(target => target.userId === args.userId);
    } else if (args.year) {
      filteredTargets = targets.filter(target =>
        target.year === args.year &&
        (args.month === undefined || target.month === args.month)
      );
    }

    // Fetch user details for each target
    const targetsWithUserDetails = await Promise.all(
      filteredTargets.map(async (target) => {
        const user = await ctx.db.get(target.userId);
        return {
          ...target,
          userDetails: user ? {
            name: user.name,
            email: user.email,
            staffId: user.staffId,
            role: user.role,
          } : null,
        };
      })
    );

    // Filter by role if specified
    if (args.role) {
      return targetsWithUserDetails.filter(target =>
        target.userDetails?.role === args.role
      );
    }

    return targetsWithUserDetails;
  },
});

// READ - Get staff target by ID
export const getStaffTargetById = query({
  args: {
    targetId: v.id("staffTargets"),
  },
  handler: async (ctx, args) => {
    const staffTarget = await ctx.db.get(args.targetId);
    if (!staffTarget) {
      return null;
    }

    // Fetch user details
    const user = await ctx.db.get(staffTarget.userId);

    return {
      ...staffTarget,
      userDetails: user ? {
        name: user.name,
        email: user.email,
        staffId: user.staffId,
        role: user.role,
      } : null,
    };
  },
});

// UPDATE - Update staff target or actual amount
export const updateStaffTarget = mutation({
  args: {
    targetId: v.id("staffTargets"),
    updates: v.object({
      targetAmount: v.optional(v.number()),
      actualAmount: v.optional(v.number()),
      bonus: v.optional(v.number()),
      notes: v.optional(v.string()),
      updated_by: v.id("users"),
    }),
  },
  handler: async (ctx, args) => {
    const { targetId, updates } = args;

    const existingTarget = await ctx.db.get(targetId);
    if (!existingTarget) {
      throw new Error("Staff target not found");
    }

    const now = Date.now();
    const updatedTarget = await ctx.db.patch(targetId, {
      ...updates,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "update",
      entity: "staffTargets",
      entityId: targetId,
      entityTableName: "staffTargets",
      userId: updates.updated_by,
      createdAt: now,
    });

    return updatedTarget;
  },
});

// DELETE - Delete staff target
export const deleteStaffTarget = mutation({
  args: {
    targetId: v.id("staffTargets"),
    deleted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      throw new Error("Staff target not found");
    }

    await ctx.db.delete(args.targetId);

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "delete",
      entity: "staffTargets",
      entityId: args.targetId,
      entityTableName: "staffTargets",
      details: { deletedTargetFor: target.userId },
      userId: args.deleted_by,
      createdAt: Date.now(),
    });

    return "Staff target deleted successfully";
  },
});

// Update actual amount (visited clients) for a staff target
export const updateActualAmount = mutation({
  args: {
    targetId: v.id("staffTargets"),
    increment: v.number(), // Number to add (can be negative to subtract)
    updated_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      throw new Error("Staff target not found");
    }

    const newActualAmount = target.actualAmount + args.increment;
    const now = Date.now();

    const updatedTarget = await ctx.db.patch(args.targetId, {
      actualAmount: newActualAmount,
      updatedAt: now,
    });

    // Also update user's completed this year count
    const user = await ctx.db.get(target.userId);
    if (user && target.month === undefined) { // Only update yearly targets
      await ctx.db.patch(target.userId, {
        completedThisYear: user.completedThisYear + args.increment,
        updatedAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("activityLogs", {
      action: "update_actual_amount",
      entity: "staffTargets",
      entityId: args.targetId,
      entityTableName: "staffTargets",
      details: { increment: args.increment, newAmount: newActualAmount },
      userId: args.updated_by,
      createdAt: now,
    });

    return updatedTarget;
  },
});

// Get staff performance summary
export const getStaffPerformance = query({
  args: {
    year: v.optional(v.number()),
    role: v.optional(v.union(v.literal("staff"), v.literal("manager"), v.literal("super_admin"))),
  },
  handler: async (ctx, args) => {
    const currentYear = args.year || new Date().getFullYear();

    // Get all users with staff role or specified role
    let usersQuery = ctx.db.query("users").filter((q) => q.eq(q.field("isActive"), true));

    const users = await usersQuery.collect();
    const filteredUsers = args.role
      ? users.filter(u => u.role === args.role)
      : users.filter(u => u.role === "staff" || u.role === "manager");

    // Get performance data for each user
    const performanceData = await Promise.all(
      filteredUsers.map(async (user) => {
        // Get staff targets for this year
        const targets = await ctx.db
          .query("staffTargets")
          .withIndex("by_user_year", (q) => q.eq("userId", user._id).eq("year", currentYear))
          .collect();

        // Calculate totals
        const totalTarget = targets.reduce((sum, target) => sum + target.targetAmount, 0);
        const totalActual = targets.reduce((sum, target) => sum + target.actualAmount, 0);
        const completionRate = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

        // Get visit count from targets table
        const userTargets = await ctx.db
          .query("targets")
          .withIndex("by_pic", (q) => q.eq("pic", user._id))
          .collect();

        const visitedCount = userTargets.filter(target => target.statusKunjungan === "VISITED").length;
        const todoCount = userTargets.filter(target => target.statusKunjungan === "TO_DO").length;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          staffId: user.staffId,
          role: user.role,
          targetYearly: user.targetYearly,
          completedThisYear: user.completedThisYear,
          yearlyCompletionRate: user.targetYearly > 0 ? (user.completedThisYear / user.targetYearly) * 100 : 0,
          periodTargets: {
            totalTarget,
            totalActual,
            completionRate,
            targetCount: targets.length,
          },
          visits: {
            visited: visitedCount,
            todo: todoCount,
            total: userTargets.length,
          },
        };
      })
    );

    return performanceData.sort((a, b) => b.yearlyCompletionRate - a.yearlyCompletionRate);
  },
});