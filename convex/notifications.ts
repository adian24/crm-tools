import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CREATE - Create notification
export const createNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    userId: v.optional(v.id("users")), // If not specified, it's a broadcast notification
    targetId: v.optional(v.id("targets")), // Related target for context
    actionUrl: v.optional(v.string()), // URL for action button
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: now,
    });

    return notificationId;
  },
});

// Create automatic notifications for various events
export const createTargetNotification = mutation({
  args: {
    targetId: v.id("targets"),
    action: v.union(v.literal("created"), v.literal("updated"), v.literal("status_changed")),
    oldStatus: v.optional(v.union(v.literal("TO_DO"), v.literal("VISITED"))),
    newStatus: v.optional(v.union(v.literal("TO_DO"), v.literal("VISITED"))),
    changed_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      return;
    }

    const picUser = await ctx.db.get(target.pic);
    const changedByUser = await ctx.db.get(args.changed_by);

    let title = "";
    let message = "";
    let type: "info" | "success" | "warning" | "error" = "info";
    let actionUrl = `/targets/${args.targetId}`;

    switch (args.action) {
      case "created":
        title = "Target Baru Ditambahkan";
        message = `${changedByUser?.name} menambahkan target baru untuk ${target.client}`;
        type = "success";
        break;

      case "updated":
        title = "Target Diperbarui";
        message = `${changedByUser?.name} memperbarui informasi target ${target.client}`;
        type = "info";
        break;

      case "status_changed":
        title = "Status Kunjungan Berubah";
        message = `Target ${target.client} berubah dari ${args.oldStatus} menjadi ${args.newStatus} oleh ${changedByUser?.name}`;
        type = args.newStatus === "VISITED" ? "success" : "warning";
        break;
    }

    // Create notification for the target PIC
    if (picUser && picUser._id !== args.changed_by) {
      await ctx.db.insert("notifications", {
        title,
        message,
        type,
        userId: picUser._id,
        targetId: args.targetId,
        actionUrl,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    // Create notification for managers (for important events)
    if (args.action === "status_changed" && args.newStatus === "VISITED") {
      const managers = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "manager"))
        .collect();

      for (const manager of managers) {
        if (manager._id !== args.changed_by) {
          await ctx.db.insert("notifications", {
            title: "Kunjungan Selesai",
            message: `${picUser?.name || "Staff"} telah menyelesaikan kunjungan ke ${target.client}`,
            type: "success",
            userId: manager._id,
            targetId: args.targetId,
            actionUrl,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return "Notifications created successfully";
  },
});

// READ - Get notifications for a user
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId));

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    // Enrich with target details if targetId exists
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let targetDetails = null;
        if (notification.targetId) {
          const target = await ctx.db.get(notification.targetId);
          if (target) {
            targetDetails = {
              client: target.client,
              statusKunjungan: target.statusKunjungan,
            };
          }
        }

        return {
          ...notification,
          targetDetails,
        };
      })
    );

    return enrichedNotifications;
  },
});

// READ - Get all notifications (for admins)
export const getAllNotifications = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || (user.role !== "manager" && user.role !== "super_admin")) {
      throw new Error("Access denied");
    }

    const allNotifications = await ctx.db.query("notifications").collect();

    let notifications = allNotifications;
    if (args.type) {
      notifications = allNotifications.filter(notification => notification.type === args.type);
    }

    notifications = notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit || 100);

    return notifications;
  },
});

// UPDATE - Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if user has permission to mark this notification
    if (notification.userId && notification.userId !== args.userId) {
      throw new Error("Access denied");
    }

    const updatedNotification = await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return updatedNotification;
  },
});

// UPDATE - Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    // Mark each notification as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return `${unreadNotifications.length} notifications marked as read`;
  },
});

// DELETE - Delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if user has permission to delete this notification
    if (notification.userId && notification.userId !== args.userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.notificationId);

    return "Notification deleted successfully";
  },
});

// DELETE - Clear all notifications for a user
export const clearAllNotifications = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId))
      .collect();

    for (const notification of userNotifications) {
      await ctx.db.delete(notification._id);
    }

    return `${userNotifications.length} notifications cleared`;
  },
});

// Get unread count for a user
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});