"use client";

import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Save, X, Loader2, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

interface Staff {
  _id: Id<"kolaborasiCrm">;
  nama: string;
  fotoUrl?: string;
  jabatan: string;
  jobDesk: string[];
  positionX: number;
  positionY: number;
  keterangan?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface KolaborasiCrmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  mode: 'add' | 'edit';
  onSuccess?: () => void;
}

const KolaborasiCrmDialog = ({ open, onOpenChange, staff, mode, onSuccess }: KolaborasiCrmDialogProps) => {
  const createMutation = useMutation(api.kolaborasiCrm.createStaff);
  const updateMutation = useMutation(api.kolaborasiCrm.updateStaff);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    fotoUrl: '',
    jabatan: '',
    jobDesk: [''],
    keterangan: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or staff changes
  useEffect(() => {
    if (open && staff && mode === 'edit') {
      setFormData({
        nama: staff.nama,
        fotoUrl: staff.fotoUrl || '',
        jabatan: staff.jabatan,
        jobDesk: staff.jobDesk.length > 0 ? staff.jobDesk : [''],
        keterangan: staff.keterangan || '',
      });
    } else if (open && mode === 'add') {
      setFormData({
        nama: '',
        fotoUrl: '',
        jabatan: '',
        jobDesk: [''],
        keterangan: '',
      });
    }
  }, [open, staff, mode]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('❌ File harus berupa gambar!');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('❌ Ukuran file maksimal 2MB!');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, fotoUrl: base64 }));
      toast.success('✅ Foto berhasil diupload!');
    } catch (error) {
      toast.error('❌ Gagal mengupload foto!');
      console.error(error);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle input file change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, fotoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.nama.trim()) {
      toast.error('❌ Nama wajib diisi!');
      return;
    }
    if (!formData.jabatan.trim()) {
      toast.error('❌ Jabatan wajib diisi!');
      return;
    }

    // Filter empty job desks
    const validJobDesk = formData.jobDesk.filter(jd => jd.trim() !== '');
    if (validJobDesk.length === 0) {
      toast.error('❌ Minimal 1 job desk harus diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'add') {
        // Calculate random position for new card
        const randomX = Math.floor(Math.random() * 500);
        const randomY = Math.floor(Math.random() * 400);

        await createMutation({
          nama: formData.nama.trim(),
          fotoUrl: formData.fotoUrl.trim() || undefined,
          jabatan: formData.jabatan.trim(),
          jobDesk: validJobDesk,
          positionX: randomX,
          positionY: randomY,
          keterangan: formData.keterangan.trim() || undefined,
        });

        toast.success('✅ Staff berhasil ditambahkan!');
      } else {
        await updateMutation({
          id: staff!._id,
          nama: formData.nama.trim(),
          fotoUrl: formData.fotoUrl.trim() || undefined,
          jabatan: formData.jabatan.trim(),
          jobDesk: validJobDesk,
          keterangan: formData.keterangan.trim() || undefined,
        });

        toast.success('✅ Data staff berhasil diupdate!');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('❌ Gagal menyimpan data!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addJobDesk = () => {
    setFormData(prev => ({
      ...prev,
      jobDesk: [...prev.jobDesk, '']
    }));
  };

  const removeJobDesk = (index: number) => {
    if (formData.jobDesk.length > 1) {
      setFormData(prev => ({
        ...prev,
        jobDesk: prev.jobDesk.filter((_, i) => i !== index)
      }));
    } else {
      toast.error('❌ Minimal 1 job desk harus ada!');
    }
  };

  const updateJobDesk = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      jobDesk: prev.jobDesk.map((jd, i) => i === index ? value : jd)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === 'add' ? '➕ Tambah Staff Baru' : '✏️ Edit Data Staff'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Tambahkan staff baru ke kolaborasi CRM' : 'Edit data staff kolaborasi CRM'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Nama */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              className="text-sm"
            />
          </div>

          {/* Jabatan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Jabatan <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.jabatan}
              onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
              placeholder="Contoh: Manager CRM, Staff CRM, Supervisor"
              className="text-sm"
            />
          </div>

          {/* Upload Foto */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Foto Profil</Label>
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
                ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                id="foto-upload"
              />

              {formData.fotoUrl ? (
                <div className="space-y-3">
                  <img
                    src={formData.fotoUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700 mx-auto"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('foto-upload')?.click()}
                      className="text-xs cursor-pointer"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Ganti
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="foto-upload"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      Klik untuk upload
                    </p>
                    <p>atau drag & drop gambar</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Maksimal 2MB (JPG, PNG, GIF)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Job Desk */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Job Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addJobDesk}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Tambah
              </Button>
            </div>
            <div className="space-y-2">
              {formData.jobDesk.map((jd, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={jd}
                    onChange={(e) => updateJobDesk(index, e.target.value)}
                    placeholder={`Job desk ${index + 1}`}
                    className="text-sm flex-1"
                  />
                  {formData.jobDesk.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJobDesk(index)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Keterangan</Label>
            <Textarea
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Keterangan tambahan..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="cursor-pointer"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { KolaborasiCrmDialog };
