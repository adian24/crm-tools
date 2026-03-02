import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// === QUERIES ===

// Get paginated CRM targets (more efficient than loading all)
export const getCrmNewClientsPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("crmNewClient")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      page: results.page,
      continueCursor: results.continueCursor,
    };
  },
});

// Get all CRM targets (alias for getCrmNewClients)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const crmNewClient = await ctx.db.query("crmNewClient").collect();
    return crmNewClient;
  },
});

// Get all CRM targets (optimized with lean data)
export const getCrmNewClients = query({
  args: {},
  handler: async (ctx) => {
    const crmNewClient = await ctx.db.query("crmNewClient").collect();
    // Return data immediately without processing
    return crmNewClient;
  },
});

// Alias for getAllNewClients (used in components)
export const getAllNewClients = getCrmNewClients;

// Get visited new clients (statusKunjungan = "VISITED" and has tanggalKunjungan)
export const getVisitedNewClients = query({
  args: {},
  handler: async (ctx) => {
    const crmNewClients = await ctx.db.query("crmNewClient").collect();
    // Filter only VISITED status and has tanggalKunjungan
    return crmNewClients.filter((client) => {
      return client.statusKunjungan === "VISITED" && client.tanggalKunjungan;
    });
  },
});

// Get CRM target by ID
export const getCrmNewClient = query({
  args: { id: v.id("crmNewClient") },
  handler: async (ctx, args) => {
    const crmTarget = await ctx.db.get(args.id);
    return crmTarget;
  },
});

// Get CRM targets by PIC CRM
export const getCrmNewClientsByPicCrm = query({
  args: { picCrm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.picCrm) {
      return [];
    }
    const crmNewClient = await ctx.db
      .query("crmNewClient")
      .withIndex("by_picCrm", (q) => q.eq("picCrm", args.picCrm!))
      .collect();
    return crmNewClient;
  },
});

// Get CRM targets by Sales
export const getCrmNewClientsBySales = query({
  args: { sales: v.string() },
  handler: async (ctx, args) => {
    const crmNewClient = await ctx.db
      .query("crmNewClient")
      .withIndex("by_sales", (q) => q.eq("sales", args.sales))
      .collect();
    return crmNewClient;
  },
});

// Get CRM targets by Status
export const getCrmNewClientsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const crmNewClient = await ctx.db
      .query("crmNewClient")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
    return crmNewClient;
  },
});

// Get CRM targets by Provinsi
export const getCrmNewClientsByProvinsi = query({
  args: { provinsi: v.string() },
  handler: async (ctx, args) => {
    const crmNewClient = await ctx.db
      .query("crmNewClient")
      .withIndex("by_provinsi", (q) => q.eq("provinsi", args.provinsi))
      .collect();
    return crmNewClient;
  },
});

// Get CRM targets by Date Range (tanggalKunjungan)
export const getCrmNewClientsByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const crmNewClient = await ctx.db
      .query("crmNewClient")
      .withIndex("by_tanggalKunjungan")
      .collect();

    // Filter by date range on the client side
    return crmNewClient.filter((target) => {
      if (!target.tanggalKunjungan) return false;
      const targetDate = new Date(target.tanggalKunjungan);
      const startDate = new Date(args.startDate);
      const endDate = new Date(args.endDate);
      return targetDate >= startDate && targetDate <= endDate;
    });
  },
});

// Get CRM targets statistics
export const getCrmNewClientsStats = query({
  args: {},
  handler: async (ctx) => {
    const crmNewClient = await ctx.db.query("crmNewClient").collect();

    const stats = {
      total: crmNewClient.length,
      byStatus: {} as Record<string, number>,
      byPicCrm: {} as Record<string, number>,
      bySales: {} as Record<string, number>,
      byProvinsi: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      visitedCount: 0,
      notYetVisitedCount: 0,
      totalHargaKontrak: 0,
    };

    crmNewClient.forEach((target) => {
      // By Status
      stats.byStatus[target.status] = (stats.byStatus[target.status] || 0) + 1;

      // By PIC CRM
      stats.byPicCrm[target.picCrm] = (stats.byPicCrm[target.picCrm] || 0) + 1;

      // By Sales
      stats.bySales[target.sales] = (stats.bySales[target.sales] || 0) + 1;

      // By Provinsi
      stats.byProvinsi[target.provinsi] = (stats.byProvinsi[target.provinsi] || 0) + 1;

      // By Category
      if (target.category) {
        stats.byCategory[target.category] = (stats.byCategory[target.category] || 0) + 1;
      }

      // By Kunjungan Status
      if (target.tanggalKunjungan) {
        stats.visitedCount++;
      } else {
        stats.notYetVisitedCount++;
      }

      // Total Harga Kontrak
      if (target.hargaKontrak) {
        stats.totalHargaKontrak += target.hargaKontrak;
      }
    });

    return stats;
  },
});

