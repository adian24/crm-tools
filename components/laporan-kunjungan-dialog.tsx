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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Save, X, Loader2, Image as ImageIcon, Upload, Calendar, MapPin, DollarSign } from 'lucide-react';
import masterAlasanData from '@/data/master-alasan.json';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';

const PRODUK_OPTIONS = ["ISO", "ISPO", "SMK3", "HACCP", "Halal", "ISO 14001", "OHSAS 18001", "ISO 22000", "ISO 27001", "Lainnya"];

const PROVINSI_OPTIONS = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi",
  "Sumatera Selatan", "Bangka Belitung", "Bengkulu", "Lampung", "Banten",
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat"
];

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  directOrAssociate?: string;
  grup?: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  kuadran?: string;
  luarKota?: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi?: string;
  catAkre?: string;
  eaCode?: string;
  std?: string;
  iaDate?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: number;
  bulanTtdNotif?: string;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  cashback?: number;
  terminPembayaran?: string;
  statusSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
  bulanAuditSebelumnyaSustain?: string;
  bulanAudit?: string;
  statusInvoice?: "Terbit" | "Belum Terbit";
  statusPembayaran?: "Lunas" | "Belum Lunas" | "Sudah DP";
  statusKomisi?: "Sudah Diajukan" | "Belum Diajukan" | "Tidak Ada";
  created_by?: Id<"users">;
  createdAt: number;
  updated_by?: Id<"users">;
  updatedAt: number;
}

interface LaporanKunjunganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: CrmTarget[] | null;
  onSuccess?: () => void;
}

