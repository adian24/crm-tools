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
import { FlyerDialog } from '@/components/flyer-dialog';
import { toast } from 'sonner';
import {
  Image as PhotoIcon,
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
} from 'lucide-react';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';

interface Flyer {
  _id: Id<"flyers">;
  title: string;
  description?: string;
  month: number;
  year: number;
  imageUrl: string;
  status: "active" | "inactive";
  category: "Training" | "Webinar" | "Promosi";
  tanggalTerbit?: string;
  tanggalBroadcast?: string;
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

export default function FlyerPage() {
  const flyers = useQuery(api.flyers.getFlyers);
  const deleteFlyerMutation = useMutation(api.flyers.deleteFlyer);
  const updateStatusMutation = useMutation(api.flyers.updateFlyerStatus);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<Flyer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFlyer, setDeletingFlyer] = useState<Flyer | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter flyers
  const filteredFlyers = flyers?.filter(flyer => {
    const matchesMonth = flyer.month === selectedMonth;
    const matchesYear = flyer.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      flyer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flyer.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort flyers: active first, then by updated date
  const sortedFlyers = [...filteredFlyers].sort((a, b) => {
    if (a.status === b.status) {
      return b.updatedAt - a.updatedAt;
    }
    return a.status === "active" ? -1 : 1;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedFlyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFlyers = sortedFlyers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  const handleAdd = () => {
    setEditingFlyer(null);
    setDialogOpen(true);
  };

  const handleEdit = (flyer: Flyer) => {
    setEditingFlyer(flyer);
    setDialogOpen(true);
  };

  const handleDelete = (flyer: Flyer) => {
    setDeletingFlyer(flyer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingFlyer) return;

    setIsDeleting(true);
    try {
      await deleteFlyerMutation({ id: deletingFlyer._id });
      toast.success("✅ Flyer berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingFlyer(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus flyer");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (flyer: Flyer) => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = flyer.status === "active" ? "inactive" : "active";
      await updateStatusMutation({
        id: flyer._id,
        status: newStatus,
      });
      toast.success(`✅ Flyer berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      toast.error("❌ Gagal mengubah status flyer");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const previewImages = sortedFlyers.map((f) => ({
    url: f.imageUrl,
    title: f.title,
    description: f.description || undefined,
  }));

  const handleImageClick = (flyer: Flyer) => {
    const idx = sortedFlyers.findIndex((f) => f._id === flyer._id);
    setPreviewImageIndex(idx >= 0 ? idx : 0);
    setPreviewImageOpen(true);
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 pt-3 pb-2">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Flyer</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Upload dan kelola flyer promosi per bulan</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-auto flex-wrap">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="h-9 w-36 text-xs font-semibold border-2 border-purple-400 bg-purple-50 text-purple-700 focus:ring-purple-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="h-9 w-24 text-xs font-semibold border-2 border-blue-400 bg-blue-50 text-blue-700 focus:ring-blue-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Cari flyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 w-48 text-xs border-slate-300 focus:ring-slate-400"
                />
              </div>
              <Button
                onClick={handleAdd}
                size="sm"
                className="h-9 cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Upload Flyer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 sm:space-y-6 px-4 sm:px-8 pb-20 sm:pb-8 pt-2">
        {/* Total Data Info */}
        {sortedFlyers.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
            Total <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedFlyers.length}</span> flyer
          </div>
        )}

        {/* Flyers Grid */}
        {flyers === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedFlyers.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <PhotoIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada flyer
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan flyer yang sesuai dengan pencarian" : `Belum ada flyer untuk ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Flyer Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {paginatedFlyers.map((flyer) => (
              <Card
                key={flyer._id}
                className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
                  <img
                    src={flyer.imageUrl}
                    alt={flyer.title}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(flyer)}
                  />
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <Badge
                      variant={flyer.status === "active" ? "default" : "secondary"}
                      className={flyer.status === "active"
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-[10px] sm:text-xs"
                        : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-[10px] sm:text-xs"
                      }
                    >
                      {flyer.status === "active" ? "Aktif" : "Non-Aktif"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2 sm:p-4 space-y-1 sm:space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white line-clamp-2 flex-1">
                        {flyer.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs font-semibold shrink-0 ${
                          flyer.category === "Training"
                            ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                            : flyer.category === "Webinar"
                            ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700"
                            : "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700"
                        }`}
                      >
                        {flyer.category}
                      </Badge>
                    </div>
                    {flyer.description && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {flyer.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="font-semibold">
                        {MONTHS[flyer.month - 1]} {flyer.year}
                      </span>
                    </div>
                    {(flyer.tanggalTerbit || flyer.tanggalBroadcast) && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {flyer.tanggalTerbit && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Terbit:</span>
                            <span>{new Date(flyer.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                        {flyer.tanggalBroadcast && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">Broadcast:</span>
                            <span>{new Date(flyer.tanggalBroadcast).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2 p-2 sm:p-4 pt-1 sm:pt-2 border-t border-slate-200 dark:border-slate-700"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleImageClick(flyer)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Lihat</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(flyer)}
                      className={`cursor-pointer flex-1 h-7 sm:h-8 px-1 sm:px-2 ${
                        flyer.status === "active"
                          ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                      disabled={isUpdatingStatus}
                    >
                      {flyer.status === "active" ? (
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
                      onClick={() => handleEdit(flyer)}
                      className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-7 sm:h-8 px-1 sm:px-2"
                      disabled={isUpdatingStatus}
                    >
                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(flyer)}
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
        {sortedFlyers.length > itemsPerPage && (
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
      <FlyerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        flyer={editingFlyer}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingFlyer(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Flyer?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus flyer "{deletingFlyer?.title}"? Tindakan ini tidak dapat dibatalkan.
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
        <div className="grid grid-cols-4 gap-1 p-2">
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
            onClick={handleAdd}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Upload</span>
          </button>

          {/* Grid Toggle - Dummy button since there's no table view for flyers */}
          <button
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-muted opacity-50 cursor-not-allowed"
            disabled
          >
            <LayoutGrid className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Grid</span>
          </button>
        </div>
      </div>

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
                    <h3 className="font-semibold text-sm">Cari Flyer</h3>
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
                        placeholder="Cari flyer..."
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
                        <span>Ditemukan: {sortedFlyers.length} hasil</span>
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
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedFlyers.length}</span> flyer</p>
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
