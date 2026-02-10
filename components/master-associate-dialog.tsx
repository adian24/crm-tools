"use client";

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';
import { addAssociate, updateAssociate } from '@/lib/actions/master-associate-actions';

export interface Associate {
  kode: string;
  nama: string;
  kategori: 'Direct' | 'Associate';
  status: 'Aktif' | 'Non-Aktif';
}

interface AssociateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associate: Associate | null;
  onSuccess?: () => void;
}

const AssociateDialog = ({ open, onOpenChange, associate, onSuccess }: AssociateDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'Direct' as 'Direct' | 'Associate' ,
    status: 'Aktif' as 'Aktif' | 'Non-Aktif',
  });

  // Reset form when associate changes
  useEffect(() => {
    if (associate) {
      setFormData({
        nama: associate.nama,
        kategori: associate.kategori,
        status: associate.status,
      });
    } else {
      setFormData({
        nama: '',
        kategori: 'Direct',
        status: 'Aktif',
      });
    }
  }, [associate, open]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.nama.trim()) {
      toast.error('❌ Nama wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (associate) {
        // Update existing associate
        result = await updateAssociate(associate.kode, formData);
      } else {
        // Add new associate
        result = await addAssociate(formData);
      }

      if (result.success) {
        toast.success(`✅ ${result.message}`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error) {
      toast.error('❌ Terjadi kesalahan saat menyimpan data');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {associate ? 'Edit Associate' : 'Tambah Associate Baru'}
          </DialogTitle>
          <DialogDescription>
            {associate ? 'Update data associate yang sudah ada' : 'Tambahkan associate baru ke master data'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {associate && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Kode</Label>
              <Input
                value={associate.kode}
                disabled
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Kode associate tidak dapat diubah</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Nama Associate <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Masukkan nama associate..."
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Kategori</Label>
            <Select
              value={formData.kategori}
              onValueChange={(value: any) => setFormData({ ...formData, kategori: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct">Direct</SelectItem>
                <SelectItem value="Associate">Associate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Non-Aktif">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {isSubmitting ? (
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

export default AssociateDialog;
