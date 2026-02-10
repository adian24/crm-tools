"use client";

import React, { useState, useEffect } from 'react';
import { getAssociates, deleteAssociate } from '@/lib/actions/master-associate-actions';
import AssociateDialog from '@/components/master-associate-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export interface Associate {
  kode: string;
  nama: string;
  kategori: 'Direct' | 'Associate';
  status: 'Aktif' | 'Non-Aktif';
}

export default function MasterAssociatePage() {
  const router = useRouter();
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [filteredAssociates, setFilteredAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; kode: string; nama: string } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Fetch associates on mount
  useEffect(() => {
    fetchAssociates();
  }, []);

  // Filter associates based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssociates(associates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = associates.filter(
        (assoc) =>
          assoc.kode.toLowerCase().includes(query) ||
          assoc.nama.toLowerCase().includes(query) ||
          assoc.kategori.toLowerCase().includes(query)
      );
      setFilteredAssociates(filtered);
    }
  }, [searchQuery, associates]);

  const fetchAssociates = async () => {
    setLoading(true);
    try {
      const data = await getAssociates();
      setAssociates(data);
      setFilteredAssociates(data);
    } catch (error) {
      toast.error('Gagal memuat data associate');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedAssociate(null);
    setDialogOpen(true);
  };

  const handleEdit = (associate: Associate) => {
    setSelectedAssociate(associate);
    setDialogOpen(true);
  };

  const handleDelete = async (kode: string, nama: string) => {
    setDeleteConfirm({ show: true, kode, nama });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const result = await deleteAssociate(deleteConfirm.kode);
      if (result.success) {
        toast.success(`✅ ${result.message}`);
        await fetchAssociates();
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      toast.error('Gagal menghapus associate');
      console.error(error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getKategoriBadgeColor = (kategori: string) => {
    switch (kategori) {
      case 'Direct':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Associate':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'Aktif'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssociates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAssociates.length);
  const paginatedData = filteredAssociates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Master Associate
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Kelola data associate (Total: {associates.length})
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Associate
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <Input
          placeholder="Cari berdasarkan kode, nama, atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {searchQuery && (
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {filteredAssociates.length} hasil
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-semibold text-blue-100 mb-1">Total Associate</div>
          <div className="text-2xl font-bold">{associates.length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-semibold text-emerald-100 mb-1">Aktif</div>
          <div className="text-2xl font-bold">{associates.filter(a => a.status === 'Aktif').length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-semibold text-purple-100 mb-1">Direct</div>
          <div className="text-2xl font-bold">{associates.filter(a => a.kategori === 'Direct').length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm font-semibold text-green-100 mb-1">Associate</div>
          <div className="text-2xl font-bold">{associates.filter(a => a.kategori === 'Associate').length}</div>
        </div>
      </div>

      {/* Table with Pagination Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Items Per Page & Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">entries</span>
          </div>

          {filteredAssociates.length > 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
              <span className="font-bold">{endIndex}</span> of{' '}
              <span className="font-bold">{filteredAssociates.length}</span> entries
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <TableHead className="w-[80px] text-center">No</TableHead>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Associate</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                      <span className="text-slate-600 dark:text-slate-400">Memuat data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssociates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Users className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                        {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Tidak ada data associate'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((associate, index) => (
                  <TableRow key={associate.kode} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-blue-600 dark:text-blue-400">
                      {associate.kode}
                    </TableCell>
                    <TableCell className="font-medium">{associate.nama}</TableCell>
                    <TableCell>
                      <Badge className={getKategoriBadgeColor(associate.kategori)}>
                        {associate.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(associate.status)}>
                        {associate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(associate)}
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(associate.kode, associate.nama)}
                          className="cursor-pointer hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page <span className="font-bold">{currentPage}</span> of{' '}
              <span className="font-bold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className={`cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </Button>
                )
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <AssociateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        associate={selectedAssociate}
        onSuccess={fetchAssociates}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2">Konfirmasi Hapus</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Apakah Anda yakin ingin menghapus associate <strong>{deleteConfirm.nama}</strong> ({deleteConfirm.kode})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="cursor-pointer"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
