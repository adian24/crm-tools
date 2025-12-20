import { mutation } from "./_generated/server";

export const migrateUsers = mutation({
  handler: async (ctx) => {
    // Get all existing users
    const users = await ctx.db.query("users").collect();

    let updatedCount = 0;

    for (const user of users) {
      // Check if user already has the new fields
      if (user.targetYearly === undefined || user.completedThisYear === undefined) {
        await ctx.db.patch(user._id, {
          targetYearly: user.targetYearly ?? (user.role === "staff" ? 100 : 0),
          completedThisYear: user.completedThisYear ?? 0,
        });
        updatedCount++;
      }
    }

    return `Successfully migrated ${updatedCount} users`;
  },
});