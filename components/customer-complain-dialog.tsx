"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, X, Loader2 } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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

interface CustomerComplainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerComplain: CustomerComplain | null;
  onSuccess?: () => void;
}

export function CustomerComplainDialog({ open, onOpenChange, customerComplain, onSuccess }: CustomerComplainDialogProps) {
  // Mutations from server actions
  const addCustomerComplain = useMutation(api.customerComplain.createCustomerComplain);
  const updateCustomerComplain = useMutation(api.customerComplain.updateCustomerComplain);

  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [komplain, setKomplain] = useState("");
  const [divisi, setDivisi] = useState<"Sales" | "CRM" | "Opration ISO" | "Opration ISPO" | "HR" | "Finance" | "Product Development" | "Tata Kelola" | "IT">("Sales");
  const [tanggal, setTanggal] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [penyelesaian, setPenyelesaian] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when customerComplain changes or dialog opens/closes
  React.useEffect(() => {
    if (customerComplain) {
      setNamaPerusahaan(customerComplain.namaPerusahaan);
      setKomplain(customerComplain.komplain);
      setDivisi(customerComplain.divisi);
      setTanggal(customerComplain.tanggal);
      setStatus(customerComplain.status);
      setPriority(customerComplain.priority);
      setTanggalSelesai(customerComplain.tanggalSelesai || "");
      setPenyelesaian(customerComplain.penyelesaian || "");
    } else {
      setNamaPerusahaan("");
      setKomplain("");
      setDivisi("Sales");
      setTanggal("");
      setStatus("active");
      setPriority("Medium");
      setTanggalSelesai("");
      setPenyelesaian("");
    }
  }, [customerComplain, open]);

  const handleSave = async () => {
    // Validation
    if (!namaPerusahaan.trim()) {
      toast.error('❌ Nama Perusahaan wajib diisi!');
      return;
    }

    if (!komplain.trim()) {
      toast.error('❌ Komplain wajib diisi!');
      return;
    }

    if (!tanggal) {
      toast.error('❌ Tanggal wajib diisi!');
      return;
    }

    // Extract month and year from tanggal
    const dateObj = new Date(tanggal);
    const month = dateObj.getMonth() + 1; // 1-12
    const year = dateObj.getFullYear();

    setIsSaving(true);
    try {
      let result;

      // Check if creating new or updating existing
      if (customerComplain) {
        console.log('Editing existing customer complain:', customerComplain._id);
        // Update existing customer complain
        result = await updateCustomerComplain({
          id: customerComplain._id,
          namaPerusahaan: namaPerusahaan.trim(),
          komplain: komplain.trim(),
          divisi,
          tanggal,
          month,
          year,
          status,
          priority,
          tanggalSelesai: tanggalSelesai || undefined,
          penyelesaian: penyelesaian.trim() || undefined,
        });
      } else {
        console.log('Creating new customer complain');
        // Create new customer complain
        result = await addCustomerComplain({
          namaPerusahaan: namaPerusahaan.trim(),
          komplain: komplain.trim(),
          divisi,
          tanggal,
          month,
          year,
          status,
          priority,
          tanggalSelesai: tanggalSelesai || undefined,
          penyelesaian: penyelesaian.trim() || undefined,
        });
      }

      if (result.success) {
        toast.success(customerComplain ? '✅ Customer Complain berhasil diupdate' : '✅ Customer Complain berhasil dibuat');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || '❌ Gagal menyimpan Customer Complain');
      }
    } catch (error) {
      console.error('Error saving customer complain:', error);
      toast.error('❌ Gagal menyimpan Customer Complain');
    } finally {
      setIsSaving(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {customerComplain ? 'Edit Customer Complain' : 'Tambah Customer Complain Baru'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {customerComplain ? 'Edit informasi Customer Complain yang sudah ada' : 'Catat komplain dari customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nama Perusahaan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Perusahaan <span className="text-red-500">*</span>
            </Label>
            <Input
              value={namaPerusahaan}
              onChange={(e) => setNamaPerusahaan(e.target.value)}
              placeholder="Contoh: PT. Maju Jaya"
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
            />
          </div>

          {/* Komplain */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Komplain <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={komplain}
              onChange={(e) => setKomplain(e.target.value)}
              placeholder="Jelaskan komplain dari customer..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm resize-y"
            />
          </div>

          {/* Divisi & Priority */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Divisi <span className="text-red-500">*</span>
              </Label>
              <Select value={divisi} onValueChange={(v) => setDivisi(v as "Sales" | "CRM" | "Opration ISO" | "Opration ISPO" | "HR" | "Finance" | "Product Development" | "Tata Kelola" | "IT")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm w-full">
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="CRM">CRM</SelectItem>
                  <SelectItem value="Opration ISO">Opration ISO</SelectItem>
                  <SelectItem value="Opration ISPO">Opration ISPO</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Product Development">Product Development</SelectItem>
                  <SelectItem value="Tata Kelola">Tata Kelola</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Prioritas <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "Low" | "Medium" | "High" | "Critical")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm w-full">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low (Rendah)</SelectItem>
                  <SelectItem value="Medium">Medium (Sedang)</SelectItem>
                  <SelectItem value="High">High (Tinggi)</SelectItem>
                  <SelectItem value="Critical">Critical (Kritis)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tanggal & Tanggal Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Komplain <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Selesai
              </Label>
              <Input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                disabled={isSaving}
                min={tanggal}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* Penyelesaian */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Penyelesaian
            </Label>
            <Textarea
              value={penyelesaian}
              onChange={(e) => setPenyelesaian(e.target.value)}
              placeholder="Jelaskan penyelesaian masalah..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm resize-y"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
              <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Selesai</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="cursor-pointer flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="ml-2">Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span className="ml-2">Simpan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

CustomerComplainDialog.displayName = 'CustomerComplainDialog';
