"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { CatatanTambahanDialog } from '@/components/catatan-tambahan-dialog';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Search,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';
import { TerimaKasihDrawer } from '@/components/TerimaKasihDrawer';

interface CatatanTambahan {
  _id: Id<"catatanTambahan">;
  judul: string;
  isiCatatan: string;
  gambarBase64: string;
  bulan: number;
  tahun: number;
  status: "active" | "inactive";
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

export default function CatatanTambahanPage() {
  const catatanTambahan = useQuery(api.catatanTambahan.getCatatanTambahan);
  const deleteCatatanMutation = useMutation(api.catatanTambahan.deleteCatatanTambahan);
  const updateStatusMutation = useMutation(api.catatanTambahan.updateCatatanTambahanStatus);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCatatan, setEditingCatatan] = useState<CatatanTambahan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCatatan, setDeletingCatatan] = useState<CatatanTambahan | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);
  const [terimaKasihOpen, setTerimaKasihOpen] = useState(false);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter catatan tambahan
  const filteredCatatan = catatanTambahan?.filter(catatan => {
    const matchesMonth = catatan.bulan === selectedMonth;
    const matchesYear = catatan.tahun === selectedYear;
    const matchesSearch = searchQuery === "" ||
      catatan.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catatan.isiCatatan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort by createdAt (newest first)
  const sortedCatatan = [...filteredCatatan].sort((a, b) => b.createdAt - a.createdAt);

  // Pagination
  const totalPages = Math.ceil(sortedCatatan.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCatatan = sortedCatatan.slice(startIndex, endIndex);

  const handleEdit = (catatan: CatatanTambahan) => {
    setEditingCatatan(catatan);
    setDialogOpen(true);
  };

  const handleDelete = async (catatan: CatatanTambahan) => {
    setDeletingCatatan(catatan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCatatan) return;

    setIsDeleting(true);
    try {
      await deleteCatatanMutation({ id: deletingCatatan._id });
      toast.success("Catatan berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingCatatan(null);
    } catch (error) {
      console.error("Error deleting catatan:", error);
      toast.error("Gagal menghapus catatan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (catatan: CatatanTambahan) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation({
        id: catatan._id,
        status: catatan.status === "active" ? "inactive" : "active"
      });
      toast.success(`Status berhasil diubah menjadi ${catatan.status === "active" ? "inactive" : "active"}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengubah status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const previewImages = sortedCatatan.map((c) => ({
    url: c.gambarBase64,
    title: c.judul,
    description: c.isiCatatan || undefined,
  }));

  const handleImageClick = (catatan: CatatanTambahan) => {
    const idx = sortedCatatan.findIndex((c) => c._id === catatan._id);
    setPreviewImageIndex(idx >= 0 ? idx : 0);
    setPreviewImageOpen(true);
  };

  const handleAddNew = () => {
    setEditingCatatan(null);
    setDialogOpen(true);
  };

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 pt-3 pb-2">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Title */}
          <div className="flex-shrink-0">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight">
              Catatan Tambahan
            </h2>
            <p className="text-xs text-muted-foreground">Upload dan kelola catatan tambahan per bulan</p>
          </div>

          {/* Filters + Tambah — desktop */}
          <div className="hidden sm:flex items-center gap-2 ml-auto flex-wrap">
            {/* Bulan */}
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="h-9 w-36 text-xs font-semibold border-2 border-purple-400 bg-purple-50 text-purple-700 focus:ring-2 focus:ring-purple-500 hover:bg-purple-100 transition-colors">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()} className="text-xs">
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tahun */}
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="h-9 w-24 text-xs font-semibold border-2 border-blue-400 bg-blue-50 text-blue-700 focus:ring-2 focus:ring-blue-500 hover:bg-blue-100 transition-colors">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cari */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 w-48 text-xs border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tambah */}
            <Button
              onClick={handleAddNew}
              size="sm"
              className="cursor-pointer h-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Catatan
            </Button>
          </div>
        </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4 sm:px-8 sm:py-6 pb-44 sm:pb-32 lg:pb-20">

        {/* Total Data Info */}
        {sortedCatatan.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
            Total <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedCatatan.length}</span> catatan
          </div>
        )}

        {/* Catatan Grid */}
        {catatanTambahan === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedCatatan.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada catatan
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan catatan yang sesuai dengan pencarian" : `Belum ada catatan untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAddNew}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Catatan Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            {paginatedCatatan.map((catatan) => (
              <Card
                key={catatan._id}
                className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[5/3] bg-slate-100 dark:bg-slate-900">
                  <img
                    src={catatan.gambarBase64}
                    alt={catatan.judul}
                    className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity p-2"
                    onClick={() => handleImageClick(catatan)}
                  />
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <Badge
                      variant={catatan.status === "active" ? "default" : "secondary"}
                      className={catatan.status === "active"
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-[10px] sm:text-xs"
                        : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-[10px] sm:text-xs"
                      }
                    >
                      {catatan.status === "active" ? "Aktif" : "Non-Aktif"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2 sm:p-4 space-y-1 sm:space-y-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white line-clamp-2 mb-1 sm:mb-2">
                      {catatan.judul}
                    </h3>
                    {catatan.isiCatatan && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {catatan.isiCatatan}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="font-semibold">
                        {MONTHS[catatan.bulan - 1]} {catatan.tahun}
                      </span>
                    </div>
                    
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2 p-2 sm:p-4 pt-1 sm:pt-2 border-t border-slate-200 dark:border-slate-700"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleImageClick(catatan)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Lihat</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(catatan)}
                      className={`cursor-pointer flex-1 h-7 sm:h-8 px-1 sm:px-2 ${
                        catatan.status === "active"
                          ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                      disabled={isUpdatingStatus}
                    >
                      {catatan.status === "active" ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">Nonaktif</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">Aktif</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(catatan)}
                      className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-7 sm:h-8 px-1 sm:px-2"
                      disabled={isUpdatingStatus}
                    >
                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(catatan)}
                      className="cursor-pointer flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 sm:h-8 px-1 sm:px-2"
                      disabled={isDeleting || isUpdatingStatus}
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Hapus</span>
                    </Button>
                  </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {sortedCatatan.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg">
            {/* Rows per Page */}
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Tampilkan:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => setItemsPerPage(parseInt(v))}
                >
                  <SelectTrigger className="h-8 w-16 sm:w-20 border-slate-300 dark:border-slate-600 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm hidden sm:inline">data/hal</span>
              </div>
            </div>

            {/* Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-7 sm:h-8 px-2 sm:px-3 border-slate-300 dark:border-slate-600 text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Sebelumnya</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage === 1) {
                      pageNum = i + 1;
                    } else if (currentPage === totalPages) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-7 sm:h-8 w-7 sm:w-8 p-0 text-xs sm:text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 sm:h-8 px-2 sm:px-3 border-slate-300 dark:border-slate-600 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline mr-1">Selanjutnya</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
              Hal <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> / <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <CatatanTambahanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCatatan={editingCatatan}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingCatatan(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan "{deletingCatatan?.judul}"? Tindakan ini tidak dapat dibatalkan.
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

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={previewImageOpen}
        onOpenChange={setPreviewImageOpen}
        images={previewImages}
        initialIndex={previewImageIndex}
      />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-3 gap-1 p-2">
          {/* Search Tab */}
          <button
            onClick={() => setMobileFilterOpen(mobileFilterOpen === 'search' ? null : 'search')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen === 'search' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Cari</span>
          </button>

          {/* Date Filter Tab */}
          <button
            onClick={() => setMobileFilterOpen(mobileFilterOpen === 'date' ? null : 'date')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen === 'date' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Filter</span>
          </button>

          {/* Add Button */}
          <button
            onClick={handleAddNew}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>
        </div>
      </div>

      {/* Sticky full-width Terima Kasih button — above mobile nav, at bottom on desktop */}
      {/* <div className="fixed bottom-[68px] lg:bottom-0 left-0 right-0 z-40 px-4 py-3 lg:px-8 lg:py-4">
        <button
          onClick={() => setTerimaKasihOpen(true)}
          className="cursor-pointer w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-white font-semibold text-sm tracking-wide shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a8089b 60%, #420530 100%)" }}
        >
          Click here... See you next month !
        </button>
      </div> */}

      {/* Terima Kasih Drawer */}
      <TerimaKasihDrawer open={terimaKasihOpen} onClose={() => setTerimaKasihOpen(false)} />

      {/* Mobile Filter Sheet Overlay */}
      {mobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFilterOpen(null)}
          />

          {/* Filter Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Handle bar */}
            <div className="flex justify-center border-b p-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              {/* Search Filter */}
              {mobileFilterOpen === 'search' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Cari Catatan</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileFilterOpen(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari catatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setMobileFilterOpen(null);
                          }
                        }}
                      />
                    </div>
                    {searchQuery && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ditemukan: {sortedCatatan.length} hasil</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="h-7 text-xs"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              {mobileFilterOpen === 'date' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filter Tanggal</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileFilterOpen(null)}
                      className="h-8 text-xs"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {/* Bulan */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Bulan</Label>
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

                    {/* Tahun */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tahun</Label>
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

                    {/* Filter Info */}
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedCatatan.length}</span> catatan</p>
                      <p className="mt-1">
                        {MONTHS[selectedMonth - 1]} {selectedYear}
                      </p>
                    </div>

                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
