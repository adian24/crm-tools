"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IsuKendalaDialog } from '@/components/isu-kendala-dialog';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';

interface IsuKendala {
  _id: Id<"isuKendala">;
  title: string;
  month: number;
  year: number;
  points: string[];
  status: "active" | "inactive";
  category: "Internal" | "Eksternal" | "Operasional" | "Teknis";
  priority: "Low" | "Medium" | "High" | "Critical";
  tanggalKejadian?: string;
  tanggalSelesai?: string;
  created_by?: Id<"users">;
  createdByName: string;
  updated_by?: Id<"users">;
  updatedByName?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
  _creationTime?: number;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function IsuKendalaPage() {
  const isuKendala = useQuery(api.isuKendala.getIsuKendala);
  const deleteIsuKendalaMutation = useMutation(api.isuKendala.deleteIsuKendala);
  const updateStatusMutation = useMutation(api.isuKendala.updateIsuKendalaStatus);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIsu, setEditingIsu] = useState<IsuKendala | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIsu, setDeletingIsu] = useState<IsuKendala | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingIsu, setViewingIsu] = useState<IsuKendala | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter isu kendala
  const filteredIsuKendala = isuKendala?.filter(isu => {
    const matchesMonth = isu.month === selectedMonth;
    const matchesYear = isu.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      isu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      isu.points.some(point => point.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort isu kendala: active first, then by priority, then by updated date
  const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };

  const sortedIsuKendala = [...filteredIsuKendala].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.updatedAt - a.updatedAt;
  });

  const handleAdd = () => {
    setEditingIsu(null);
    setDialogOpen(true);
  };

  const handleEdit = (isu: IsuKendala) => {
    setEditingIsu(isu);
    setDialogOpen(true);
  };

  const handleDelete = (isu: IsuKendala) => {
    setDeletingIsu(isu);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingIsu) return;

    setIsDeleting(true);
    try {
      await deleteIsuKendalaMutation({ id: deletingIsu._id });
      toast.success("✅ Isu Kendala berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingIsu(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus isu kendala");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (isu: IsuKendala) => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = isu.status === "active" ? "inactive" : "active";
      await updateStatusMutation({
        id: isu._id,
        status: newStatus,
      });
      toast.success(`✅ Isu Kendala berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      toast.error("❌ Gagal mengubah status isu kendala");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewDetail = (isu: IsuKendala) => {
    setViewingIsu(isu);
    setViewDetailOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700";
      case "High": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700";
      case "Low": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
      default: return "";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Internal": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
      case "Eksternal": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700";
      case "Operasional": return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700";
      case "Teknis": return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700";
      default: return "";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
      case "High":
        return <AlertTriangle className="h-3 w-3" />;
      case "Medium":
        return <Info className="h-3 w-3" />;
      case "Low":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Isu Kendala</h2>
            <p className="text-muted-foreground">
              Catat dan kelola isu atau kendala yang terjadi per bulan
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Isu
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan
              </Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun
              </Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cari
              </Label>
              <Input
                placeholder="Cari isu kendala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Isu Kendala Grid */}
        {isuKendala === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedIsuKendala.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada isu kendala
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan isu kendala yang sesuai dengan pencarian" : `Belum ada isu kendala untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Catat Isu Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedIsuKendala.map((isu) => (
              <Card
                key={isu._id}
                className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow flex flex-col"
              >
                {/* Header with badges */}
                <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 flex-1">
                      {isu.title}
                    </h3>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge
                        variant={isu.status === "active" ? "default" : "secondary"}
                        className={isu.status === "active"
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                          : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                        }
                      >
                        {isu.status === "active" ? "Aktif" : "Selesai"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${getCategoryColor(isu.category)}`}
                    >
                      {isu.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold flex items-center gap-1 ${getPriorityColor(isu.priority)}`}
                    >
                      {getPriorityIcon(isu.priority)}
                      {isu.priority}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Point-Point Isu:
                    </p>
                    <div className="space-y-2">
                      {isu.points.slice(0, 3).map((point, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-snug">
                              {point}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isu.points.length > 3 && (
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-lg border-2 border-blue-300 dark:border-blue-700 p-3">
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                              +
                            </span>
                            <span>{isu.points.length - 3} point lainnya...</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span className="font-semibold">
                        {MONTHS[isu.month - 1]} {isu.year}
                      </span>
                    </div>
                    {(isu.tanggalKejadian || isu.tanggalSelesai) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {isu.tanggalKejadian && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Kejadian:</span>
                            <span>{new Date(isu.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                        {isu.tanggalSelesai && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Selesai:</span>
                            <span>{new Date(isu.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetail(isu)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8"
                    disabled={isUpdatingStatus}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Lihat
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(isu)}
                    className={`cursor-pointer flex-1 h-8 ${
                      isu.status === "active"
                        ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                    disabled={isUpdatingStatus}
                  >
                    {isu.status === "active" ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Selesai
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aktif
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(isu)}
                    className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8"
                    disabled={isUpdatingStatus}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(isu)}
                    className="cursor-pointer flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                    disabled={isDeleting || isUpdatingStatus}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Hapus
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <IsuKendalaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isuKendala={editingIsu}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingIsu(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Isu Kendala?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus isu kendala "{deletingIsu?.title}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Dialog */}
      <AlertDialog open={viewDetailOpen} onOpenChange={setViewDetailOpen}>
        <AlertDialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <AlertDialogTitle className="text-2xl mb-2">{viewingIsu?.title}</AlertDialogTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${getCategoryColor(viewingIsu?.category || "")}`}
                  >
                    {viewingIsu?.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold flex items-center gap-1 ${getPriorityColor(viewingIsu?.priority || "")}`}
                  >
                    {getPriorityIcon(viewingIsu?.priority || "")}
                    {viewingIsu?.priority}
                  </Badge>
                  <Badge
                    variant={viewingIsu?.status === "active" ? "default" : "secondary"}
                    className={viewingIsu?.status === "active"
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                      : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                    }
                  >
                    {viewingIsu?.status === "active" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">Point-Point Isu:</p>
              <div className="space-y-3">
                {viewingIsu?.points.map((point, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-base font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-base text-slate-700 dark:text-slate-300 flex-1 leading-snug">
                        {point}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan/Tahun:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {MONTHS[(viewingIsu?.month || 1) - 1]} {viewingIsu?.year}
                </p>
              </div>
              {viewingIsu?.tanggalKejadian && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kejadian:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(viewingIsu.tanggalKejadian).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              {viewingIsu?.tanggalSelesai && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Selesai:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(viewingIsu.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dibuat oleh: {viewingIsu?.createdByName} pada {new Date(viewingIsu?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingIsu?.updatedByName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Terakhir diupdate oleh: {viewingIsu.updatedByName} pada {new Date(viewingIsu.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
