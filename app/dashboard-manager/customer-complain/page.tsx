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
import { CustomerComplainDialog } from '@/components/customer-complain-dialog';
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
  Building2,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

interface CustomerComplain {
  _id: Id<"customerComplain">;
  namaPerusahaan: string;
  komplain: string;
  divisi: "Sales" | "CRM" | "Opration ISO" | "Opration ISPO" | "HR" | "Finance" | "Product Development" | "Tata Kelola" | "IT";
  tanggal: string;
  month: number;
  year: number;
  status: "active" | "inactive";
  priority: "Low" | "Medium" | "High" | "Critical";
  tanggalSelesai?: string;
  penyelesaian?: string;
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

export default function CustomerComplainPage() {
  const customerComplain = useQuery(api.customerComplain.getCustomerComplain);
  const deleteCustomerComplainMutation = useMutation(api.customerComplain.deleteCustomerComplain);
  const updateStatusMutation = useMutation(api.customerComplain.updateCustomerComplainStatus);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Default: current month (1-12)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComplain, setEditingComplain] = useState<CustomerComplain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComplain, setDeletingComplain] = useState<CustomerComplain | null>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewingComplain, setViewingComplain] = useState<CustomerComplain | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<'search' | 'date' | null>(null);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter customer complain
  const filteredCustomerComplain = customerComplain?.filter(complain => {
    const matchesMonth = selectedMonth === 0 || complain.month === selectedMonth;
    const matchesYear = complain.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      complain.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complain.komplain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }) || [];

  // Sort customer complain: active first, then by priority, then by updated date
  const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };

  const sortedCustomerComplain = [...filteredCustomerComplain].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.updatedAt - a.updatedAt;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedCustomerComplain.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomerComplain = sortedCustomerComplain.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery, itemsPerPage]);

  const handleAdd = () => {
    setEditingComplain(null);
    setDialogOpen(true);
  };

  const handleEdit = (complain: CustomerComplain) => {
    setEditingComplain(complain);
    setDialogOpen(true);
  };

  const handleDelete = (complain: CustomerComplain) => {
    setDeletingComplain(complain);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingComplain) return;

    setIsDeleting(true);
    try {
      await deleteCustomerComplainMutation({ id: deletingComplain._id });
      toast.success("✅ Customer Complain berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingComplain(null);
    } catch (error) {
      toast.error("❌ Gagal menghapus customer complain");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (complain: CustomerComplain) => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = complain.status === "active" ? "inactive" : "active";
      await updateStatusMutation({
        id: complain._id,
        status: newStatus,
      });
      toast.success(`✅ Customer Complain berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      toast.error("❌ Gagal mengubah status customer complain");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewDetail = (complain: CustomerComplain) => {
    setViewingComplain(complain);
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

  const getDivisiColor = (divisi: string) => {
    switch (divisi) {
      case "Sales": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
      case "CRM": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
      case "Opration ISO": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700";
      case "Opration ISPO": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700";
      case "HR": return "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-700";
      case "Finance": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700";
      case "Product Development": return "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700";
      case "Tata Kelola": return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700";
      case "IT": return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700";
      default: return "";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
      case "High":
        return <AlertTriangle className="h-3 w-3" />;
      case "Medium":
        return <AlertTriangle className="h-3 w-3" />;
      case "Low":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getPriorityCardBorder = (priority: string) => {
    switch (priority) {
      case "Critical": return "border-l-4 border-l-red-500";
      case "High": return "border-l-4 border-l-orange-500";
      case "Medium": return "border-l-4 border-l-yellow-500";
      case "Low": return "border-l-4 border-l-green-500";
      default: return "";
    }
  };

  const getPriorityCardBg = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10";
      case "High": return "bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10";
      case "Medium": return "bg-gradient-to-br from-yellow-50/50 to-lime-50/30 dark:from-yellow-950/20 dark:to-lime-950/10";
      case "Low": return "bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10";
      default: return "bg-white dark:bg-slate-800";
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">Customer Complain</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Catat dan kelola komplain dari customer per bulan
            </p>
          </div>
          <div className="hidden sm:flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              variant="outline"
              className="cursor-pointer border-slate-200 dark:border-slate-700 w-full sm:w-auto"
            >
              {viewMode === "grid" ? (
                <>
                  <TableIcon className="mr-2 h-4 w-4" />
                  Table View
                </>
              ) : (
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Grid View
                </>
              )}
            </Button>
            <Button
              onClick={handleAdd}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Complain
            </Button>
          </div>
        </div>

        {/* Filters - Desktop */}
        <Card className="hidden sm:block p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    <SelectItem key={idx} value={idx.toString()}>
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
                placeholder="Cari nama perusahaan atau komplain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Total Data Info */}
        {sortedCustomerComplain.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="text-slate-600 dark:text-slate-400 text-center sm:text-left">
              Total <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedCustomerComplain.length}</span> customer complain
            </div>
            {viewMode === "table" && (
              <div className="text-slate-600 dark:text-slate-400 text-center sm:text-right">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white mx-1">{startIndex + 1}-{Math.min(endIndex, sortedCustomerComplain.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white mx-1">{sortedCustomerComplain.length}</span> data
              </div>
            )}
          </div>
        )}

        {/* Customer Complain Grid */}
        {customerComplain === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedCustomerComplain.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Tidak ada customer complain
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? "Tidak ditemukan customer complain yang sesuai dengan pencarian" : `Belum ada customer complain untuk ${selectedMonth === 0 ? "semua bulan" : MONTHS[selectedMonth]} ${selectedYear}`}
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Catat Complain Pertama
              </Button>
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {sortedCustomerComplain.map((complain) => (
              <Card
                key={complain._id}
                className={`overflow-hidden shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow flex flex-col ${getPriorityCardBorder(complain.priority)} ${getPriorityCardBg(complain.priority)}`}
              >
                {/* Header with badges */}
                <div className="p-2 sm:p-4 space-y-1 sm:space-y-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-1 sm:gap-2">
                    <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white line-clamp-2 flex-1">
                      {complain.namaPerusahaan}
                    </h3>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge
                        variant={complain.status === "active" ? "default" : "secondary"}
                        className={complain.status === "active"
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-[10px] sm:text-xs"
                          : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-[10px] sm:text-xs"
                        }
                      >
                        {complain.status === "active" ? "Aktif" : "Selesai"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs font-semibold ${getDivisiColor(complain.divisi)}`}
                    >
                      {complain.divisi}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs font-semibold flex items-center gap-1 ${getPriorityColor(complain.priority)}`}
                    >
                      {getPriorityIcon(complain.priority)}
                      {complain.priority}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2 sm:p-4 space-y-1 sm:space-y-3 flex-1">
                  <div className="space-y-1 sm:space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Komplain:
                    </p>
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg border-2 border-red-200 dark:border-red-800 p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug line-clamp-3">
                        {complain.komplain}
                      </p>
                    </div>
                  </div>

                  {complain.penyelesaian && (
                    <div className="space-y-1 sm:space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Penyelesaian:
                      </p>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                          {complain.penyelesaian}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-1 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="font-semibold">
                        {new Date(complain.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {complain.tanggalSelesai && (
                      <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                        <span className="font-semibold">
                          Selesai: {new Date(complain.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2 p-2 sm:p-4 pt-1 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetail(complain)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                    <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Lihat</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(complain)}
                    className={`cursor-pointer flex-1 h-7 sm:h-8 px-1 sm:px-2 ${
                      complain.status === "active"
                        ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                    disabled={isUpdatingStatus}
                  >
                    {complain.status === "active" ? (
                      <>
                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                        <span className="hidden sm:inline text-xs">Selesai</span>
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
                    onClick={() => handleEdit(complain)}
                    className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-7 sm:h-8 px-1 sm:px-2"
                    disabled={isUpdatingStatus}
                  >
                    <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(complain)}
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
        ) : (
          /* Table View */
          <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Perusahaan</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Divisi</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Komplain</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Priority</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Tanggal</TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomerComplain.map((complain) => (
                    <TableRow
                      key={complain._id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${getPriorityCardBg(complain.priority)}`}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{complain.namaPerusahaan}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${getDivisiColor(complain.divisi)}`}
                        >
                          {complain.divisi}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 max-w-md">
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {complain.komplain}
                        </p>
                        {complain.penyelesaian && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 line-clamp-1">
                            ✓ {complain.penyelesaian}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold flex items-center gap-1 w-fit ${getPriorityColor(complain.priority)}`}
                        >
                          {getPriorityIcon(complain.priority)}
                          {complain.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={complain.status === "active" ? "default" : "secondary"}
                          className={complain.status === "active"
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                            : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                          }
                        >
                          {complain.status === "active" ? "Aktif" : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {new Date(complain.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </div>
                          {complain.tanggalSelesai && (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {new Date(complain.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(complain)}
                            className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8 p-0"
                            disabled={isUpdatingStatus}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(complain)}
                            className={`cursor-pointer h-8 w-8 p-0 ${
                              complain.status === "active"
                                ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                            disabled={isUpdatingStatus}
                          >
                            {complain.status === "active" ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(complain)}
                            className="cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 w-8 p-0"
                            disabled={isUpdatingStatus}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(complain)}
                            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                            disabled={isDeleting || isUpdatingStatus}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Add/Edit Dialog */}
      <CustomerComplainDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customerComplain={editingComplain}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingComplain(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Customer Complain?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus customer complain "{deletingComplain?.namaPerusahaan}"? Tindakan ini tidak dapat dibatalkan.
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
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <AlertDialogTitle className="text-2xl">{viewingComplain?.namaPerusahaan}</AlertDialogTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${getDivisiColor(viewingComplain?.divisi || "")}`}
                  >
                    {viewingComplain?.divisi}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold flex items-center gap-1 ${getPriorityColor(viewingComplain?.priority || "")}`}
                  >
                    {getPriorityIcon(viewingComplain?.priority || "")}
                    {viewingComplain?.priority}
                  </Badge>
                  <Badge
                    variant={viewingComplain?.status === "active" ? "default" : "secondary"}
                    className={viewingComplain?.status === "active"
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs"
                      : "bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
                    }
                  >
                    {viewingComplain?.status === "active" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">Komplain:</p>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg border-2 border-red-200 dark:border-red-800 p-4 shadow-sm">
                <p className="text-base text-slate-700 dark:text-slate-300 leading-snug">
                  {viewingComplain?.komplain}
                </p>
              </div>
            </div>

            {viewingComplain?.penyelesaian && (
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">Penyelesaian:</p>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 p-4 shadow-sm">
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-snug">
                    {viewingComplain.penyelesaian}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Komplain:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(viewingComplain?.tanggal || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {viewingComplain?.tanggalSelesai && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Selesai:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(viewingComplain.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dibuat oleh: {viewingComplain?.createdByName} pada {new Date(viewingComplain?.createdAt || 0).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {viewingComplain?.updatedByName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Terakhir diupdate oleh: {viewingComplain.updatedByName} pada {new Date(viewingComplain.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    <h3 className="font-semibold text-sm">Cari Customer Complain</h3>
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
                        placeholder="Cari nama perusahaan atau komplain..."
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
                        <span>Ditemukan: {sortedCustomerComplain.length} hasil</span>
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
                      <p>📊 Menampilkan <span className="font-bold text-foreground">{sortedCustomerComplain.length}</span> customer complain</p>
                      <p className="mt-1">
                        {selectedMonth === 0 ? "Semua bulan" : MONTHS[selectedMonth]} {selectedYear}
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
