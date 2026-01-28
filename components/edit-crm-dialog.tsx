"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterAssociateData from '@/data/master-associate.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';

interface EditFormData {
  tahun: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  namaPerusahaan: string;
  status: string;
  alasan: string;
  category: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi: string;
  eaCode: string;
  std: string;
  iaDate: string;
  expDate: string;
  tahapAudit: string;
  hargaKontrak: string;
  bulanTtdNotif: string;
  hargaTerupdate: string;
  trimmingValue: string;
  lossValue: string;
  cashback: string;
  terminPembayaran: string;
  statusSertifikat: string;
  tanggalKunjungan: string;
  statusKunjungan: string;
}

interface EditCrmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: any;
  staffUsers: any[];
  onSuccess?: () => void;
}

const EditCrmDialog = React.memo(function EditCrmDialog({
  open,
  onOpenChange,
  target,
  staffUsers,
  onSuccess
}: EditCrmDialogProps) {
  const updateTarget = useMutation(api.crmTargets.updateCrmTarget);

  const [formData, setFormData] = useState<EditFormData>({
    tahun: '',
    bulanExpDate: '',
    produk: '',
    picCrm: '',
    sales: '',
    namaAssociate: '',
    namaPerusahaan: '',
    status: '',
    alasan: '',
    category: '',
    provinsi: '',
    kota: '',
    alamat: '',
    akreditasi: '',
    eaCode: '',
    std: '',
    iaDate: '',
    expDate: '',
    tahapAudit: '',
    hargaKontrak: '',
    bulanTtdNotif: '',
    hargaTerupdate: '',
    trimmingValue: '',
    lossValue: '',
    cashback: '',
    terminPembayaran: '',
    statusSertifikat: '',
    tanggalKunjungan: '',
    statusKunjungan: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when target changes
  useEffect(() => {
    if (target) {
      setFormData({
        tahun: target.tahun || '',
        bulanExpDate: target.bulanExpDate || '',
        produk: target.produk || '',
        picCrm: target.picCrm || '',
        sales: target.sales || '',
        namaAssociate: target.namaAssociate || '',
        namaPerusahaan: target.namaPerusahaan || '',
        status: target.status || '',
        alasan: target.alasan || '',
        category: target.category || '',
        provinsi: target.provinsi || '',
        kota: target.kota || '',
        alamat: target.alamat || '',
        akreditasi: target.akreditasi || '',
        eaCode: target.eaCode || '',
        std: target.std || '',
        iaDate: target.iaDate || '',
        expDate: target.expDate || '',
        tahapAudit: target.tahapAudit || '',
        hargaKontrak: target.hargaKontrak ? target.hargaKontrak.toLocaleString('id-ID') : '',
        bulanTtdNotif: target.bulanTtdNotif || '',
        hargaTerupdate: target.hargaTerupdate ? target.hargaTerupdate.toLocaleString('id-ID') : '',
        trimmingValue: target.trimmingValue?.toString() || '',
        lossValue: target.lossValue?.toString() || '',
        cashback: target.cashback ? target.cashback.toLocaleString('id-ID') : '',
        terminPembayaran: target.terminPembayaran || '',
        statusSertifikat: target.statusSertifikat || '',
        tanggalKunjungan: target.tanggalKunjungan || '',
        statusKunjungan: target.statusKunjungan || '',
      });
    }
  }, [target]);

  // Format number to Indonesian locale (1.000)
  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Handle harga field changes with formatting
  const handleHargaChange = (field: 'hargaKontrak' | 'hargaTerupdate' | 'cashback', value: string) => {
    // Remove formatting for storage, keep as plain string
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');

    // For cashback, just update the field directly
    if (field === 'cashback') {
      updateField(field, cleanValue);
      return;
    }

    // For hargaKontrak or hargaTerupdate, auto-calculate trimming and loss values
    // Get current values (use the new value if updating the field, otherwise use existing)
    const currentHargaKontrak = field === 'hargaKontrak'
      ? parseFloat(cleanValue) || 0
      : parseFloat(formData.hargaKontrak.replace(/\./g, '').replace(/,/g, '.')) || 0;

    const currentHargaTerupdate = field === 'hargaTerupdate'
      ? parseFloat(cleanValue) || 0
      : parseFloat(formData.hargaTerupdate.replace(/\./g, '').replace(/,/g, '.')) || 0;

    // Calculate trimming value (when harga terupdate > harga kontrak)
    const trimmingValue = currentHargaTerupdate > currentHargaKontrak
      ? currentHargaTerupdate - currentHargaKontrak
      : 0;

    // Calculate loss value (when harga kontrak > harga terupdate)
    const lossValue = currentHargaKontrak > currentHargaTerupdate
      ? currentHargaKontrak - currentHargaTerupdate
      : 0;

    // Update all values in one setState call to avoid double render
    setFormData(prev => ({
      ...prev,
      [field]: cleanValue,
      trimmingValue: trimmingValue > 0 ? trimmingValue.toString() : '',
      lossValue: lossValue > 0 ? lossValue.toString() : ''
    }));
  };

  // Memoized options
  const provOptions = useMemo(() => Object.keys(indonesiaData).sort(), []);
  const kotaOptions = useMemo(() =>
    formData.provinsi ? (indonesiaData as any)[formData.provinsi]?.kabupaten_kota?.sort() || [] : []
  , [formData.provinsi]);

  const alasanOptions = useMemo(() => masterAlasanData.alasan.map(item => item.alasan), []);
  const associateOptions = useMemo(() => masterAssociateData.associate.map(assoc => assoc.nama), []);
  const salesOptions = useMemo(() => masterSalesData.map(sales => sales.nama), []);
  const standarOptions = useMemo(() => masterStandarData.standar.map(std => std.nama), []);
  const eaCodeOptions = useMemo(() => masterEaCodeData.ea_code.map(ea => ({ id: ea.id, code: ea.ea_code })), []);

  // Format harga for display
  const displayHargaKontrak = useMemo(() => formatNumber(formData.hargaKontrak), [formData.hargaKontrak]);
  const displayHargaTerupdate = useMemo(() => formatNumber(formData.hargaTerupdate), [formData.hargaTerupdate]);
  const displayCashback = useMemo(() => formatNumber(formData.cashback), [formData.cashback]);
  const displayTrimmingValue = useMemo(() => formatNumber(formData.trimmingValue), [formData.trimmingValue]);
  const displayLossValue = useMemo(() => formatNumber(formData.lossValue), [formData.lossValue]);

  const updateField = useCallback((field: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!target) return;

    try {
      setIsSubmitting(true);

      const hargaKontrakNum = parseFloat(formData.hargaKontrak.replace(/\./g, '')) || 0;
      const hargaTerupdateNum = parseFloat(formData.hargaTerupdate.replace(/\./g, '')) || 0;
      const cashbackNum = parseFloat(formData.cashback.replace(/\./g, '')) || 0;

      await updateTarget({
        id: target._id,
        tahun: formData.tahun,
        bulanExpDate: formData.bulanExpDate,
        produk: formData.produk,
        picCrm: formData.picCrm,
        sales: formData.sales,
        namaAssociate: formData.namaAssociate,
        namaPerusahaan: formData.namaPerusahaan,
        status: formData.status,
        alasan: formData.alasan,
        category: formData.category,
        provinsi: formData.provinsi,
        kota: formData.kota,
        alamat: formData.alamat,
        akreditasi: formData.akreditasi,
        eaCode: formData.eaCode,
        std: formData.std,
        iaDate: formData.iaDate,
        expDate: formData.expDate,
        tahapAudit: formData.tahapAudit,
        hargaKontrak: hargaKontrakNum,
        bulanTtdNotif: formData.bulanTtdNotif,
        hargaTerupdate: hargaTerupdateNum,
        trimmingValue: parseFloat(formData.trimmingValue) || 0,
        lossValue: parseFloat(formData.lossValue) || 0,
        cashback: cashbackNum,
        terminPembayaran: formData.terminPembayaran,
        statusSertifikat: formData.statusSertifikat,
        tanggalKunjungan: formData.tanggalKunjungan,
        statusKunjungan: formData.statusKunjungan,
      });

      toast.success('Data CRM berhasil diperbarui');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Error memperbarui data CRM');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[85vw] lg:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Edit Data CRM</DialogTitle>
          <DialogDescription>
            Perbarui informasi target CRM
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Section 1: Informasi Perusahaan */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Informasi Perusahaan</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Nama Perusahaan *</Label>
                  <Input
                    value={formData.namaPerusahaan}
                    onChange={(e) => updateField('namaPerusahaan', e.target.value)}
                    placeholder="Nama perusahaan"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Alamat *</Label>
                  <Input
                    value={formData.alamat}
                    onChange={(e) => updateField('alamat', e.target.value)}
                    placeholder="Alamat lengkap"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Provinsi *</Label>
                    <Select value={formData.provinsi} onValueChange={(v) => updateField('provinsi', v)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {provOptions.map((prov, idx) => (
                          <SelectItem key={`${prov}-${idx}`} value={prov}>{prov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Kota *</Label>
                    <Select value={formData.kota} onValueChange={(v) => updateField('kota', v)} disabled={!formData.provinsi}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {kotaOptions.map((kota: string, idx: number) => (
                          <SelectItem key={`${kota}-${idx}`} value={kota}>{kota}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Status & PIC */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-green-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Status & PIC</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Status *</Label>
                  <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger className="mt-1 w-full">
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

                {formData.status === 'LOSS' && (
                  <div>
                    <Label className="text-xs font-medium">Alasan</Label>
                    <Select value={formData.alasan} onValueChange={(v) => updateField('alasan', v)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Pilih alasan" />
                      </SelectTrigger>
                      <SelectContent>
                        {alasanOptions.map((alasan, idx) => (
                          <SelectItem key={`${alasan}-${idx}`} value={alasan}>{alasan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOLD">GOLD</SelectItem>
                      <SelectItem value="SILVER">SILVER</SelectItem>
                      <SelectItem value="BRONZE">BRONZE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">PIC CRM</Label>
                  <Select value={formData.picCrm} onValueChange={(v) => updateField('picCrm', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffUsers.map(user => (
                        <SelectItem key={user._id} value={user.name}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Sales</Label>
                  <Select value={formData.sales} onValueChange={(v) => updateField('sales', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesOptions.map((nama, idx) => (
                        <SelectItem key={`${nama}-${idx}`} value={nama}>{nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Associate</Label>
                  <Select value={formData.namaAssociate} onValueChange={(v) => updateField('namaAssociate', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {associateOptions.map((nama, idx) => (
                        <SelectItem key={`${nama}-${idx}`} value={nama}>{nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 3: Produk & Sertifikat */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Produk & Sertifikat</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Tahun</Label>
                    <Select value={formData.tahun} onValueChange={(v) => updateField('tahun', v)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Bulan Exp</Label>
                    <Select value={formData.bulanExpDate} onValueChange={(v) => updateField('bulanExpDate', v)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Januari">Januari</SelectItem>
                        <SelectItem value="Februari">Februari</SelectItem>
                        <SelectItem value="Maret">Maret</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="Mei">Mei</SelectItem>
                        <SelectItem value="Juni">Juni</SelectItem>
                        <SelectItem value="Juli">Juli</SelectItem>
                        <SelectItem value="Agustus">Agustus</SelectItem>
                        <SelectItem value="September">September</SelectItem>
                        <SelectItem value="Oktober">Oktober</SelectItem>
                        <SelectItem value="November">November</SelectItem>
                        <SelectItem value="Desember">Desember</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Produk</Label>
                  <Select value={formData.produk} onValueChange={(v) => updateField('produk', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XMS">XMS</SelectItem>
                      <SelectItem value="SUSTAIN">SUSTAIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Akreditasi</Label>
                  <Select value={formData.akreditasi} onValueChange={(v) => updateField('akreditasi', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KAN">KAN</SelectItem>
                      <SelectItem value="NON AKRE">NON AKRE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Standar</Label>
                  <Select value={formData.std} onValueChange={(v) => updateField('std', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {standarOptions.map((nama, idx) => (
                        <SelectItem key={`${nama}-${idx}`} value={nama}>{nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">EA Code</Label>
                  <Select value={formData.eaCode} onValueChange={(v) => updateField('eaCode', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {eaCodeOptions.map((ea) => (
                        <SelectItem key={ea.id} value={ea.code}>{ea.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Tahap Audit</Label>
                  <Select value={formData.tahapAudit} onValueChange={(v) => updateField('tahapAudit', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IA">IA</SelectItem>
                      <SelectItem value="RC">RC</SelectItem>
                      <SelectItem value="SV1">SV1</SelectItem>
                      <SelectItem value="SV2">SV2</SelectItem>
                      <SelectItem value="SV3">SV3</SelectItem>
                      <SelectItem value="SV4">SV4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Status Sertifikat</Label>
                  <Select value={formData.statusSertifikat} onValueChange={(v) => updateField('statusSertifikat', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Terbit">Terbit</SelectItem>
                      <SelectItem value="Belum Terbit">Belum Terbit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 4: Harga & Pembayaran */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-orange-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Harga & Pembayaran</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">IA Date</Label>
                  <Input
                    type="date"
                    value={formData.iaDate}
                    onChange={(e) => updateField('iaDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Exp Date</Label>
                  <Input
                    type="date"
                    value={formData.expDate}
                    onChange={(e) => updateField('expDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Bulan TTD Notif</Label>
                  <Input
                    type="text"
                    value={formData.bulanTtdNotif}
                    onChange={(e) => updateField('bulanTtdNotif', e.target.value)}
                    placeholder="Contoh: Januari 2024"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Harga Kontrak</Label>
                  <Input
                    type="text"
                    value={displayHargaKontrak}
                    onChange={(e) => handleHargaChange('hargaKontrak', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Harga Terupdate</Label>
                  <Input
                    type="text"
                    value={displayHargaTerupdate}
                    onChange={(e) => handleHargaChange('hargaTerupdate', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Cashback</Label>
                  <Input
                    type="text"
                    value={displayCashback}
                    onChange={(e) => handleHargaChange('cashback', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Termin Pembayaran</Label>
                  <Select value={formData.terminPembayaran} onValueChange={(v) => updateField('terminPembayaran', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lunas Diawal">Lunas Diawal</SelectItem>
                      <SelectItem value="Lunas Diakhir">Lunas Diakhir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 5: Kunjungan */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-foreground">Kunjungan</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Tanggal Kunjungan</Label>
                  <Input
                    type="date"
                    value={formData.tanggalKunjungan}
                    onChange={(e) => updateField('tanggalKunjungan', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Status Kunjungan</Label>
                  <Select value={formData.statusKunjungan} onValueChange={(v) => updateField('statusKunjungan', v)}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISITED">VISITED</SelectItem>
                      <SelectItem value="NOT YET">NOT YET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Readonly calculated fields */}
                <div className="pt-4 border-t">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trimming Value:</span>
                      <span className="font-semibold text-green-600">
                        {formData.trimmingValue ? parseFloat(formData.trimmingValue).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Harga terupdate &gt; harga kontrak
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Loss Value:</span>
                      <span className="font-semibold text-red-600">
                        {formData.lossValue ? parseFloat(formData.lossValue).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Harga kontrak &gt; harga terupdate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EditCrmDialog.displayName = "EditCrmDialog";

export { EditCrmDialog };
