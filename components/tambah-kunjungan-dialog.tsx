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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Building2, Loader2, Save, X, Plus, CheckCircle2, DollarSign } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import masterAlasanData from '@/data/master-alasan.json';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';

interface CrmTarget {
  _id: Id<"crmTargets">;
  namaPerusahaan: string;
  picCrm: string;
  sales: string;
  kota: string;
  provinsi: string;
  status?: string;
  alasan?: string;
  hargaKontrak?: number;
  produk: string;
  [key: string]: any;
}

interface TambahKunjunganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TambahKunjunganDialog = ({ open, onOpenChange, onSuccess }: TambahKunjunganDialogProps) => {
  const { user } = useCurrentUser();
  const updateMutation = useMutation(api.crmTargets.updateCrmTarget);

  // Fetch all CRM targets for company selection
  const allTargets = useQuery(api.crmTargets.getCrmTargets);

  // Group targets by company
  const groupedCompanies = React.useMemo(() => {
    if (!allTargets) return {};

    return allTargets.reduce((acc, target) => {
      const companyName = target.namaPerusahaan;
      if (!acc[companyName]) {
        acc[companyName] = [];
      }
      acc[companyName].push(target);
      return acc;
    }, {} as Record<string, CrmTarget[]>);
  }, [allTargets]);

