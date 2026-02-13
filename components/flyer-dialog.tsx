"use client";

import React, { useState, useRef } from 'react';
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
import { Save, X, Loader2, Upload } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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

interface FlyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flyer: Flyer | null;
  onSuccess?: () => void;
}

export function FlyerDialog({ open, onOpenChange, flyer, onSuccess }: FlyerDialogProps) {
  // Mutations from server actions
  const addFlyer = useMutation(api.flyers.createFlyer);
  const updateFlyer = useMutation(api.flyers.updateFlyer);
  const deleteFlyer = useMutation(api.flyers.deleteFlyer);
  const updateFlyerStatus = useMutation(api.flyers.updateFlyerStatus);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [category, setCategory] = useState<"Training" | "Webinar" | "Promosi">("Promosi");
  const [tanggalTerbit, setTanggalTerbit] = useState("");
  const [tanggalBroadcast, setTanggalBroadcast] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when flyer changes or dialog opens/closes
  React.useEffect(() => {
    if (flyer) {
      setTitle(flyer.title);
      setDescription(flyer.description || "");
      setMonth(flyer.month);
      setYear(flyer.year);
      setStatus(flyer.status);
      setCategory(flyer.category);
      setTanggalTerbit(flyer.tanggalTerbit || "");
      setTanggalBroadcast(flyer.tanggalBroadcast || "");
      setImageUrl(flyer.imageUrl);
    } else {
      setTitle("");
      setDescription("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setStatus("active");
      setCategory("Promosi");
      setTanggalTerbit("");
      setTanggalBroadcast("");
      setImageUrl("");
    }
  }, [flyer, open]);

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (images only)
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Harap pilih file gambar');
      return;
    }

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);

    // Compress image and convert to base64 (like CRM mass update dialog)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (max 1024px)
        const MAX_DIMENSION = 1024;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast.error('❌ Gagal memproses gambar');
          setIsUploading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Reduce quality until size is under limit (500KB)
        while (compressedDataUrl.length > 500 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setImageUrl(compressedDataUrl);
        setIsUploading(false);
        toast.success('✅ Foto berhasil diupload');
      };
      img.onerror = () => {
        toast.error('❌ Gagal memuat gambar');
        setIsUploading(false);
      };
    };
    reader.onerror = () => {
      toast.error('❌ Gagal membaca file');
      setIsUploading(false);
    };
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('❌ Judul wajib diisi!');
      return;
    }

    if (!imageUrl && !flyer) {
      toast.error('❌ Harap pilih gambar!');
      return;
    }

    setIsSaving(true);
    try {
      let result;

      // Check if creating new or updating existing
      if (flyer) {
        console.log('Editing existing flyer:', flyer._id);
        // Update existing flyer
        result = await updateFlyer({
          id: flyer._id,
          title: title.trim(),
          description: description.trim() || undefined,
          month,
          year,
          imageUrl: imageUrl,
          status,
          category,
          tanggalTerbit: tanggalTerbit || undefined,
          tanggalBroadcast: tanggalBroadcast || undefined,
        });
      } else {
        console.log('Creating new flyer');
        // Create new flyer
        result = await addFlyer({
          title: title.trim(),
          description: description.trim() || undefined,
          month,
          year,
          imageUrl: imageUrl, // Directly use base64 data URL
          status,
          category,
          tanggalTerbit: tanggalTerbit || undefined,
          tanggalBroadcast: tanggalBroadcast || undefined,
        });
      }

      if (result.success) {
        toast.success(flyer ? '✅ Flyer berhasil diupdate' : '✅ Flyer berhasil dibuat');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || '❌ Gagal menyimpan Flyer');
      }
    } catch (error) {
      console.error('Error saving flyer:', error);
      toast.error('❌ Gagal menyimpan Flyer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {flyer ? 'Edit Flyer' : 'Upload Flyer Baru'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {flyer ? 'Edit informasi Flyer yang sudah ada' : 'Upload Flyer baru untuk promosi'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gambar Flyer <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading || isSaving}
                  className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengupload & mengkompresi foto...</span>
                  </div>
                )}
              </div>
              {imageUrl && (
                <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Preview:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageUrl("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      disabled={isUploading || isSaving}
                      className="cursor-pointer text-xs text-red-600 hover:text-red-700 h-7 px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Hapus
                    </Button>
                  </div>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full max-h-48 object-cover rounded-lg border shadow-lg"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300">
                      Ukuran: {Math.round((imageUrl.length * 0.75) / 1024)} KB (terkompresi)
                    </p>
                  </div>
                </div>
              )}

              {!imageUrl && !isUploading && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                    Belum ada foto yang diupload
                  </p>
                  <p className="text-[10px] text-center text-slate-500 dark:text-slate-500 mt-1">
                    Maksimum 5MB (akan dikompresi otomatis)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Judul <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Promo Tahun Baru"
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan deskripsi untuk Flyer..."
              rows={3}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Kategori <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as "Training" | "Webinar" | "Promosi")}>
              <SelectTrigger disabled={isSaving} className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Promosi">Promosi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal Terbit & Tanggal Broadcast */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Terbit
              </Label>
              <Input
                type="date"
                value={tanggalTerbit}
                onChange={(e) => setTanggalTerbit(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Broadcast
              </Label>
              <Input
                type="date"
                value={tanggalBroadcast}
                onChange={(e) => setTanggalBroadcast(e.target.value)}
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
              disabled={isSaving || isUploading}
              className="cursor-pointer flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading || (!imageUrl && !flyer)}
              className="cursor-pointer flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="ml-2">Menyimpan...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="ml-2">Mengupload...</span>
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

FlyerDialog.displayName = 'FlyerDialog';