// === MUTATIONS ===

// Create CRM target
export const createCrmNewClient = mutation({
  args: {
    tahun: v.string(),
    bulanExpDate: v.string(),
    produk: v.string(),
    picCrm: v.string(),
    sales: v.string(),
    namaAssociate: v.string(),
    directOrAssociate: v.optional(v.string()),
    grup: v.optional(v.string()),
    namaPerusahaan: v.string(),
    status: v.string(),
    alasan: v.optional(v.string()),
    category: v.optional(v.string()),
    kuadran: v.optional(v.string()),
    luarKota: v.optional(v.string()),
    provinsi: v.string(),
    kota: v.string(),
    alamat: v.string(),
    akreditasi: v.optional(v.string()),
    catAkre: v.optional(v.string()),
    eaCode: v.optional(v.string()),
    std: v.optional(v.string()),
    iaDate: v.optional(v.string()),
    expDate: v.optional(v.string()),
    tahapAudit: v.optional(v.string()),
    hargaKontrak: v.optional(v.number()),
    bulanTtdNotif: v.optional(v.string()),
    hargaTerupdate: v.optional(v.number()),
    trimmingValue: v.optional(v.number()),
    lossValue: v.optional(v.number()),
    cashback: v.optional(v.number()),
    terminPembayaran: v.optional(v.string()),
    statusSertifikat: v.optional(v.string()),
    tanggalKunjungan: v.optional(v.string()),
    statusKunjungan: v.optional(v.string()),
    catatanKunjungan: v.optional(v.string()),
    fotoBuktiKunjungan: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const crmTargetId = await ctx.db.insert("crmNewClient", {
      ...args,
      createdAt: now,
      updatedAt: now,
      updated_by: args.created_by,
    });

    return crmTargetId;
  },
});

// Update CRM target
export const updateCrmNewClient = mutation({
  args: {
    id: v.id("crmNewClient"),
    tahun: v.optional(v.union(v.string(), v.null())),
    bulanExpDate: v.optional(v.union(v.string(), v.null())),
    produk: v.optional(v.union(v.string(), v.null())),
    picCrm: v.optional(v.union(v.string(), v.null())),
    sales: v.optional(v.union(v.string(), v.null())),
    namaAssociate: v.optional(v.union(v.string(), v.null())),
    directOrAssociate: v.optional(v.union(v.string(), v.null())),
    grup: v.optional(v.union(v.string(), v.null())),
    namaPerusahaan: v.optional(v.union(v.string(), v.null())),
    status: v.optional(v.union(v.string(), v.null())),
    alasan: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    kuadran: v.optional(v.union(v.string(), v.null())),
    luarKota: v.optional(v.union(v.string(), v.null())),
    provinsi: v.optional(v.union(v.string(), v.null())),
    kota: v.optional(v.union(v.string(), v.null())),
    alamat: v.optional(v.union(v.string(), v.null())),
    akreditasi: v.optional(v.union(v.string(), v.null())),
    catAkre: v.optional(v.union(v.string(), v.null())),
    eaCode: v.optional(v.union(v.string(), v.null())),
    std: v.optional(v.union(v.string(), v.null())),
    iaDate: v.optional(v.union(v.string(), v.null())),
    expDate: v.optional(v.union(v.string(), v.null())),
    tahapAudit: v.optional(v.union(v.string(), v.null())),
    hargaKontrak: v.optional(v.union(v.number(), v.null())),
    bulanTtdNotif: v.optional(v.union(v.string(), v.null())),
    hargaTerupdate: v.optional(v.union(v.number(), v.null())),
    trimmingValue: v.optional(v.union(v.number(), v.null())),
    lossValue: v.optional(v.union(v.number(), v.null())),
    cashback: v.optional(v.union(v.number(), v.null())),
    terminPembayaran: v.optional(v.union(v.string(), v.null())),
    statusSertifikat: v.optional(v.union(v.string(), v.null())),
    tanggalKunjungan: v.optional(v.union(v.string(), v.null())),
    statusKunjungan: v.optional(v.union(v.string(), v.null())),
    catatanKunjungan: v.optional(v.union(v.string(), v.null())),
    fotoBuktiKunjungan: v.optional(v.union(v.string(), v.null())),
    bulanAuditSebelumnyaSustain: v.optional(v.union(v.string(), v.null())),
    bulanAudit: v.optional(v.union(v.string(), v.null())),
    statusInvoice: v.optional(v.union(v.string(), v.null())),
    statusPembayaran: v.optional(v.union(v.string(), v.null())),
    statusKomisi: v.optional(v.union(v.string(), v.null())),
    updated_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, ...rest } = args;

    // Get existing data
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("CRM Target not found");
    }

    // Build updates object
    const updates: any = { updatedAt: Date.now() };

    // Process each field
    for (const [key, value] of Object.entries(rest)) {
      // Skip undefined fields (don't update)
      if (value === undefined) {
        continue;
      }
      // Include null fields and all other values
      updates[key] = value;
    }

    if (updated_by) {
      updates.updated_by = updated_by;
    }

    // Check if we need to unset any fields (fields with null value)
    const hasNullFields = Object.entries(rest).some(([key, value]) => value === null);

    if (hasNullFields) {
      // Use replace to fully replace the document (this will remove fields with null)
      const merged = { ...existing, ...updates };
      // Remove fields that are null in updates
      for (const [key, value] of Object.entries(rest)) {
        if (value === null) {
          delete merged[key];
        }
      }
      await ctx.db.replace(id, merged);
    } else {
      // Use patch for normal updates
      await ctx.db.patch(id, updates);
    }

    return id;
  },
});

