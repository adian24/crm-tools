import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for bukti kunjungan foto
export const generateUploadUrl = mutation({
  args: {
    // No args needed - we'll return a generic upload URL
  },
  handler: async (ctx) => {
    // For now, return a placeholder
    // In production, you would use Convex storage or a service like UploadThing, Cloudinary, etc.
    const uploadUrl = `${process.env.CONVEX_SITE_URL}/api/upload`;
    return { uploadUrl };
  },
});

// Update foto bukti kunjungan URL after upload
export const updateBuktiKunjunganUrl = mutation({
  args: {
    crmTargetId: v.id("crmTargets"),
    fotoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { crmTargetId, fotoUrl } = args;

    // Update the CRM target with the new photo URL
    await ctx.db.patch(crmTargetId, {
      fotoBuktiKunjungan: fotoUrl,
      updatedAt: Date.now(),
    });

    return { success: true, fotoUrl };
  },
});
