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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { NewClientDialog } from '@/components/new-client-dialog';
import { useFilterContext } from '@/components/tabs/laporan-kunjungan-tabs';
import { toast } from 'sonner';
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  Phone,
  User,
  Building2,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

interface NewClient {
  _id: Id<"crmNewClient">;
  namaClient: string;
  namaPicClient: string;
  noHp: string;
  picTsi: string;
  tglKunjungan: string;
  month: number;
  year: number;
  catatan?: string;
  tindakLanjut?: string;
  fotoBukti?: string;
  created_by?: Id<"users">;
  createdByName: string;
  updated_by?: Id<"users">;
  updatedByName?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
  _creationTime?: number;
}

const MONTHS = [
  "All", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function NewClientView() {
  // Get filter state from context
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, searchQuery, setSearchQuery, viewMode, setViewMode, newAddTrigger, setNewAddTrigger } = useFilterContext();

  // Queries
  const newClients = useQuery(api.crmNewClient.getAllNewClients);
  const deleteClientMutation = useMutation(api.crmNewClient.deleteCrmNewClient);

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<NewClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<NewClient | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<NewClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter new clients
  const filteredClients = newClients?.filter(item => {
    const matchesMonth = selectedMonth === 0 || item.month === selectedMonth;
    const matchesYear = item.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      item.namaClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaPicClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picTsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort clients by date descending
  const sortedClients = [...filteredClients].sort((a, b) => {
    return new Date(b.tglKunjungan).getTime() - new Date(a.tglKunjungan).getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  // Image viewer
  const imageList = sortedClients
    .filter(c => !!c.fotoBukti)
    .map(c => ({ src: c.fotoBukti!, label: c.namaClient }));

  const previewImage = previewIndex !== null ? imageList[previewIndex] : null;
  const goPrev = () => setPreviewIndex(i => i !== null ? (i - 1 + imageList.length) % imageList.length : null);
  const goNext = () => setPreviewIndex(i => i !== null ? (i + 1) % imageList.length : null);

  React.useEffect(() => {
    if (previewIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') setPreviewIndex(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewIndex, imageList.length]);

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: NewClient) => {
    setEditingClient(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: NewClient) => {
    setDeletingClient(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;

    setIsDeleting(true);
    try {
      await deleteClientMutation({ id: deletingClient._id });
      toast.success("✅ New Client berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus new client");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetail = (item: NewClient) => {
    setViewingClient(item);
    setViewDetailOpen(true);
  };

  React.useEffect(() => {
    if (newAddTrigger > 0) {
      handleAdd();
      setNewAddTrigger(0);
    }
  }, [newAddTrigger]);

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-5 shadow-lg">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-purple-400/20 blur-2xl" />

          <div className="relative flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm">
              <Handshake className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">Laporan Kunjungan</h2>
                <span className="rounded-md bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">New Client</span>
              </div>
              <p className="mt-1 text-base text-blue-200">
                Catat dan kelola kunjungan ke klien baru per bulan
              </p>
            </div>
          </div>
        </div>

        {/* Total Data Info */}
        {sortedClients.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
              {/* Total New Client Badge */}
              <Card className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">Total:</span>
                  <span className="text-blue-900 dark:text-blue-100 text-sm font-bold">{sortedClients.length}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">new client</span>
                </div>
              </Card>
            </div>
            {viewMode === "table" && (
              <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, sortedClients.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedClients.length}</span> data
              </div>
            )}
          </div>
        )}

        {/* New Clients Grid */}
        {newClients === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedClients.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <Handshake className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada new client
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan new client yang sesuai dengan pencarian" : `Belum ada kunjungan untuk ${selectedMonth === 0 ? "semua bulan" : MONTHS[selectedMonth]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Kunjungan Pertama
              </Button>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedClients.map((item) => (
              <Card
                key={item._id}
                className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group"
              >
                {/* Image */}
                <div
                  className={`relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${item.fotoBukti ? 'cursor-zoom-in' : ''}`}
                  onClick={() => {
                    if (!item.fotoBukti) return;
                    const idx = imageList.findIndex(img => img.src === item.fotoBukti);
                    if (idx !== -1) setPreviewIndex(idx);
                  }}
                >
                  {item.fotoBukti ? (
                    <>
                      <img
                        src={item.fotoBukti}
                        alt="Foto Bukti"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center">
                        <Eye className="h-7 w-7 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                      <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-600">Tidak ada foto</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-1 gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {item.namaClient}
                  </h3>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <User className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                      <span className="font-semibold flex-shrink-0 text-slate-500 dark:text-slate-500">PIC Client:</span>
                      <span className="truncate">{item.namaPicClient}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                      <span className="font-semibold flex-shrink-0 text-slate-500 dark:text-slate-500">PIC TSI:</span>
                      <span className="truncate">{item.picTsi}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{item.noHp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{new Date(item.tglKunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Catatan */}
                  {item.catatan && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 rounded-md px-2 py-1.5 border border-blue-100 dark:border-blue-900/60">
                      <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mb-0.5">Catatan</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2 leading-snug">{item.catatan}</p>
                    </div>
                  )}

                  {/* Tindak Lanjut */}
                  {item.tindakLanjut && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-md px-2 py-1.5 border border-emerald-100 dark:border-emerald-900/60">
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">Tindak Lanjut</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 line-clamp-2 leading-snug">{item.tindakLanjut}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/60 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1 h-7 text-xs cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-1.5"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                      className="h-7 w-7 p-0 cursor-pointer border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead className="min-w-[120px]">Client</TableHead>
                    <TableHead className="min-w-[120px]">PIC Client</TableHead>
                    <TableHead className="min-w-[100px]">No HP</TableHead>
                    <TableHead className="min-w-[100px]">PIC TSI</TableHead>
                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                    <TableHead className="text-center min-w-[70px]">Foto</TableHead>
                    <TableHead className="min-w-[150px]">Catatan</TableHead>
                    <TableHead className="min-w-[150px]">Tindak Lanjut</TableHead>
                    <TableHead className="text-right min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {paginatedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">No Data Found</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                  ? 'Try adjusting your search terms'
                                  : 'Belum ada kunjungan untuk periode ini'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((item, index) => (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => handleEdit(item)}
                        >
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md mx-auto">
                              {startIndex + index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.namaClient}</TableCell>
                          <TableCell>{item.namaPicClient}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{item.noHp}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.picTsi}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{new Date(item.tglKunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.fotoBukti ? (
                              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-xs font-semibold">Ada</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-600">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-xs">Tidak</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {item.catatan || "-"}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {item.tindakLanjut || "-"}
                            </p>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(item);
                                }}
                                className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8 p-0"
                                title="Lihat Detail"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                className="cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item);
                                }}
                                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                disabled={isDeleting}
                                title="Hapus"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
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
          </Card>
        )}
      </div>

      {/* Image Viewer */}
      {previewImage && previewIndex !== null && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {previewIndex + 1} / {imageList.length}
          </div>

          {imageList.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="flex flex-col items-center gap-3 px-20" onClick={e => e.stopPropagation()}>
            <img
              src={previewImage.src}
              alt={previewImage.label}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white/80 text-sm font-medium text-center">{previewImage.label}</p>
          </div>

          {imageList.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {imageList.length > 1 && (
            <div className="absolute bottom-6 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              {imageList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIndex(i)}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === previewIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <NewClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingClient(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus New Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus new client "{deletingClient?.namaClient}"? Tindakan ini tidak dapat dibatalkan.
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
        <AlertDialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <AlertDialogTitle className="text-xl sm:text-2xl break-words">{viewingClient?.namaClient}</AlertDialogTitle>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            {/* Foto Bukti */}
            {viewingClient?.fotoBukti && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Foto Bukti Kunjungan:</p>
                <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  <img
                    src={viewingClient.fotoBukti}
                    alt="Foto Bukti Kunjungan"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Client:</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.namaPicClient}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No HP:</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.noHp}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC TSI:</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingClient?.picTsi}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kunjungan:</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                    {new Date(viewingClient?.tglKunjungan || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {viewingClient?.catatan && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Catatan:</p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingClient.catatan}
                  </p>
                </div>
              </div>
            )}

            {viewingClient?.tindakLanjut && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Tindak Lanjut:</p>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingClient.tindakLanjut}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-xs">
              <p className="text-slate-500 dark:text-slate-400 break-words">
                Dibuat oleh: {viewingClient?.createdByName} pada {new Date(viewingClient?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingClient?.updatedByName && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 break-words">
                  Terakhir diupdate oleh: {viewingClient.updatedByName} pada {new Date(viewingClient.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <span className="text-[10px] font-medium">Tambah</span>
          </button>

          {/* Grid/Table Toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              viewMode === "grid" ? 'bg-purple-100 hover:bg-purple-200 text-purple-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {viewMode === "grid" ? (
              <>
                <TableIcon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Table</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Grid</span>
              </>
            )}
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
                    <h3 className="font-semibold text-sm">Cari New Client</h3>
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
                        placeholder="Cari client, PIC, atau TSI..."
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
                        <span>Ditemukan: {sortedClients.length} hasil</span>
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
                            <SelectItem key={idx} value={idx.toString()}>
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
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedClients.length}</span> new client</p>
                      <p className="mt-1">
                        {selectedMonth === 0 ? 'Semua bulan' : MONTHS[selectedMonth]} {selectedYear}
                      </p>
                    </div>

                    <Button
                      onClick={() => setMobileFilterOpen(null)}
                      className="w-full"
                    >
                      Terapkan
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
