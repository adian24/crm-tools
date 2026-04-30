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
import { KunjunganEngagementPartnershipDialog } from '@/components/kunjungan-engagement-partnership-dialog';
import { toast } from 'sonner';
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Building2,
  LayoutGrid,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface KunjunganEngagementPartnership {
  _id: Id<"kunjunganEngagementPartnership">;
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

export default function KunjunganEngagementPartnershipPage() {
  const kunjungan = useQuery(api.kunjunganEngagementPartnership.getKunjunganEngagementPartnership);
  const deleteKunjunganMutation = useMutation(api.kunjunganEngagementPartnership.deleteKunjunganEngagementPartnership);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKunjungan, setEditingKunjungan] = useState<KunjunganEngagementPartnership | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingKunjungan, setDeletingKunjungan] = useState<KunjunganEngagementPartnership | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingKunjungan, setViewingKunjungan] = useState<KunjunganEngagementPartnership | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter kunjungan
  const filteredKunjungan = kunjungan?.filter(item => {
    const matchesMonth = selectedMonth === 0 || item.month === selectedMonth;
    const matchesYear = item.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      item.namaClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaPicClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picTsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort kunjungan by date descending
  const sortedKunjungan = [...filteredKunjungan].sort((a, b) => {
    return new Date(b.tglKunjungan).getTime() - new Date(a.tglKunjungan).getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedKunjungan.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedKunjungan = sortedKunjungan.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  // Image viewer
  const imageList = sortedKunjungan
    .filter(c => !!c.fotoBukti)
    .map(c => ({
      src: c.fotoBukti!,
      label: c.namaClient,
      pic: c.namaPicClient,
      picTsi: c.picTsi,
      noHp: c.noHp,
      tanggal: new Date(c.tglKunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      catatan: c.catatan,
      tindakLanjut: c.tindakLanjut,
    }));

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
    setEditingKunjungan(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: KunjunganEngagementPartnership) => {
    setEditingKunjungan(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: KunjunganEngagementPartnership) => {
    setDeletingKunjungan(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKunjungan) return;

    setIsDeleting(true);
    try {
      await deleteKunjunganMutation({ id: deletingKunjungan._id });
      toast.success("✅ Kunjungan Engagement Partnership berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingKunjungan(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus kunjungan");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetail = (item: KunjunganEngagementPartnership) => {
    setViewingKunjungan(item);
    setViewDetailOpen(true);
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 pt-3 pb-2">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Engagement & Partnership</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Catat dan kelola kunjungan engagement partnership per bulan</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-auto flex-wrap">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="h-9 w-36 text-xs font-semibold border-2 border-purple-400 bg-purple-50 text-purple-700 focus:ring-purple-400 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
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
                  placeholder="Cari client, PIC, atau TSI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 w-48 text-xs border-slate-300 focus:ring-slate-400"
                />
              </div>
              <Button
                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                variant="outline"
                size="sm"
                className="h-9 cursor-pointer border-slate-300"
              >
                {viewMode === "grid" ? <TableIcon className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
              </Button>
              <Button
                onClick={handleAdd}
                size="sm"
                className="h-9 cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Kunjungan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 sm:space-y-6 px-4 sm:px-8 pb-20 sm:pb-8 pt-2">
        {/* Total Data Info */}
        {sortedKunjungan.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="text-slate-600 dark:text-slate-400 text-center sm:text-left">
              Total <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedKunjungan.length}</span> kunjungan engagement partnership
            </div>
            {viewMode === "table" && (
              <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, sortedKunjungan.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedKunjungan.length}</span> data
              </div>
            )}
          </div>
        )}

        {/* Kunjungan Grid */}
        {kunjungan === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedKunjungan.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <Handshake className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada kunjungan engagement partnership
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan kunjungan yang sesuai dengan pencarian" : `Belum ada kunjungan untuk ${selectedMonth === 0 ? "semua bulan" : MONTHS[selectedMonth]} ${selectedYear}`}
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
            {sortedKunjungan.map((item) => (
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

                  {item.catatan && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 rounded-md px-2 py-1.5 border border-blue-100 dark:border-blue-900/60">
                      <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mb-0.5">Catatan</p>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-snug">{item.catatan}</p>
                    </div>
                  )}

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
                    {paginatedKunjungan.length === 0 ? (
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
                      paginatedKunjungan.map((item, index) => (
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
                          <TableCell>
                            <p className="text-sm font-bold">
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
      {previewIndex !== null && imageList[previewIndex] && (
        <div
          className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/95 backdrop-blur-sm flex flex-col overflow-hidden"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="text-white/60 text-sm font-medium">{previewIndex + 1} / {imageList.length}</div>
            <button onClick={() => setPreviewIndex(null)} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main: image 80% | info 20% */}
          <div className="flex flex-1 min-h-0">
            {/* Image area */}
            <div className="relative w-4/5 flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {imageList.length > 1 && (
                <button onClick={goPrev} className="absolute left-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer z-10">
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <img src={imageList[previewIndex].src} alt={imageList[previewIndex].label} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl px-16 py-4" />
              {imageList.length > 1 && (
                <button onClick={goNext} className="absolute right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer z-10">
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Info panel */}
            <div className="w-1/5 border-l border-white/10 flex flex-col p-5 gap-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Client</p>
                <p className="text-white font-semibold text-sm leading-snug">{imageList[previewIndex].label}</p>
              </div>
              {imageList[previewIndex].pic && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">PIC Client</p>
                  <p className="text-white/80 text-sm">{imageList[previewIndex].pic}</p>
                </div>
              )}
              {imageList[previewIndex].picTsi && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">PIC TSI</p>
                  <p className="text-white/80 text-sm">{imageList[previewIndex].picTsi}</p>
                </div>
              )}
              {imageList[previewIndex].noHp && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">No. HP</p>
                  <p className="text-white/80 text-sm">{imageList[previewIndex].noHp}</p>
                </div>
              )}
              {imageList[previewIndex].tanggal && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Tanggal Kunjungan</p>
                  <p className="text-white/80 text-sm">{imageList[previewIndex].tanggal}</p>
                </div>
              )}
              {imageList[previewIndex].catatan && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Catatan</p>
                  <p className="text-white/80 text-base leading-relaxed">{imageList[previewIndex].catatan}</p>
                </div>
              )}
              {imageList[previewIndex].tindakLanjut && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Tindak Lanjut</p>
                  <p className="text-white/80 text-base leading-relaxed">{imageList[previewIndex].tindakLanjut}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dot indicators */}
          {imageList.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {imageList.map((_, i) => (
                <button key={i} onClick={() => setPreviewIndex(i)} className={`rounded-full transition-all cursor-pointer ${i === previewIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <KunjunganEngagementPartnershipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kunjungan={editingKunjungan}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingKunjungan(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kunjungan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kunjungan "{deletingKunjungan?.namaClient}"? Tindakan ini tidak dapat dibatalkan.
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
                  <AlertDialogTitle className="text-xl sm:text-2xl break-words">{viewingKunjungan?.namaClient}</AlertDialogTitle>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            {/* Foto Bukti */}
            {viewingKunjungan?.fotoBukti && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Foto Bukti Kunjungan:</p>
                <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  <img
                    src={viewingKunjungan.fotoBukti}
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
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingKunjungan?.namaPicClient}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No HP:</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingKunjungan?.noHp}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC TSI:</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{viewingKunjungan?.picTsi}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kunjungan:</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                    {new Date(viewingKunjungan?.tglKunjungan || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {viewingKunjungan?.catatan && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Catatan:</p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingKunjungan.catatan}
                  </p>
                </div>
              </div>
            )}

            {viewingKunjungan?.tindakLanjut && (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Tindak Lanjut:</p>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {viewingKunjungan.tindakLanjut}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-xs">
              <p className="text-slate-500 dark:text-slate-400 break-words">
                Dibuat oleh: {viewingKunjungan?.createdByName} pada {new Date(viewingKunjungan?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingKunjungan?.updatedByName && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 break-words">
                  Terakhir diupdate oleh: {viewingKunjungan.updatedByName} pada {new Date(viewingKunjungan.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    <h3 className="font-semibold text-sm">Cari Kunjungan</h3>
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
                        <span>Ditemukan: {sortedKunjungan.length} hasil</span>
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
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedKunjungan.length}</span> kunjungan</p>
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
