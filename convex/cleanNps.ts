import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Clean up old NPS data - delete all documents
export const cleanAllNPS = mutation({
  args: {},
  handler: async (ctx) => {
    const allNps = await ctx.db.query("nps").collect();

    let deletedCount = 0;
    for (const nps of allNps) {
      await ctx.db.delete(nps._id);
      deletedCount++;
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} old NPS records`,
      deletedCount,
    };
  },
});
