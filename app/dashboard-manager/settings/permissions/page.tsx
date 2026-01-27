"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Pencil, Trash2, Shield, ShieldCheck, ShieldAlert, Key as KeyIcon, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InfinityLoader } from '@/components/ui/infinity-loader';

interface Role {
  _id: Id<"roles">;
  roleName: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function PermissionsManagementPage() {
  const roles = useQuery(api.roles.getAllRoles);
  const availablePermissions = useQuery(api.roles.availablePermissions);
  const createRole = useMutation(api.roles.createRole);
  const updateRole = useMutation(api.roles.updateRole);
  const deleteRole = useMutation(api.roles.deleteRole);
  const toggleRoleStatus = useMutation(api.roles.toggleRoleStatus);
  const seedDefaultRoles = useMutation(api.roles.seedDefaultRoles);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Loading states
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
  });

  // Show loading state
  if (roles === undefined || roles === null || availablePermissions === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <InfinityLoader />
      </div>
    );
  }

  // Filter roles
  const filteredRoles = roles.filter((role: Role) => {
    const matchesSearch =
      role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && role.isActive) ||
      (filterStatus === 'inactive' && !role.isActive);

    return matchesSearch && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      roleName: '',
      description: '',
    });
    setSelectedPermissions([]);
  };

  // Handle Add Role
  const handleAddRole = async () => {
    try {
      setIsLoadingCreate(true);
      if (!formData.roleName) {
        toast.error('Nama role wajib diisi');
        return;
      }

      if (selectedPermissions.length === 0) {
        toast.error('Pilih minimal satu permission');
        return;
      }

      await createRole({
        roleName: formData.roleName,
        description: formData.description || undefined,
        permissions: selectedPermissions,
      });

      toast.success('Role berhasil ditambahkan');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan role');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Handle Edit Role
  const handleEditRole = async () => {
    if (!editingRole) return;

    try {
      setIsLoadingUpdate(true);
      if (!formData.roleName) {
        toast.error('Nama role wajib diisi');
        return;
      }

      if (selectedPermissions.length === 0) {
        toast.error('Pilih minimal satu permission');
        return;
      }

      await updateRole({
        roleId: editingRole._id,
        roleName: formData.roleName,
        description: formData.description || undefined,
        permissions: selectedPermissions,
      });

      toast.success('Role berhasil diupdate');
      resetForm();
      setEditingRole(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate role');
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (roleId: Id<"roles">) => {
    try {
      setIsLoadingDelete(true);
      await deleteRole({ roleId });
      toast.success('Role berhasil dihapus');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus role');
    } finally {
      setIsLoadingDelete(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (roleId: Id<"roles">, currentStatus: boolean) => {
    try {
      setIsLoadingToggle(true);
      await toggleRoleStatus({
        roleId,
        isActive: !currentStatus,
      });
      toast.success('Status role berhasil diubah');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status role');
    } finally {
      setIsLoadingToggle(false);
    }
  };

  // Handle Seed Default Roles
  const handleSeedRoles = async () => {
    try {
      setIsLoadingSeed(true);
      await seedDefaultRoles();
      toast.success('Default roles berhasil dibuat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat default roles');
    } finally {
      setIsLoadingSeed(false);
    }
  };

  // Open Edit Dialog
  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      description: role.description || '',
    });
    setSelectedPermissions(role.permissions);
    setIsEditDialogOpen(true);
  };

  // Toggle permission selection
  const togglePermission = (permissionKey: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  // Group permissions by category
  const groupPermissions = (permissions: Record<string, string>) => {
    const groups: Record<string, Record<string, string>> = {
      dashboard: {},
      crm_data: {},
      visit: {},
      users: {},
      roles: {},
      settings: {},
    };

    Object.entries(permissions).forEach(([key, label]) => {
      const prefix = key.split('_')[0];
      if (groups[prefix]) {
        groups[prefix][key] = label;
      }
    });

    return groups;
  };

  const permissionGroups = availablePermissions
    ? groupPermissions(availablePermissions)
    : {};

  // Render Permissions Selector
  const renderPermissionsSelector = () => {
    if (!availablePermissions) return null;

    const groups = [
      { title: 'Dashboard', key: 'dashboard', icon: <Shield className="h-4 w-4" /> },
      { title: 'CRM Data', key: 'crm_data', icon: <ShieldCheck className="h-4 w-4" /> },
      { title: 'Kunjungan', key: 'visit', icon: <ShieldAlert className="h-4 w-4" /> },
      { title: 'User Management', key: 'users', icon: <KeyIcon className="h-4 w-4" /> },
      { title: 'Role Management', key: 'roles', icon: <Shield className="h-4 w-4" /> },
      { title: 'Settings', key: 'settings', icon: <KeyIcon className="h-4 w-4" /> },
    ];

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {groups.map((group) => {
            const groupPermissions = permissionGroups[group.key];
            if (!groupPermissions || Object.keys(groupPermissions).length === 0) return null;

            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  {group.icon}
                  <h4 className="font-semibold text-sm">{group.title}</h4>
                </div>
                <div className="space-y-2 ml-6">
                  {Object.entries(groupPermissions).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={selectedPermissions.includes(key)}
                        onCheckedChange={() => togglePermission(key)}
                      />
                      <Label
                        htmlFor={key}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                <Separator className="mt-3" />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Kelola hak akses dan permissions untuk setiap role</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeedRoles}
            disabled={isLoadingSeed}
          >
            {isLoadingSeed ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Default Roles'
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Tambah Role Baru</DialogTitle>
                <DialogDescription>
                  Buat role baru dan atur permissions/hak aksesnya
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-roleName">Nama Role *</Label>
                  <Input
                    id="add-roleName"
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    placeholder="Contoh: supervisor, team_lead"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-description">Deskripsi</Label>
                  <Textarea
                    id="add-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan role ini..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Permissions * ({selectedPermissions.length} dipilih)</Label>
                  {renderPermissionsSelector()}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Batal
                </Button>
                <Button onClick={handleAddRole} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={isLoadingCreate}>
                  {isLoadingCreate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama role atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Semua
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Aktif
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
              >
                Tidak Aktif
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Roles</CardTitle>
          <CardDescription>
            Total {filteredRoles.length} role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Role</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada role yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role: Role) => (
                    <TableRow key={role._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                            {role.roleName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{role.roleName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(role.createdAt).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {role.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {role.permissions.length} permissions
                        </Badge>
                        <div className="mt-1 flex flex-wrap gap-1 max-w-md">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.isActive ? "default" : "secondary"}
                          className={role.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                        >
                          {role.isActive ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Tidak Aktif
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(role._id, role.isActive)}
                            className="h-8 w-8"
                            title={role.isActive ? "Deactivate" : "Activate"}
                            disabled={isLoadingToggle}
                          >
                            {isLoadingToggle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : role.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(role)}
                            className="h-8 w-8"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Role?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus role "{role.roleName}"? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoadingDelete}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteRole(role._id);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={isLoadingDelete}
                                >
                                  {isLoadingDelete ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Menghapus...
                                    </>
                                  ) : (
                                    'Hapus'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role dan permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-roleName">Nama Role *</Label>
              <Input
                id="edit-roleName"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                placeholder="Contoh: supervisor, team_lead"
                disabled={editingRole ? ['super_admin', 'manager', 'staff'].includes(editingRole.roleName) : false}
              />
              {editingRole && ['super_admin', 'manager', 'staff'].includes(editingRole.roleName) && (
                <p className="text-xs text-muted-foreground">
                  Nama role sistem tidak dapat diubah
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan role ini..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Permissions * ({selectedPermissions.length} dipilih)</Label>
              {renderPermissionsSelector()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditingRole(null); setIsEditDialogOpen(false); }}>
              Batal
            </Button>
            <Button onClick={handleEditRole} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={isLoadingUpdate}>
              {isLoadingUpdate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengupdate...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
