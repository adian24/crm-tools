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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Shield, ShieldCheck, ShieldAlert, Mail, Phone, User as UserIcon, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InfinityLoader } from '@/components/ui/infinity-loader';

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  staffId?: string;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  targetYearly: number;
  completedThisYear: number;
  createdAt: number;
  updatedAt: number;
}

export default function UsersManagementPage() {
  const users = useQuery(api.auth.getAllUsers);
  const createUser = useMutation(api.auth.createUser);
  const updateUser = useMutation(api.auth.updateUser);
  const deleteUser = useMutation(api.auth.deleteUser);
  const toggleUserStatus = useMutation(api.auth.toggleUserStatus);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Loading states
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);

  // Check if any mutation is loading
  const isMutationLoading = isLoadingCreate || isLoadingUpdate || isLoadingDelete || isLoadingToggle;

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'super_admin' | 'manager' | 'staff',
    staffId: '',
    phone: '',
    targetYearly: 100,
  });

  // Show loading state
  if (users === undefined || users === null) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <InfinityLoader />
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.staffId && user.staffId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      staffId: '',
      phone: '',
      targetYearly: 100,
    });
  };

  // Handle Add User
  const handleAddUser = async () => {
    try {
      setIsLoadingCreate(true);
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Semua field wajib diisi');
        return;
      }

      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        staffId: formData.staffId || undefined,
      });

      toast.success('User berhasil ditambahkan');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan user');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      setIsLoadingUpdate(true);
      if (!formData.name || !formData.email) {
        toast.error('Nama dan email wajib diisi');
        return;
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        staffId: formData.staffId || undefined,
        phone: formData.phone || undefined,
        targetYearly: formData.targetYearly,
      };

      // Only update password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateUser({
        userId: editingUser._id,
        ...updateData,
      });

      toast.success('User berhasil diupdate');
      resetForm();
      setEditingUser(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate user');
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: Id<"users">) => {
    try {
      setIsLoadingDelete(true);
      await deleteUser({ userId });
      toast.success('User berhasil dihapus');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus user');
    } finally {
      setIsLoadingDelete(false);
    }
  };

  // Handle Toggle User Status
  const handleToggleStatus = async (userId: Id<"users">, currentStatus: boolean) => {
    try {
      setIsLoadingToggle(true);
      await toggleUserStatus({
        userId,
        isActive: !currentStatus,
      });
      toast.success('Status user berhasil diubah');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status user');
    } finally {
      setIsLoadingToggle(false);
    }
  };

  // Open Edit Dialog
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      staffId: user.staffId || '',
      phone: user.phone || '',
      targetYearly: user.targetYearly,
    });
    setIsEditDialogOpen(true);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'staff':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldAlert className="h-4 w-4" />;
      case 'manager':
        return <ShieldCheck className="h-4 w-4" />;
      case 'staff':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground mt-1">Kelola user dan hak akses sistem</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat user baru dan atur hak aksesnya
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Nama Lengkap *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contoh@email.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="add-role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-staffId">Staff ID</Label>
                <Input
                  id="add-staffId"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  placeholder="ST-XXX (opsional)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-phone">No. Telepon</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-target">Target Tahunan</Label>
                <Input
                  id="add-target"
                  type="number"
                  value={formData.targetYearly}
                  onChange={(e) => setFormData({ ...formData, targetYearly: parseInt(e.target.value) })}
                  placeholder="100"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }} disabled={isLoadingCreate}>
                Batal
              </Button>
              <Button onClick={handleAddUser} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={isLoadingCreate}>
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

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, atau staff ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>
            Total {filteredUsers.length} user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border border-border/50">
            {isMutationLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Memproses...</p>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada user yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user._id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'manager' ? 'Manager' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.staffId ? (
                          <Badge variant="outline" className="font-mono">
                            {user.staffId}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{user.completedThisYear} / {user.targetYearly}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((user.completedThisYear / user.targetYearly) * 100)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={user.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                        >
                          {user.isActive ? (
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
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            className="h-8 w-8"
                            title={user.isActive ? "Deactivate" : "Activate"}
                            disabled={isLoadingToggle}
                          >
                            {isLoadingToggle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
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
                                <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus user "{user.name}"? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoadingDelete}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteUser(user._id);
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update informasi dan hak akses user
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Lengkap *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contoh@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password Baru</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-staffId">Staff ID</Label>
              <Input
                id="edit-staffId"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                placeholder="ST-XXX (opsional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">No. Telepon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-target">Target Tahunan</Label>
              <Input
                id="edit-target"
                type="number"
                value={formData.targetYearly}
                onChange={(e) => setFormData({ ...formData, targetYearly: parseInt(e.target.value) })}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditingUser(null); setIsEditDialogOpen(false); }} disabled={isLoadingUpdate}>
              Batal
            </Button>
            <Button onClick={handleEditUser} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={isLoadingUpdate}>
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