export function LaporanKunjunganDialog({ open, onOpenChange, targets, onSuccess }: LaporanKunjunganDialogProps) {
  const { user } = useCurrentUser();

  // Mutations
  const updateCrmTarget = useMutation(api.crmTargets.updateCrmTarget);

  // Alasan options
  const alasanOptions = masterAlasanData.alasan.map(item => item.alasan);

  const [tanggalKunjungan, setTanggalKunjungan] = useState("");
  const [statusKunjungan, setStatusKunjungan] = useState("VISITED");
  const [catatanKunjungan, setCatatanKunjungan] = useState("");
  const [fotoBuktiKunjungan, setFotoBuktiKunjungan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // State for per-standard updates
  const [standardUpdates, setStandardUpdates] = useState<Record<Id<"crmTargets">, {
    status?: string;
    alasan?: string;
    bulanTtdNotif?: string;
    hargaTerupdate?: string;
    trimmingValue?: string;
    lossValue?: string;
  }>>({});

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageOpen(true);
  };

  // Format number to thousand separator
  const formatNumber = (value: string): string => {
    const cleaned = value.replace(/\./g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Clean formatted number back to plain number
  const cleanNumber = (value: string): string => {
    return value.replace(/\./g, '');
  };

  // Update standard field
  const updateStandardField = (targetId: Id<"crmTargets">, field: string, value: string) => {
    // Store the update value (including empty string)
    setStandardUpdates(prev => ({
      ...prev,
      [targetId]: {
        ...prev[targetId],
        [field]: value
      }
    }));

    // Auto-calculate trimming/loss when hargaTerupdate changes
    if (field === 'hargaTerupdate') {
      const target = targets?.find(t => t._id === targetId);
      if (target) {
        const hargaKontrakNum = target.hargaKontrak || 0;
        const hargaTerupdateNum = parseFloat(cleanNumber(value)) || 0;

        let newTrimming = "0";
        let newLoss = "0";

        // Only calculate if there's a value
        if (value && hargaTerupdateNum > 0) {
          if (hargaTerupdateNum > hargaKontrakNum) {
            const trimming = hargaTerupdateNum - hargaKontrakNum;
            newTrimming = trimming.toString();
            newLoss = "0";
          } else if (hargaTerupdateNum < hargaKontrakNum) {
            const loss = hargaKontrakNum - hargaTerupdateNum;
            newLoss = loss.toString();
            newTrimming = "0";
          }
        }

        // Update trimming and loss values
        setStandardUpdates(prev => ({
          ...prev,
          [targetId]: {
            ...prev[targetId],
            trimmingValue: newTrimming,
            lossValue: newLoss
          }
        }));
      }
    }
  };

  // Reset form when targets changes or dialog opens/closes
  React.useEffect(() => {
    if (targets && targets.length > 0) {
      const firstTarget = targets[0];
      setTanggalKunjungan(firstTarget.tanggalKunjungan || "");
      setStatusKunjungan(firstTarget.statusKunjungan || "VISITED");
      setCatatanKunjungan(firstTarget.catatanKunjungan || "");
      setFotoBuktiKunjungan(firstTarget.fotoBuktiKunjungan || "");
      setStandardUpdates({});
    } else {
      setTanggalKunjungan("");
      setStatusKunjungan("VISITED");
      setCatatanKunjungan("");
      setFotoBuktiKunjungan("");
      setStandardUpdates({});
    }
  }, [targets, open]);

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
      setFotoBuktiKunjungan(base64String);
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
    setFotoBuktiKunjungan("");
    toast.success('✅ Foto berhasil dihapus');
  };

  const handleSave = async () => {
    if (!targets || targets.length === 0) {
      toast.error('❌ Target tidak ditemukan!');
      return;
    }

    // Validation for each standard
    for (const target of targets) {
      const updates = standardUpdates[target._id] || {};
      const currentStatus = updates.status || target.status;

      // Check if bulanTtdNotif is required when status is DONE
      if (currentStatus === 'DONE') {
        const bulanTtdNotif = updates.bulanTtdNotif || target.bulanTtdNotif;
        const hargaTerupdate = updates.hargaTerupdate ? parseFloat(cleanNumber(updates.hargaTerupdate)) : target.hargaTerupdate;

        if (!bulanTtdNotif) {
          toast.error(`❌ Bulan TTD Notif wajib diisi untuk status DONE!`, {
            description: `Standar: ${target.produk} - ${target.namaPerusahaan}`,
            duration: 4000,
          });
          return;
        }

        if (!hargaTerupdate) {
          toast.error(`❌ Harga Terupdate wajib diisi untuk status DONE!`, {
            description: `Standar: ${target.produk} - ${target.namaPerusahaan}`,
            duration: 4000,
          });
          return;
        }
      }

      // Check if alasan is required when status is SUSPEND or LOSS
      if (currentStatus === 'SUSPEND' || currentStatus === 'LOSS') {
        const alasan = updates.alasan || target.alasan;

        if (!alasan) {
          toast.error(`❌ Alasan wajib diisi untuk status ${currentStatus}!`, {
            description: `Standar: ${target.produk} - ${target.namaPerusahaan}`,
            duration: 4000,
          });
          return;
        }
      }
    }

    // Validation
    if (!tanggalKunjungan) {
      toast.error('❌ Tanggal Kunjungan wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      // Update all targets with new data
      for (const target of targets) {
        const updates = standardUpdates[target._id];

        // Update each standard with Status & Keuangan data, plus Kunjungan data
        await updateCrmTarget({
          id: target._id,
          status: updates?.status || undefined,
          alasan: updates?.alasan || undefined,
          bulanTtdNotif: updates?.bulanTtdNotif !== undefined ? updates.bulanTtdNotif : undefined,
          hargaTerupdate: updates?.hargaTerupdate ? parseFloat(cleanNumber(updates.hargaTerupdate)) : undefined,
          trimmingValue: updates?.trimmingValue ? parseFloat(updates.trimmingValue) : undefined,
          lossValue: updates?.lossValue ? parseFloat(updates.lossValue) : undefined,
          tanggalKunjungan,
          statusKunjungan,
          catatanKunjungan: catatanKunjungan.trim() || undefined,
          fotoBuktiKunjungan: fotoBuktiKunjungan || undefined,
          updated_by: user?._id,
        });
      }

      toast.success(`✅ ${targets.length} standar berhasil diupdate untuk ${targets[0].namaPerusahaan}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving laporan kunjungan:', error);
      toast.error('❌ Gagal menyimpan Laporan Kunjungan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[60vw] xl:max-w-[60vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Edit Laporan Kunjungan
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Update informasi kunjungan untuk {targets && targets.length > 0 ? targets[0].namaPerusahaan : ''} ({targets?.length || 0} Standar)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* All Standards List with Edit Forms */}
          {targets && targets.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-b-2 border-slate-300 dark:border-slate-600">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Update Status & Keuangan per Standar ({targets.length} Standar)
                </p>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                {targets.map((target, index) => {
                  const updates = standardUpdates[target._id] || {};
                  return (
                    <div key={target._id} className="p-3 space-y-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                      {/* Standard Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                              #{index + 1}
                            </Badge>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {target.produk}
                            </span>
                            {target.std && (
                              <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold shadow-sm">
                                {target.std}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Harga Kontrak</p>
                          {target.hargaKontrak ? (
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {target.hargaKontrak.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              })}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-600">-</p>
                          )}
                        </div>
                      </div>

                      {/* Status & Keuangan Form */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
                        {/* Status CRM */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">
                            Status
                          </Label>
                          <Select
                            value={updates.status || target.status || ""}
                            onValueChange={(value) => updateStandardField(target._id, 'status', value)}
                          >
                            <SelectTrigger className="h-9 text-sm border-slate-200 dark:border-slate-700 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WAITING">WAITING</SelectItem>
                              <SelectItem value="PROSES">PROSES</SelectItem>
                              <SelectItem value="DONE">DONE</SelectItem>
                              <SelectItem value="SUSPEND">SUSPEND</SelectItem>
                              <SelectItem value="LOSS">LOSS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Alasan */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">
                            Alasan {(updates.status === 'SUSPEND' || updates.status === 'LOSS' || target.status === 'SUSPEND' || target.status === 'LOSS') && <span className="text-red-500">*</span>}
                          </Label>
                          <SearchableSelect
                            options={[{ value: '', label: 'Kosong' }, ...alasanOptions.map(a => ({ value: a, label: a }))]}
                            value={updates.alasan || target.alasan || ""}
                            onChange={(value) => updateStandardField(target._id, 'alasan', value)}
                            placeholder="Pilih..."
                            className={`h-9 text-sm border-slate-200 dark:border-slate-700 ${(updates.status === 'SUSPEND' || updates.status === 'LOSS' || target.status === 'SUSPEND' || target.status === 'LOSS') && !updates.alasan && !target.alasan ? 'border-red-500' : ''}`}
                          />
                        </div>

                        {/* Bulan TTD Notif */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">
                            TTD Notif {(updates.status === 'DONE' || target.status === 'DONE') && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            type="date"
                            value={updates.bulanTtdNotif || target.bulanTtdNotif || ""}
                            onChange={(e) => updateStandardField(target._id, 'bulanTtdNotif', e.target.value)}
                            className={`h-9 text-sm border-slate-200 dark:border-slate-700 ${(updates.status === 'DONE' || target.status === 'DONE') && !updates.bulanTtdNotif && !target.bulanTtdNotif ? 'border-red-500' : ''}`}
                          />
                        </div>

                        {/* Harga Terupdate */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">
                            Harga Update {(updates.status === 'DONE' || target.status === 'DONE') && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            type="text"
                            value={
                              // Check if user has made an update (key exists in standardUpdates)
                              standardUpdates[target._id]?.hargaTerupdate !== undefined
                                ? standardUpdates[target._id].hargaTerupdate
                                : (target.hargaTerupdate ? target.hargaTerupdate.toLocaleString('id-ID') : "")
                            }
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\./g, '');
                              updateStandardField(target._id, 'hargaTerupdate', formatNumber(rawValue));
                            }}
                            placeholder="0"
                            className={`h-9 text-sm font-semibold border-slate-200 dark:border-slate-700 ${(updates.status === 'DONE' || target.status === 'DONE') && !updates.hargaTerupdate && !target.hargaTerupdate ? 'border-red-500' : ''}`}
                          />
                        </div>

                        {/* Trimming Value */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                            Trimming
                          </Label>
                          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-1 h-9 flex items-center justify-center">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {parseFloat(updates.trimmingValue || "0").toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        {/* Loss Value */}
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-red-700 dark:text-red-300">
                            Loss
                          </Label>
                          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded px-2 py-1 h-9 flex items-center justify-center">
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                              {parseFloat(updates.lossValue || "0").toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total Harga Summary */}
              <div className="bg-emerald-50 dark:bg-emerald-950 px-3 py-2 border-t-2 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Total Harga Semua Standar:
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {targets.reduce((sum, t) => {
                      const update = standardUpdates[t._id];
                      const harga = update?.hargaTerupdate
                        ? parseFloat(cleanNumber(update.hargaTerupdate))
                        : (t.hargaTerupdate || t.hargaKontrak || 0);
                      return sum + (isNaN(harga) ? 0 : harga);
                    }, 0).toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tanggal Kunjungan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={tanggalKunjungan}
                onChange={(e) => setTanggalKunjungan(e.target.value)}
                disabled={isSaving}
                className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm pl-10"
              />
            </div>
          </div>

          {/* Status Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status Kunjungan <span className="text-red-500">*</span>
            </Label>
            <Select value={statusKunjungan} onValueChange={setStatusKunjungan} disabled={isSaving}>
              <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-9 text-sm">
                <SelectValue placeholder="Pilih Status Kunjungan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISITED">✅ VISITED (Sudah Dikunjungi)</SelectItem>
                <SelectItem value="NOT YET">❌ NOT YET (Belum Dikunjungi)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {statusKunjungan === "VISITED"
                ? "Kunjungan sudah dilakukan"
                : "Kunjungan dibatalkan atau belum dilakukan. Data tidak akan muncul di laporan."
              }
            </p>
          </div>

          {/* Catatan Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Catatan Kunjungan
            </Label>
            <Textarea
              value={catatanKunjungan}
              onChange={(e) => setCatatanKunjungan(e.target.value)}
              placeholder="Catatan mengenai kunjungan..."
              disabled={isSaving}
              className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm resize-y"
            />
          </div>

          {/* Foto Bukti Kunjungan */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Foto Bukti Kunjungan
            </Label>
            {fotoBuktiKunjungan ? (
              <div className="space-y-3">
                <div className="relative group">
                  <img
                    src={fotoBuktiKunjungan}
                    alt="Foto Bukti Kunjungan"
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageClick(fotoBuktiKunjungan)}
                    className="cursor-pointer px-3 py-2 bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Lihat Gambar
                  </Button>
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

    {/* Image Preview Dialog */}
    <ImagePreviewDialog
      open={previewImageOpen}
      onOpenChange={setPreviewImageOpen}
      images={previewImageUrl ? [{ url: previewImageUrl }] : []}
    />
  </>
  );
}

LaporanKunjunganDialog.displayName = 'LaporanKunjunganDialog';