  // Company options for select
  const companyOptions = React.useMemo(() => {
    const companies = Object.keys(groupedCompanies).sort();
    return companies.map(name => ({
      value: name,
      label: name,
      targetCount: groupedCompanies[name].length
    }));
  }, [groupedCompanies]);

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedTargetId, setSelectedTargetId] = useState<Id<"crmTargets"> | null>(null);
  const [tanggalKunjungan, setTanggalKunjungan] = useState<string>("");
  const [statusKunjungan, setStatusKunjungan] = useState<string>("VISITED");
  const [catatanKunjungan, setCatatanKunjungan] = useState<string>("");
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Alasan options
  const alasanOptions = masterAlasanData.alasan.map(item => item.alasan);

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
      const target = selectedTarget?.find(t => t._id === targetId);
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

  // Compress image before upload
  const compressImage = (file: File, maxSizeKB: number = 500): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressedDataUrl);
        }
        img.onerror = (error) => reject(error);
      }
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File terlalu besar! Maksimum 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const compressedImage = await compressImage(file, 500);
      setFotoBukti(compressedImage);
      setIsUploading(false);
      toast.success('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengupload foto. Silakan coba lagi.');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany || !selectedTarget || selectedTarget.length === 0) {
      toast.error('❌ Perusahaan wajib dipilih!');
      return;
    }

    if (!tanggalKunjungan) {
      toast.error('❌ Tanggal Kunjungan wajib diisi!');
      return;
    }

    if (!statusKunjungan) {
      toast.error('❌ Status Kunjungan wajib dipilih!');
      return;
    }

    // Validation for each standard
    for (const target of selectedTarget) {
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

    setIsSaving(true);
    try {
      // Update all existing standards with new data
      for (const target of selectedTarget) {
        const updates = standardUpdates[target._id];

        // Update each standard with Status & Keuangan data, plus Kunjungan data
        await updateMutation({
          id: target._id,
          status: updates?.status || undefined,
          alasan: updates?.alasan || undefined,
          bulanTtdNotif: updates?.bulanTtdNotif !== undefined ? updates.bulanTtdNotif : undefined,
          hargaTerupdate: updates?.hargaTerupdate ? parseFloat(cleanNumber(updates.hargaTerupdate)) : undefined,
          trimmingValue: updates?.trimmingValue ? parseFloat(updates.trimmingValue) : undefined,
          lossValue: updates?.lossValue ? parseFloat(updates.lossValue) : undefined,
          tanggalKunjungan,
          statusKunjungan,
          catatanKunjungan: catatanKunjungan || undefined,
          fotoBuktiKunjungan: fotoBukti || undefined,
          updated_by: user?._id,
        });
      }

      toast.success(`✅ ${selectedTarget.length} standar berhasil diupdate untuk ${selectedTarget[0].namaPerusahaan}`);
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setSelectedCompany("");
      setSelectedTargetId(null);
      setTanggalKunjungan("");
      setStatusKunjungan("VISITED");
      setCatatanKunjungan("");
      setFotoBukti(null);
      setStandardUpdates({});
    } catch (error) {
      console.error('Error updating kunjungan:', error);
      toast.error('❌ Gagal mengupdate kunjungan');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedCompany("");
      setSelectedTargetId(null);
      setTanggalKunjungan("");
      setStatusKunjungan("VISITED");
      setCatatanKunjungan("");
      setFotoBukti(null);
      setStandardUpdates({});
    }
  }, [open]);

  // Get selected target details
  const selectedTarget = React.useMemo(() => {
    if (!selectedCompany) return null;
    return groupedCompanies[selectedCompany] || [];
  }, [selectedCompany, groupedCompanies]);

  // Auto-fill kunjungan data when company is selected
  useEffect(() => {
    if (selectedTarget && selectedTarget.length > 0) {
      // Find target with existing tanggalKunjungan, or use the first one
      const targetWithKunjungan = selectedTarget.find(t => t.tanggalKunjungan) || selectedTarget[0];

      // Fill kunjungan data from existing record
      setTanggalKunjungan(targetWithKunjungan.tanggalKunjungan || "");
      setStatusKunjungan(targetWithKunjungan.statusKunjungan || "VISITED");
      setCatatanKunjungan(targetWithKunjungan.catatanKunjungan || "");
      setFotoBukti(targetWithKunjungan.fotoBuktiKunjungan || null);
    } else {
      // Reset if no company selected
      setTanggalKunjungan("");
      setStatusKunjungan("VISITED");
      setCatatanKunjungan("");
      setFotoBukti(null);
    }
  }, [selectedTarget]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[60vw] xl:max-w-[60vw] max-h-[92vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl sm:max-w-3xl flex flex-col">
          {/* Modern Gradient Header */}
          <div className="relative px-4 sm:px-8 py-3 sm:py-4 flex-shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            <DialogHeader className="relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl">
                      <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 tracking-tight">
                        Tambah Kunjungan Baru
                      </DialogTitle>
                      <p className="text-green-600/90 dark:text-green-400/80 text-[10px] sm:text-sm mt-1 font-medium">
                        Catat kunjungan untuk perusahaan yang sudah ada
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-3 sm:px-8 py-3 sm:py-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            <div className="space-y-4 sm:space-y-6">
              {/* Company Selection Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-green-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Pilih Perusahaan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {Object.keys(groupedCompanies).length} perusahaan tersedia
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nama Perusahaan <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={companyOptions}
                      value={selectedCompany}
                      onChange={(value) => {
                        setSelectedCompany(value);
                        // Select first target from this company
                        const targets = groupedCompanies[value];
                        if (targets && targets.length > 0) {
                          setSelectedTargetId(targets[0]._id);
                        } else {
                          setSelectedTargetId(null);
                        }
                      }}
                      placeholder="Cari perusahaan..."
                      emptyText="Tidak ada perusahaan"
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-green-500 h-10 text-sm"
                    />
                  </div>

                  {selectedTarget && selectedTarget.length > 0 && (
                    <div className="space-y-3">
                      {/* Company Header Info */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedTarget[0].namaPerusahaan}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-blue-700 dark:text-blue-300">PIC: </span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">{selectedTarget[0].picCrm}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 dark:text-blue-300">Sales: </span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">{selectedTarget[0].sales}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 dark:text-blue-300">Lokasi: </span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">{selectedTarget[0].kota}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 dark:text-blue-300">Total Standar: </span>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">{selectedTarget.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* All Standards List with Edit Forms */}
                      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-b-2 border-slate-300 dark:border-slate-600">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Update Status & Keuangan per Standar ({selectedTarget.length} Standar)
                          </p>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
                          {selectedTarget.map((target, index) => {
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
                                      <SelectTrigger className={`h-9 text-sm border-slate-200 dark:border-slate-700 w-full`}>
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
                              {selectedTarget.reduce((sum, t) => {
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
                    </div>
                  )}
                </div>
              </div>

              {/* Visit Details Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Detail Kunjungan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Tanggal & status</p>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tanggal Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={tanggalKunjungan}
                      onChange={(e) => setTanggalKunjungan(e.target.value)}
                      className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status Kunjungan <span className="text-red-500">*</span>
                    </Label>
                    <Select value={statusKunjungan} onValueChange={setStatusKunjungan}>
                      <SelectTrigger className="w-full border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 h-10 text-sm">
                        <SelectValue placeholder="Pilih status kunjungan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VISITED">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 hover:bg-green-700">Visited</Badge>
                            <span className="text-xs">Sudah dikunjungi</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="NOT YET">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-500 hover:bg-gray-600">Not Yet</Badge>
                            <span className="text-xs">Belum dikunjungi</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Catatan Kunjungan
                    </Label>
                    <Textarea
                      placeholder="Tambahkan catatan kunjungan..."
                      className="min-h-[100px] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                      value={catatanKunjungan}
                      onChange={(e) => setCatatanKunjungan(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Bukti Kunjungan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Upload foto</p>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Foto Bukti Kunjungan
                    </Label>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 h-10 text-sm"
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengupload & mengkompresi foto...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {fotoBukti && (
                    <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Preview:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFotoBukti(null)}
                          className="text-xs text-red-600 hover:text-red-700 h-7 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Hapus
                        </Button>
                      </div>
                      <img
                        src={fotoBukti}
                        alt="Preview bukti kunjungan"
                        className="w-full max-h-48 object-cover rounded-lg border shadow-lg"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-blue-700 dark:text-blue-300">
                          Ukuran: {Math.round((fotoBukti.length * 0.75) / 1024)} KB (terkompresi)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageClick(fotoBukti)}
                          className="cursor-pointer text-xs h-7 px-3 bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          Lihat Gambar
                        </Button>
                      </div>
                    </div>
                  )}

                  {!fotoBukti && !isUploading && (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                        Belum ada foto yang diupload
                      </p>
                      <p className="text-[10px] text-center text-slate-500 dark:text-slate-500 mt-1">
                        Maksimum 2MB (akan dikompresi otomatis)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8 py-3 sm:py-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="text-red-500">*</span> Wajib diisi
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isUploading}
                className="cursor-pointer flex-1 sm:flex-none border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-9 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>Batal</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading || !selectedCompany || !tanggalKunjungan || !statusKunjungan}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg h-9 sm:h-10 px-3 sm:px-6 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>Tambah Kunjungan</span>
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
};

TambahKunjunganDialog.displayName = 'TambahKunjunganDialog';

export { TambahKunjunganDialog };
