"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Image as PhotoIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Upload,
  X,
} from "lucide-react";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";

interface StrukturDivisi {
  _id: Id<"strukturDivisi">;
  title: string;
  description?: string;
  year: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function StrukturDivisiPage() {
  const strukturDivisi = useQuery(api.strukturDivisi.getStrukturDivisi);
  const addMutation = useMutation(api.strukturDivisi.addStrukturDivisi);
  const updateMutation = useMutation(api.strukturDivisi.updateStrukturDivisi);
  const deleteMutation = useMutation(api.strukturDivisi.deleteStrukturDivisi);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StrukturDivisi | null>(null);
  const [deletingItem, setDeletingItem] = useState<StrukturDivisi | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    imageFile: null as File | null,
    imagePreview: "",
  });

  // Form state for edit
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    imageFile: null as File | null,
    imagePreview: "",
  });

  // Generate year options (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Filter items
  const filteredItems = strukturDivisi?.filter((item) => {
    const matchesYear = item.year === selectedYear;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  }) || [];

  // Sort by year desc, then updated date desc
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.updatedAt - a.updatedAt;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    setUploadForm({
      title: "",
      description: "",
      year: selectedYear,
      imageFile: null,
      imagePreview: "",
    });
    setUploadDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("❌ Harap pilih file gambar");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);

    // Compress image and convert to base64 (like Flyer)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
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

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.error("❌ Gagal memproses gambar");
          setIsUploading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Reduce quality until size is under limit (500KB)
        while (
          compressedDataUrl.length > 500 * 1024 * 1.37 &&
          quality > 0.1
        ) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        setUploadForm((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: compressedDataUrl,
        }));
        setIsUploading(false);
        toast.success("✅ Foto berhasil diupload");
      };
      img.onerror = () => {
        toast.error("❌ Gagal memuat gambar");
        setIsUploading(false);
      };
    };
    reader.onerror = () => {
      toast.error("❌ Gagal membaca file");
      setIsUploading(false);
    };
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("❌ Harap pilih file gambar");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);

    // Compress image and convert to base64 (like Flyer)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
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

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.error("❌ Gagal memproses gambar");
          setIsUploading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Reduce quality until size is under limit (500KB)
        while (
          compressedDataUrl.length > 500 * 1024 * 1.37 &&
          quality > 0.1
        ) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        setEditForm((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: compressedDataUrl,
        }));
        setIsUploading(false);
        toast.success("✅ Foto berhasil diupload");
      };
      img.onerror = () => {
        toast.error("❌ Gagal memuat gambar");
        setIsUploading(false);
      };
    };
    reader.onerror = () => {
      toast.error("❌ Gagal membaca file");
      setIsUploading(false);
    };
  };

  const handleRemoveImage = () => {
    setUploadForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditRemoveImage = () => {
    setEditForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: "",
    }));
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleUploadSubmit = async () => {
    // Validation
    if (!uploadForm.title.trim()) {
      toast.error("❌ Judul harus diisi");
      return;
    }
    if (!uploadForm.imagePreview) {
      toast.error("❌ Harap upload gambar struktur organisasi");
      return;
    }

    setIsUploading(true);

    try {
      // Add to database with base64 image
      const result = await addMutation({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
        year: uploadForm.year,
        imageUrl: uploadForm.imagePreview,
      });

      if (result.success) {
        toast.success("✅ " + result.message);
        setUploadDialogOpen(false);
      } else {
        toast.error("❌ " + result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal mengupload struktur organisasi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (item: StrukturDivisi) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || "",
      year: item.year,
      imageFile: null,
      imagePreview: item.imageUrl,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    if (!editForm.title.trim()) {
      toast.error("❌ Judul harus diisi");
      return;
    }
    if (!editForm.imagePreview) {
      toast.error("❌ Harap upload gambar struktur organisasi");
      return;
    }

    setIsUploading(true);

    try {
      // Update with base64 image
      const result = await updateMutation({
        id: editingItem._id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        year: editForm.year,
        imageUrl: editForm.imagePreview,
      });

      if (result.success) {
        toast.success("✅ " + result.message);
        setEditDialogOpen(false);
        setEditingItem(null);
      } else {
        toast.error("❌ " + result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal mengupdate struktur organisasi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (item: StrukturDivisi) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);

    try {
      const result = await deleteMutation({ id: deletingItem._id });

      if (result.success) {
        toast.success("✅ " + result.message);
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      } else {
        toast.error("❌ " + result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus struktur organisasi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageOpen(true);
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Struktur Divisi CRP</h2>
            <p className="text-muted-foreground">
              Upload dan kelola struktur organisasi CRP per tahun
            </p>
          </div>
          <Button
            onClick={handleUploadClick}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Struktur
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun
              </Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
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
                placeholder="Cari struktur organisasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Items Grid */}
        {strukturDivisi === undefined ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedItems.length === 0 ? (
          <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <PhotoIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Belum Ada Struktur Organisasi
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery
                  ? "Tidak ditemukan struktur organisasi yang sesuai dengan pencarian"
                  : `Belum ada struktur organisasi untuk tahun ${selectedYear}`}
              </p>
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Struktur Pertama
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
            {sortedItems.map((item) => (
              <Card
                key={item._id}
                className="overflow-hidden bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity p-4"
                    onClick={() => handleImageClick(item.imageUrl)}
                  />

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 flex-1">
                        {item.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold shrink-0 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                      >
                        <Calendar className="h-3 w-3 mr-1 inline" />
                        {item.year}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 px-4 pb-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleImageClick(item.imageUrl)}
                    className="cursor-pointer flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Lihat
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    className="cursor-pointer flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    disabled={isUploading}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item)}
                    className="cursor-pointer flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Hapus
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Struktur Organisasi</DialogTitle>
            <DialogDescription>
              Upload gambar struktur organisasi CRP untuk tahun tertentu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="upload-title">
                Judul <span className="text-red-500">*</span>
              </Label>
              <Input
                id="upload-title"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Contoh: Struktur Organisasi CRP 2025"
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="upload-year">
                Tahun <span className="text-red-500">*</span>
              </Label>
              <Select
                value={uploadForm.year.toString()}
                onValueChange={(v) =>
                  setUploadForm((prev) => ({ ...prev, year: parseInt(v) }))
                }
              >
                <SelectTrigger id="upload-year">
                  <SelectValue />
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="upload-description">Deskripsi</Label>
              <Textarea
                id="upload-description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Deskripsi singkat tentang struktur organisasi..."
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>
                Gambar Struktur Organisasi <span className="text-red-500">*</span>
              </Label>
              {uploadForm.imagePreview ? (
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4">
                  <div className="relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={uploadForm.imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {uploadForm.imageFile?.name || "Current image"}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag & drop gambar atau klik untuk browse
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    PNG, JPG, JPEG hingga 10MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Pilih File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengupload...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Struktur Organisasi</DialogTitle>
            <DialogDescription>
              Update informasi dan gambar struktur organisasi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Judul <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Contoh: Struktur Organisasi CRP 2025"
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="edit-year">
                Tahun <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editForm.year.toString()}
                onValueChange={(v) =>
                  setEditForm((prev) => ({ ...prev, year: parseInt(v) }))
                }
              >
                <SelectTrigger id="edit-year">
                  <SelectValue />
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Deskripsi singkat tentang struktur organisasi..."
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>
                Gambar Struktur Organisasi <span className="text-red-500">*</span>
              </Label>
              {editForm.imagePreview ? (
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4">
                  <div className="relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={editForm.imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleEditRemoveImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {editForm.imageFile?.name || "Current image"}
                  </p>
                  {!editForm.imageFile && (
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />
                  )}
                  {!editForm.imageFile && (
                    <div className="text-center mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Ganti Gambar
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag & drop gambar atau klik untuk browse
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    PNG, JPG, JPEG hingga 10MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    Pilih File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingItem(null);
              }}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Struktur Organisasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus struktur organisasi &quot;
              {deletingItem?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
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

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={previewImageOpen}
        onOpenChange={setPreviewImageOpen}
        imageUrl={previewImageUrl}
        alt="Struktur Organisasi"
      />
    </>
  );
}
