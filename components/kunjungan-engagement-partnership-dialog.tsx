"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
import { Save, X, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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

interface KunjunganEngagementPartnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kunjungan: KunjunganEngagementPartnership | null;
  onSuccess?: () => void;
}

export function KunjunganEngagementPartnershipDialog({ open, onOpenChange, kunjungan, onSuccess }: KunjunganEngagementPartnershipDialogProps) {
  // Get current user from localStorage or session
  const currentUser = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('crm_user') || '{}' : '{}');

  // Mutations
  const addKunjungan = useMutation(api.kunjunganEngagementPartnership.createKunjunganEngagementPartnership);
  const updateKunjungan = useMutation(api.kunjunganEngagementPartnership.updateKunjunganEngagementPartnership);

  const [namaClient, setNamaClient] = useState("");
  const [namaPicClient, setNamaPicClient] = useState("");
  const [noHp, setNoHp] = useState("");
  const [picTsi, setPicTsi] = useState("");
  const [tglKunjungan, setTglKunjungan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [fotoBukti, setFotoBukti] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when kunjungan changes or dialog opens/closes
  React.useEffect(() => {
    if (kunjungan) {
      setNamaClient(kunjungan.namaClient);
      setNamaPicClient(kunjungan.namaPicClient);
      setNoHp(kunjungan.noHp);
      setPicTsi(kunjungan.picTsi);
      setTglKunjungan(kunjungan.tglKunjungan);
      setCatatan(kunjungan.catatan || "");
      setTindakLanjut(kunjungan.tindakLanjut || "");
      setFotoBukti(kunjungan.fotoBukti || "");
    } else {
      setNamaClient("");
      setNamaPicClient("");
      setNoHp("");
      setPicTsi("");
      setTglKunjungan("");
      setCatatan("");
      setTindakLanjut("");
      setFotoBukti("");
    }
  }, [kunjungan, open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ Ukuran foto maksimal 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ File harus berupa gambar');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFotoBukti(base64String);
      setIsUploading(false);
      toast.success('✅ Foto berhasil diupload');
    };

    reader.onerror = () => {
      toast.error('❌ Gagal mengupload foto');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = () => {
    setFotoBukti("");
    toast.success('✅ Foto berhasil dihapus');
  };

  const handleSave = async () => {
    // Validation
    if (!namaClient.trim()) {
      toast.error('❌ Nama Client wajib diisi!');
      return;
    }

    if (!namaPicClient.trim()) {
      toast.error('❌ Nama PIC Client wajib diisi!');
      return;
    }

    if (!noHp.trim()) {
      toast.error('❌ No HP wajib diisi!');
      return;
    }

    if (!picTsi.trim()) {
      toast.error('❌ PIC TSI wajib diisi!');
      return;
    }

    if (!tglKunjungan) {
      toast.error('❌ Tanggal Kunjungan wajib diisi!');
      return;
    }

    // Extract month and year from tglKunjungan
    const dateObj = new Date(tglKunjungan);
    const month = dateObj.getMonth() + 1; // 1-12
    const year = dateObj.getFullYear();

    setIsSaving(true);
    try {
      let result;

      // Get current user name
      const currentUserName = currentUser?.name || currentUser?.email || currentUser?.staffId || 'Unknown';

      // Check if creating new or updating existing
      if (kunjungan) {
        console.log('Editing existing kunjungan:', kunjungan._id);
        // Update existing kunjungan
        result = await updateKunjungan({
          id: kunjungan._id,
          namaClient: namaClient.trim(),
          namaPicClient: namaPicClient.trim(),
          noHp: noHp.trim(),
          picTsi: picTsi.trim(),
          tglKunjungan,
          month,
          year,
          catatan: catatan.trim() || undefined,
          tindakLanjut: tindakLanjut.trim() || undefined,
          fotoBukti: fotoBukti || undefined,
          updatedByName: currentUserName,
        });
      } else {
        console.log('Creating new kunjungan');
        // Create new kunjungan
        result = await addKunjungan({
          namaClient: namaClient.trim(),
          namaPicClient: namaPicClient.trim(),
          noHp: noHp.trim(),
          picTsi: picTsi.trim(),
          tglKunjungan,
          month,
          year,
          catatan: catatan.trim() || undefined,
          tindakLanjut: tindakLanjut.trim() || undefined,
          fotoBukti: fotoBukti || undefined,
          createdByName: currentUserName,
        });
      }

      if (result.success) {
        toast.success(kunjungan ? '✅ Kunjungan berhasil diupdate' : '✅ Kunjungan berhasil dibuat');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || '❌ Gagal menyimpan Kunjungan');
      }
    } catch (error) {
      console.error('Error saving kunjungan:', error);
      toast.error('❌ Gagal menyimpan Kunjungan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {kunjungan ? 'Edit Kunjungan Engagement Partnership' : 'Tambah Kunjungan Engagement Partnership Baru'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {kunjungan ? 'Edit informasi Kunjungan yang sudah ada' : 'Catat kunjungan engagement partnership baru'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nama Client & Nama PIC Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nama Client <span className="text-red-500">*</span>
              </Label>
              <Input
                value={namaClient}
                onChange={(e) => setNamaClient(e.target.value)}
                placeholder="Contoh: PT. Maju Jaya"
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nama PIC Client <span className="text-red-500">*</span>
              </Label>
              <Input
                value={namaPicClient}
                onChange={(e) => setNamaPicClient(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* No HP & PIC TSI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No HP <span className="text-red-500">*</span>
              </Label>
              <Input
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 08123456789"
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                PIC TSI <span className="text-red-500">*</span>
              </Label>
              <Input
                value={picTsi}
                onChange={(e) => setPicTsi(e.target.value)}
                placeholder="Contoh: Ahmad"
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* Tanggal Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tanggal Kunjungan <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={tglKunjungan}
              onChange={(e) => setTglKunjungan(e.target.value)}
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm"
            />
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Catatan
            </Label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan mengenai kunjungan..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm resize-y"
            />
          </div>

          {/* Tindak Lanjut */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tindak Lanjut
            </Label>
            <Textarea
              value={tindakLanjut}
              onChange={(e) => setTindakLanjut(e.target.value)}
              placeholder="Tindak lanjut yang perlu dilakukan..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm resize-y"
            />
          </div>

          {/* Foto Bukti */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Foto Bukti Kunjungan
            </Label>
            {fotoBukti ? (
              <div className="space-y-3">
                <div className="relative group">
                  <img
                    src={fotoBukti}
                    alt="Foto Bukti"
                    className="w-full max-w-md h-64 object-contain rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveFoto}
                    disabled={isSaving}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Label
                    htmlFor="replace-foto"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Ganti Foto</span>
                  </Label>
                  <Input
                    id="replace-foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading || isSaving}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSaving}
                  className="hidden"
                  id="foto-bukti-upload"
                />
                <Label
                  htmlFor="foto-bukti-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {isUploading ? 'Mengupload...' : 'Klik untuk upload foto bukti'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      PNG, JPG, JPEG hingga 5MB
                    </p>
                  </div>
                </Label>
              </div>
            )}
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

KunjunganEngagementPartnershipDialog.displayName = 'KunjunganEngagementPartnershipDialog';
