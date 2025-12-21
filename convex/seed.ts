import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedUsers = mutation({
  handler: async (ctx) => {
    // Cek apakah sudah ada user
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      return "Users already exist";
    }

    const now = Date.now();

    // Create super admin
    await ctx.db.insert("users", {
      name: "Super Admin",
      email: "admin@tsicertification.co.id",
      password: "password", // Dalam production, gunakan hash password
      role: "super_admin",
      isActive: true,
      targetYearly: 0, // Admin tidak punya target
      completedThisYear: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create manager
    await ctx.db.insert("users", {
      name: "Diara",
      email: "diara@tsicertification.co.id",
      password: "password",
      role: "manager",
      isActive: true,
      targetYearly: 0, // Manager tidak punya target kunjungan
      completedThisYear: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create staff members
    await ctx.db.insert("users", {
      name: "Mercy",
      email: "mercy@tsicertification.co.id",
      password: "password",
      role: "staff",
      staffId: "1",
      isActive: true,
      targetYearly: 100, // Target 100 kunjungan per tahun
      completedThisYear: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("users", {
      name: "Dhea",
      email: "dhea@tsicertification.co.id",
      password: "password",
      role: "staff",
      staffId: "2",
      isActive: true,
      targetYearly: 100, // Target 100 kunjungan per tahun
      completedThisYear: 0,
      createdAt: now,
      updatedAt: now,
    });

    return "Sample users created successfully";
  },
});

export const seedTargets = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Get users to assign as PIC
    const users = await ctx.db.query("users").collect();
    const staffUsers = users.filter(u => u.role === "staff");

    if (staffUsers.length === 0) {
      return "No staff users found. Please seed users first.";
    }

    const sampleTargets = [
      {
        client: "PT. Digital Indonesia",
        address: "Jl. Sudirman No. 123, Jakarta Pusat",
        pic: staffUsers[0]._id, // Mercy
        scheduleVisit: "2025-12-25",
        visitTime: "10:00",
        statusClient: "LANJUT" as const,
        nilaiKontrak: 100000000,
        statusKunjungan: "TO_DO" as const,
        contactPerson: "Ricky Halim",
        contactPhone: "0812-1111-2222",
        location: "Gedung Graha Kirana Lt. 7",
        salesAmount: 0,
        notes: "Client berminat dengan paket enterprise",
        created_by: staffUsers[0]._id,
      },
      {
        client: "CV. Teknologi Maju",
        address: "Jl. Gatot Subroto No. 456, Jakarta Selatan",
        pic: staffUsers[1]._id, // Dhea
        scheduleVisit: "2025-12-22",
        visitTime: "14:00",
        statusClient: "LOSS" as const,
        nilaiKontrak: 50000000,
        statusKunjungan: "VISITED" as const,
        contactPerson: "Andi Wijaya",
        contactPhone: "0813-3333-4444",
        location: "Ruko Sudirman Plaza",
        salesAmount: 0,
        notes: "Client memilih competitor",
        created_by: staffUsers[1]._id,
      },
      {
        client: "PT. Global Solution",
        address: "Jl. MH Thamrin No. 789, Jakarta Utara",
        pic: staffUsers[0]._id, // Mercy
        scheduleVisit: "2025-12-23",
        visitTime: "15:30",
        statusClient: "SUSPEND" as const,
        nilaiKontrak: 75000000,
        statusKunjungan: "TO_DO" as const,
        contactPerson: "Michael Chen",
        contactPhone: "0814-5555-6666",
        location: "Kawasan Industri Ancol",
        salesAmount: 0,
        notes: "Client pending keputusan",
        created_by: staffUsers[0]._id,
      },
      {
        client: "PT. Fortune Nusantara",
        address: "Jl. Thamrin No. 1, Jakarta Pusat",
        pic: staffUsers[1]._id, // Dhea
        scheduleVisit: "2025-12-24",
        visitTime: "11:00",
        statusClient: "LANJUT" as const,
        nilaiKontrak: 120000000,
        statusKunjungan: "VISITED" as const,
        contactPerson: "David Kusuma",
        contactPhone: "0816-9999-0000",
        location: "Gedung BCA Lt. 15",
        salesAmount: 120000000,
        notes: "Deal berhasil - Paket Premium",
        created_by: staffUsers[1]._id,
      },
      {
        client: "CV. Cahaya Baru",
        address: "Kawasan Industri Bekasi",
        pic: staffUsers[0]._id, // Mercy
        scheduleVisit: "2025-12-26",
        visitTime: "09:30",
        statusClient: "LANJUT" as const,
        nilaiKontrak: 80000000,
        statusKunjungan: "TO_DO" as const,
        contactPerson: "Siti Rahayu",
        contactPhone: "0817-1111-2222",
        location: "Bekasi Industrial Park",
        salesAmount: 0,
        notes: "Follow up required",
        created_by: staffUsers[0]._id,
      }
    ];

    // Insert targets
    for (const target of sampleTargets) {
      await ctx.db.insert("targets", {
        ...target,
        createdAt: now,
        updatedAt: now,
      });
    }

    return `Created ${sampleTargets.length} sample targets`;
  },
});