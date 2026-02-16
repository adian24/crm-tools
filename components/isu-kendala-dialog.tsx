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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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

interface IsuKendalaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isuKendala: IsuKendala | null;
  onSuccess?: () => void;
}

export function IsuKendalaDialog({ open, onOpenChange, isuKendala, onSuccess }: IsuKendalaDialogProps) {
  // Mutations from server actions
  const addIsuKendala = useMutation(api.isuKendala.createIsuKendala);
  const updateIsuKendala = useMutation(api.isuKendala.updateIsuKendala);

  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [category, setCategory] = useState<"Internal" | "Eksternal" | "Operasional" | "Teknis">("Internal");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [tanggalKejadian, setTanggalKejadian] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [points, setPoints] = useState<string[]>([""]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when isuKendala changes or dialog opens/closes
  React.useEffect(() => {
    if (isuKendala) {
      setTitle(isuKendala.title);
      setMonth(isuKendala.month);
      setYear(isuKendala.year);
      setStatus(isuKendala.status);
      setCategory(isuKendala.category);
      setPriority(isuKendala.priority);
      setTanggalKejadian(isuKendala.tanggalKejadian || "");
      setTanggalSelesai(isuKendala.tanggalSelesai || "");
      setPoints(isuKendala.points.length > 0 ? isuKendala.points : [""]);
    } else {
      setTitle("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setStatus("active");
      setCategory("Internal");
      setPriority("Medium");
      setTanggalKejadian("");
      setTanggalSelesai("");
      setPoints([""]);
    }
  }, [isuKendala, open]);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  const handleAddPoint = () => {
    setPoints([...points, ""]);
  };

  const handleRemovePoint = (index: number) => {
    if (points.length > 1) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    } else {
      toast.error("❌ Minimal harus ada 1 point");
    }
  };

  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('❌ Judul wajib diisi!');
      return;
    }

    const validPoints = points.filter(p => p.trim() !== "");
    if (validPoints.length === 0) {
      toast.error('❌ Minimal harus ada 1 point isu!');
      return;
    }

    setIsSaving(true);
    try {
      let result;

      // Check if creating new or updating existing
      if (isuKendala) {
        console.log('Editing existing isu kendala:', isuKendala._id);
        // Update existing isu kendala
        result = await updateIsuKendala({
          id: isuKendala._id,
          title: title.trim(),
          month,
          year,
          points: validPoints,
          status,
          category,
          priority,
          tanggalKejadian: tanggalKejadian || undefined,
          tanggalSelesai: tanggalSelesai || undefined,
        });
      } else {
        console.log('Creating new isu kendala');
        // Create new isu kendala
        result = await addIsuKendala({
          title: title.trim(),
          month,
          year,
          points: validPoints,
          status,
          category,
          priority,
          tanggalKejadian: tanggalKejadian || undefined,
          tanggalSelesai: tanggalSelesai || undefined,
        });
      }

      if (result.success) {
        toast.success(isuKendala ? '✅ Isu Kendala berhasil diupdate' : '✅ Isu Kendala berhasil dibuat');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || '❌ Gagal menyimpan Isu Kendala');
      }
    } catch (error) {
      console.error('Error saving isu kendala:', error);
      toast.error('❌ Gagal menyimpan Isu Kendala');
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Internal": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
      case "Eksternal": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700";
      case "Operasional": return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700";
      case "Teknis": return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {isuKendala ? 'Edit Isu Kendala' : 'Tambah Isu Kendala Baru'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isuKendala ? 'Edit informasi Isu Kendala yang sudah ada' : 'Catat isu atau kendala yang terjadi'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul Isu <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kendala Server Down"
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
            />
          </div>

          {/* Points */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Point-Point Isu <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPoint}
                disabled={isSaving}
                className="cursor-pointer text-xs h-7 px-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Plus className="w-3 h-3 mr-1" />
                Tambah Point
              </Button>
            </div>
            <div className="space-y-2">
              {points.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={point}
                      onChange={(e) => handlePointChange(index, e.target.value)}
                      placeholder={`Point ${index + 1}`}
                      disabled={isSaving}
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                    />
                  </div>
                  {points.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePoint(index)}
                      disabled={isSaving}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              * Tekan Enter atau klik tombol "Tambah Point" untuk menambah point baru
            </p>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as "Internal" | "Eksternal" | "Operasional" | "Teknis")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Eksternal">Eksternal</SelectItem>
                  <SelectItem value="Operasional">Operasional</SelectItem>
                  <SelectItem value="Teknis">Teknis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Prioritas <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "Low" | "Medium" | "High" | "Critical")}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
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

          {/* Tanggal Kejadian & Tanggal Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Kejadian
              </Label>
              <Input
                type="date"
                value={tanggalKejadian}
                onChange={(e) => setTanggalKejadian(e.target.value)}
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
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan <span className="text-red-500">*</span>
              </Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun <span className="text-red-500">*</span>
              </Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="inactive">Non-Aktif</SelectItem>
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

IsuKendalaDialog.displayName = 'IsuKendalaDialog';