// Delete CRM target
export const deleteCrmNewClient = mutation({
  args: { id: v.id("crmNewClient") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Bulk insert CRM targets (for Excel import)
export const bulkInsertCrmNewClients = mutation({
  args: {
    targets: v.array(
      v.object({
        tahun: v.string(),
        bulanExpDate: v.string(),
        produk: v.string(),
        picCrm: v.string(),
        sales: v.string(),
        namaAssociate: v.string(),
        directOrAssociate: v.optional(v.string()),
        grup: v.optional(v.string()),
        namaPerusahaan: v.string(),
        status: v.string(),
        alasan: v.optional(v.string()),
        category: v.optional(v.string()),
        kuadran: v.optional(v.string()),
        luarKota: v.optional(v.string()),
        provinsi: v.string(),
        kota: v.string(),
        alamat: v.string(),
        akreditasi: v.optional(v.string()),
        catAkre: v.optional(v.string()),
        eaCode: v.optional(v.string()),
        std: v.optional(v.string()),
        iaDate: v.optional(v.string()),
        expDate: v.optional(v.string()),
        tahapAudit: v.optional(v.string()),
        hargaKontrak: v.optional(v.number()),
        bulanTtdNotif: v.optional(v.string()),
        hargaTerupdate: v.optional(v.number()),
        trimmingValue: v.optional(v.number()),
        lossValue: v.optional(v.number()),
        cashback: v.optional(v.number()),
        terminPembayaran: v.optional(v.string()),
        statusSertifikat: v.optional(v.string()),
        tanggalKunjungan: v.optional(v.string()),
        statusKunjungan: v.optional(v.string()),
        catatanKunjungan: v.optional(v.string()),
        fotoBuktiKunjungan: v.optional(v.string()),
        bulanAuditSebelumnyaSustain: v.optional(v.string()),
        bulanAudit: v.optional(v.string()),
        statusInvoice: v.optional(v.union(v.literal("Terbit"), v.literal("Belum Terbit"))),
        statusPembayaran: v.optional(v.union(v.literal("Lunas"), v.literal("Belum Lunas"), v.literal("Sudah DP"))),
        statusKomisi: v.optional(v.union(v.literal("Sudah Diajukan"), v.literal("Belum Diajukan"), v.literal("Tidak Ada"))),
        created_by: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const insertedIds = [];

    for (const target of args.targets) {
      const id = await ctx.db.insert("crmNewClient", {
        ...target,
        createdAt: now,
        updatedAt: now,
        updated_by: target.created_by,
      });
      insertedIds.push(id);
    }

    return {
      insertedCount: insertedIds.length,
      ids: insertedIds,
    };
  },
});

// Fix typo in directOrAssociate field (Assosiate -> Associate)
export const fixDirectOrAssociateTypo = mutation({
  args: {},
  handler: async (ctx) => {
    const crmNewClient = await ctx.db.query("crmNewClient").collect();
    let fixedCount = 0;

    for (const target of crmNewClient) {
      // Check if directOrAssociate has typo variations
      if (target.directOrAssociate) {
        const normalized = target.directOrAssociate.toLowerCase();
        let correctedValue = target.directOrAssociate;

        // Fix common typos
        if (normalized === 'assosiate' || normalized === 'assosiates') {
          correctedValue = 'Associate';
        } else if (normalized === 'direct' || normalized === 'directs') {
          correctedValue = 'Direct';
        }

        // Update if value changed
        if (correctedValue !== target.directOrAssociate) {
          await ctx.db.patch(target._id, {
            directOrAssociate: correctedValue,
            updatedAt: Date.now(),
          });
          fixedCount++;
        }
      }
    }

    return { fixedCount };
  },
});

// Delete all CRM targets (useful for re-import)
export const deleteAllCrmNewClients = mutation({
  args: {},
  handler: async (ctx) => {
    const crmNewClient = await ctx.db.query("crmNewClient").collect();
    for (const target of crmNewClient) {
      await ctx.db.delete(target._id);
    }
    return { deletedCount: crmNewClient.length };
  },
});

