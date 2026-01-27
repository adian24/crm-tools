import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Fungsi untuk membuat role baru
export const createRole = mutation({
  args: {
    roleName: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { roleName, description, permissions } = args;

    // Cek apakah role sudah ada
    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_roleName", (q) => q.eq("roleName", roleName))
      .first();

    if (existingRole) {
      throw new Error("Role dengan nama ini sudah ada");
    }

    const now = Date.now();
    const roleId = await ctx.db.insert("roles", {
      roleName,
      description,
      permissions,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return roleId;
  },
});

// Fungsi untuk mendapatkan semua roles
export const getAllRoles = query({
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles;
  },
});

// Fungsi untuk mendapatkan role berdasarkan ID
export const getRoleById = query({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      return null;
    }
    return role;
  },
});

// Fungsi untuk update role
export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    roleName: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { roleId, ...updateData } = args;

    // Cek apakah role ada
    const role = await ctx.db.get(roleId);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }

    // Cek roleName uniqueness jika diubah
    if (updateData.roleName && updateData.roleName !== role.roleName) {
      const existingRole = await ctx.db
        .query("roles")
        .withIndex("by_roleName", (q) => q.eq("roleName", updateData.roleName!))
        .first();

      if (existingRole && existingRole._id !== roleId) {
        throw new Error("Role name sudah digunakan");
      }
    }

    // Update role
    const updatedRole = await ctx.db.patch(roleId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return updatedRole;
  },
});

// Fungsi untuk delete role
export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const { roleId } = args;

    // Cek apakah role ada
    const role = await ctx.db.get(roleId);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }

    // Cek apakah ada user yang menggunakan role ini
    // Note: Role basic (super_admin, manager, staff) tidak bisa dihapus
    if (["super_admin", "manager", "staff"].includes(role.roleName)) {
      throw new Error("Role sistem tidak dapat dihapus");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(roleId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Fungsi untuk toggle status role
export const toggleRoleStatus = mutation({
  args: {
    roleId: v.id("roles"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { roleId, isActive } = args;

    // Cek apakah role ada
    const role = await ctx.db.get(roleId);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }

    // Update role status
    const updatedRole = await ctx.db.patch(roleId, {
      isActive,
      updatedAt: Date.now(),
    });

    return updatedRole;
  },
});

// Mendefinisikan semua permissions yang tersedia di sistem
export const availablePermissions = query({
  handler: async () => {
    return {
      // Dashboard permissions
      dashboard_view: "Lihat Dashboard",
      dashboard_data_view: "Lihat Dashboard Pencapaian",
      dashboard_kunjungan_view: "Lihat Dashboard Kunjungan",

      // CRM Data permissions
      crm_data_view: "Lihat CRM Data",
      crm_data_create: "Tambah CRM Data",
      crm_data_edit: "Edit CRM Data",
      crm_data_delete: "Hapus CRM Data",
      crm_data_export: "Export CRM Data",

      // Visit permissions
      visit_view: "Lihat Data Kunjungan",
      visit_create: "Tambah Kunjungan",
      visit_edit: "Edit Kunjungan",
      visit_delete: "Hapus Kunjungan",

      // User Management permissions
      users_view: "Lihat Data User",
      users_create: "Tambah User",
      users_edit: "Edit User",
      users_delete: "Hapus User",
      users_toggle_status: "Toggle Status User",

      // Role Management permissions
      roles_view: "Lihat Data Role",
      roles_create: "Tambah Role",
      roles_edit: "Edit Role",
      roles_delete: "Hapus Role",
      roles_toggle_status: "Toggle Status Role",

      // Settings permissions
      settings_access: "Akses Settings",
    };
  },
});

// Seed default roles dengan permissions
export const seedDefaultRoles = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Super Admin - Full access
    const superAdminExists = await ctx.db
      .query("roles")
      .withIndex("by_roleName", (q) => q.eq("roleName", "super_admin"))
      .first();

    if (!superAdminExists) {
      const allPermissions = [
        "dashboard_view",
        "dashboard_data_view",
        "dashboard_kunjungan_view",
        "crm_data_view",
        "crm_data_create",
        "crm_data_edit",
        "crm_data_delete",
        "crm_data_export",
        "visit_view",
        "visit_create",
        "visit_edit",
        "visit_delete",
        "users_view",
        "users_create",
        "users_edit",
        "users_delete",
        "users_toggle_status",
        "roles_view",
        "roles_create",
        "roles_edit",
        "roles_delete",
        "roles_toggle_status",
        "settings_access",
      ];

      await ctx.db.insert("roles", {
        roleName: "super_admin",
        description: "Super Admin dengan full akses ke sistem",
        permissions: allPermissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Manager - Limited access
    const managerExists = await ctx.db
      .query("roles")
      .withIndex("by_roleName", (q) => q.eq("roleName", "manager"))
      .first();

    if (!managerExists) {
      const managerPermissions = [
        "dashboard_view",
        "dashboard_data_view",
        "dashboard_kunjungan_view",
        "crm_data_view",
        "crm_data_create",
        "crm_data_edit",
        "crm_data_export",
        "visit_view",
        "visit_create",
        "visit_edit",
        "users_view",
      ];

      await ctx.db.insert("roles", {
        roleName: "manager",
        description: "Manager dengan akses terbatas",
        permissions: managerPermissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Staff - Basic access
    const staffExists = await ctx.db
      .query("roles")
      .withIndex("by_roleName", (q) => q.eq("roleName", "staff"))
      .first();

    if (!staffExists) {
      const staffPermissions = [
        "dashboard_view",
        "dashboard_kunjungan_view",
        "visit_view",
        "visit_create",
        "visit_edit",
      ];

      await ctx.db.insert("roles", {
        roleName: "staff",
        description: "Staff dengan akses dasar",
        permissions: staffPermissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
