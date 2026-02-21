import { mutation } from "./_generated/server";

// Temporarily clear all connections
export const clearAllConnections = mutation({
  handler: async (ctx) => {
    const allStaff = await ctx.db.query("strukturDivisiCrp").collect();

    for (const staff of allStaff) {
      await ctx.db.patch(staff._id, {
        connections: [],
        updatedAt: Date.now(),
      });
    }

    return { success: true, count: allStaff.length };
  },
});
