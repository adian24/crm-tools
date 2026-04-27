import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const BULAN_LIST = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
] as const;

const BULAN_NORM: Record<string, string> = {
  januari: "Januari", februari: "Februari", maret: "Maret",
  april: "April", mei: "Mei", juni: "Juni",
  juli: "Juli", agustus: "Agustus", september: "September",
  oktober: "Oktober", november: "November", desember: "Desember",
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const getMonthlySummaryByTahun = query({
  args: { tahun: v.number() },
  handler: async (ctx, { tahun }) => {
    return ctx.db
      .query("monthly_summary")
      .withIndex("by_tahun", q => q.eq("tahun", tahun))
      .collect();
  },
});

export const getMultiYearMonthlyStats = query({
  args: { kategori_produk: v.optional(v.string()) },
  handler: async (ctx, { kategori_produk }) => {
    // Init semua 12 bulan dengan nilai 0
    const result: Record<string, { bulan: string; y2024: number; y2025: number; y2026: number }> =
      Object.fromEntries(
        BULAN_LIST.map(b => [b, { bulan: b, y2024: 0, y2025: 0, y2026: 0 }])
      );

    // ── Data 2024 & 2025 dari monthly_summary ─────────────────────────────────
    const historis = await ctx.db.query("monthly_summary").collect();
    for (const row of historis) {
      if (row.tahun !== 2024 && row.tahun !== 2025) continue;
      if (kategori_produk && row.kategori_produk !== kategori_produk) continue;
      if (!result[row.bulan]) continue;
      const key = row.tahun === 2024 ? "y2024" : "y2025";
      result[row.bulan][key] += row.nilai_bersih;
    }

    // ── Data 2026 dari crmTargets ─────────────────────────────────────────────
    const crm2026 = await ctx.db.query("crmTargets").collect();
    for (const row of crm2026) {
      if (row.tahun !== "2026") continue;
      if (row.status !== "DONE") continue;
      if (kategori_produk && row.produk !== kategori_produk) continue;
      const bulan = BULAN_NORM[row.bulanExpDate?.toLowerCase().trim() ?? ""];
      if (!bulan || !result[bulan]) continue;
      const nilai = (row.hargaTerupdate ?? row.hargaKontrak ?? 0);
      result[bulan].y2026 += nilai;
    }

    return BULAN_LIST.map(b => result[b]);
  },
});

// ── Mutation ──────────────────────────────────────────────────────────────────

export const upsertMonthlySummary = mutation({
  args: {
    tahun: v.number(),
    bulan: v.union(
      v.literal("Januari"), v.literal("Februari"), v.literal("Maret"),
      v.literal("April"), v.literal("Mei"), v.literal("Juni"),
      v.literal("Juli"), v.literal("Agustus"), v.literal("September"),
      v.literal("Oktober"), v.literal("November"), v.literal("Desember")
    ),
    kategori_produk: v.string(),
    nilai_bersih: v.number(),
  },
  handler: async (ctx, { tahun, bulan, kategori_produk, nilai_bersih }) => {
    const existing = await ctx.db
      .query("monthly_summary")
      .withIndex("by_tahun_bulan", q => q.eq("tahun", tahun).eq("bulan", bulan))
      .filter(q => q.eq(q.field("kategori_produk"), kategori_produk))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { nilai_bersih, updatedAt: now });
      return existing._id;
    } else {
      return ctx.db.insert("monthly_summary", {
        tahun, bulan, kategori_produk, nilai_bersih,
        createdAt: now, updatedAt: now,
      });
    }
  },
});
