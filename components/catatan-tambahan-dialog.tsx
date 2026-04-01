"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface CatatanTambahan {
  _id: Id<"catatanTambahan">;
  judul: string;
  isiCatatan: string;
  gambarBase64: string;
  bulan: number;
  tahun: number;
  status: "active" | "inactive";
  created_by?: Id<"users">;
  createdByName: string;
  updated_by?: Id<"users">;
  updatedByName?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
}

interface CatatanTambahanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCatatan: CatatanTambahan | null;
  onSuccess: () => void;
}

export function CatatanTambahanDialog({
  open,
  onOpenChange,
  editingCatatan,
  onSuccess,
}: CatatanTambahanDialogProps) {
  const createCatatanMutation = useMutation(api.catatanTambahan.createCatatanTambahan);
  const updateCatatanMutation = useMutation(api.catatanTambahan.updateCatatanTambahan);

  const [judul, setJudul] = React.useState("");
  const [deskripsi, setDeskripsi] = React.useState("");
  const [bulan, setBulan] = React.useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = React.useState<number>(new Date().getFullYear());
  const [gambarBase64, setGambarBase64] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (editingCatatan) {
        setJudul(editingCatatan.judul);
        setDeskripsi(editingCatatan.isiCatatan);
        setBulan(editingCatatan.bulan);
        setTahun(editingCatatan.tahun);
        setGambarBase64(editingCatatan.gambarBase64 || "");
      } else {
        setJudul("");
        setDeskripsi("");
        setBulan(new Date().getMonth() + 1);
        setTahun(new Date().getFullYear());
        setGambarBase64("");
      }
    }
  }, [open, editingCatatan]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setGambarBase64(base64String);
        toast.success('Gambar berhasil diupload');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file gambar');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengupload gambar');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      toast.error("Judul harus diisi");
      return;
    }

    if (!deskripsi.trim()) {
      toast.error("Deskripsi harus diisi");
      return;
    }

    if (!gambarBase64) {
      toast.error("Gambar harus diupload");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCatatan) {
        await updateCatatanMutation({
          id: editingCatatan._id,
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          gambarBase64,
          bulan,
          tahun,
        });
        toast.success("Catatan berhasil diperbarui");
      } else {
        await createCatatanMutation({
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          gambarBase64,
          bulan,
          tahun,
        });
        toast.success("Catatan berhasil ditambahkan");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving catatan:", error);
      toast.error(editingCatatan ? "Gagal memperbarui catatan" : "Gagal menambahkan catatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCatatan ? "Edit Catatan Tambahan" : "Tambah Catatan Tambahan"}
          </DialogTitle>
          <DialogDescription>
            {editingCatatan
              ? "Perbarui informasi catatan tambahan"
              : "Isi formulir untuk menambahkan catatan tambahan baru"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gambar">Upload Gambar *</Label>
            <div className="space-y-2">
              {gambarBase64 ? (
                <div className="relative">
                  <img
                    src={gambarBase64}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setGambarBase64("")}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                    <div className="text-sm text-gray-600 text-center">
                      <p className="font-medium">Upload gambar</p>
                      <p className="text-xs">PNG, JPG hingga 5MB</p>
                    </div>
                    <Input
                      id="gambar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading || isSubmitting}
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengupload...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judul">Judul *</Label>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Masukkan judul catatan"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi *</Label>
            <Textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Masukkan deskripsi catatan"
              rows={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulan">Bulan *</Label>
              <Select
                value={bulan.toString()}
                onValueChange={(value) => setBulan(parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="bulan">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun *</Label>
              <Select
                value={tahun.toString()}
                onValueChange={(value) => setTahun(parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="tahun">
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingCatatan ? "Menyimpan..." : "Menambahkan..."}
                </>
              ) : (
                editingCatatan ? "Simpan Perubahan" : "Tambah Catatan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
