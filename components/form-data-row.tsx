// FormDataRow Component for Excel-like table - Moved to separate file for better organization
// This component is used in app/dashboard-manager/crm-data/page.tsx

"use client";

import React, { useMemo } from 'react';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import masterStandarData from '@/data/master-standar.json';
import masterEaCodeData from '@/data/master-ea-code.json';
import masterAlasanData from '@/data/master-alasan.json';
import { Trash2 } from 'lucide-react';

export interface CrmFormData {
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

interface FormDataRowProps {
  row: CrmFormData;
  index: number;
  onFieldChange: (index: number, field: keyof CrmFormData, value: string) => void;
  onRemove: (index: number) => void;
  totalRows: number;
  staffUsers: any[];
  associates: any[];
}

export const FormDataRow = ({ row, index, onFieldChange, onRemove, totalRows, staffUsers, associates }: FormDataRowProps) => {
  const handleChange = (field: keyof CrmFormData, value: string) => {
    onFieldChange(index, field, value);
  };

  const handleHargaChange = (field: 'hargaKontrak' | 'hargaTerupdate' | 'cashback', value: string) => {
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');

    if (field === 'cashback') {
      handleChange(field, cleanValue);
      return;
    }

    // Auto-calculate trimming and loss values
    const currentHargaKontrak = field === 'hargaKontrak'
      ? parseFloat(cleanValue) || 0
      : parseFloat(row.hargaKontrak.replace(/\./g, '').replace(/,/g, '.')) || 0;

    const currentHargaTerupdate = field === 'hargaTerupdate'
      ? parseFloat(cleanValue) || 0
      : parseFloat(row.hargaTerupdate.replace(/\./g, '').replace(/,/g, '.')) || 0;

    const trimmingValue = currentHargaTerupdate > currentHargaKontrak
      ? currentHargaTerupdate - currentHargaKontrak
      : 0;

    const lossValue = currentHargaKontrak > currentHargaTerupdate
      ? currentHargaKontrak - currentHargaTerupdate
      : 0;

    // Update all related fields
    onFieldChange(index, field, cleanValue);
    onFieldChange(index, 'trimmingValue', trimmingValue > 0 ? trimmingValue.toString() : '');
    onFieldChange(index, 'lossValue', lossValue > 0 ? lossValue.toString() : '');
  };

  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  // Get kota options based on selected provinsi
  const getKotaOptions = () => {
    if (!row.provinsi) return [];
    const selectedProv = (indonesiaData as any)[row.provinsi];
    return selectedProv?.kabupaten_kota || [];
  };

  return (
    <tr className="hover:bg-muted/30">
      <td className="border border-border p-1 min-w-[80px]">
        <select
          defaultValue={row.tahun || new Date().getFullYear().toString()}
          onChange={(e) => handleChange('tahun', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.namaPerusahaan}
          onChange={(e) => handleChange('namaPerusahaan', e.target.value)}
          placeholder="Nama Perusahaan"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.provinsi}
          onChange={(e) => {
            handleChange('provinsi', e.target.value);
            // Reset kota when provinsi changes
            handleChange('kota', '');
          }}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {Object.keys(indonesiaData).sort().map(prov => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.kota}
          onChange={(e) => handleChange('kota', e.target.value)}
          disabled={!row.provinsi}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded disabled:opacity-50"
        >
          <option value="">- Pilih -</option>
          {getKotaOptions().map((kota: string) => (
            <option key={kota} value={kota}>{kota}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[150px]">
        <input
          type="text"
          defaultValue={row.alamat}
          onChange={(e) => handleChange('alamat', e.target.value)}
          placeholder="Alamat lengkap"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="WAITING">WAITING</option>
          <option value="PROSES">PROSES</option>
          <option value="DONE">DONE</option>
          <option value="SUSPEND">SUSPEND</option>
          <option value="LOSS">LOSS</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.picCrm}
          onChange={(e) => handleChange('picCrm', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {staffUsers.map(user => (
            <option key={user._id} value={user.name}>{user.name}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.sales}
          onChange={(e) => handleChange('sales', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterSalesData.map((sales: any) => (
            <option key={sales.id} value={sales.nama}>{sales.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[120px]">
        <select
          defaultValue={row.namaAssociate}
          onChange={(e) => handleChange('namaAssociate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {associates?.map((assoc: any) => (
            <option key={assoc._id} value={assoc.nama}>{assoc.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.produk}
          onChange={(e) => handleChange('produk', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="XMS">XMS</option>
          <option value="SUSTAIN">SUSTAIN</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="GOLD">GOLD</option>
          <option value="SILVER">SILVER</option>
          <option value="BRONZE">BRONZE</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.akreditasi}
          onChange={(e) => handleChange('akreditasi', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="KAN">KAN</option>
          <option value="NON AKRE">NON AKRE</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.std}
          onChange={(e) => handleChange('std', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterStandarData.standar.map((std: any) => (
            <option key={std.kode} value={std.nama}>{std.nama}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.iaDate}
          onChange={(e) => handleChange('iaDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.expDate}
          onChange={(e) => handleChange('expDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          value={formatNumber(row.hargaKontrak)}
          onChange={(e) => handleHargaChange('hargaKontrak', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          value={formatNumber(row.hargaTerupdate)}
          onChange={(e) => handleHargaChange('hargaTerupdate', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[80px]">
        <input
          type="text"
          readOnly
          value={formatNumber(row.trimmingValue)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none bg-muted/30 rounded"
          title="Harga Terupdate > Harga Kontrak"
        />
      </td>
      <td className="border border-border p-1 min-w-[80px]">
        <input
          type="text"
          readOnly
          value={formatNumber(row.lossValue)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none bg-muted/30 rounded"
          title="Harga Kontrak > Harga Terupdate"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          value={formatNumber(row.cashback)}
          onChange={(e) => handleHargaChange('cashback', e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.terminPembayaran}
          onChange={(e) => handleChange('terminPembayaran', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Lunas Diawal">Lunas Diawal</option>
          <option value="Lunas Diakhir">Lunas Diakhir</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.tahapAudit}
          onChange={(e) => handleChange('tahapAudit', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="IA">IA</option>
          <option value="RC">RC</option>
          <option value="SV1">SV1</option>
          <option value="SV2">SV2</option>
          <option value="SV3">SV3</option>
          <option value="SV4">SV4</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.statusSertifikat}
          onChange={(e) => handleChange('statusSertifikat', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Terbit">Terbit</option>
          <option value="Belum Terbit">Belum Terbit</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="date"
          defaultValue={row.tanggalKunjungan}
          onChange={(e) => handleChange('tanggalKunjungan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.statusKunjungan}
          onChange={(e) => handleChange('statusKunjungan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="VISITED">VISITED</option>
          <option value="NOT YET">NOT YET</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.bulanExpDate}
          onChange={(e) => handleChange('bulanExpDate', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          <option value="Januari">Januari</option>
          <option value="Februari">Februari</option>
          <option value="Maret">Maret</option>
          <option value="April">April</option>
          <option value="Mei">Mei</option>
          <option value="Juni">Juni</option>
          <option value="Juli">Juli</option>
          <option value="Agustus">Agustus</option>
          <option value="September">September</option>
          <option value="Oktober">Oktober</option>
          <option value="November">November</option>
          <option value="Desember">Desember</option>
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.alasan}
          onChange={(e) => handleChange('alasan', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterAlasanData.alasan.map((item: any) => (
            <option key={item.id} value={item.alasan}>{item.alasan}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <select
          defaultValue={row.eaCode}
          onChange={(e) => handleChange('eaCode', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <option value="">- Pilih -</option>
          {masterEaCodeData.ea_code.map((ea: any) => (
            <option key={ea.id} value={ea.ea_code}>{ea.ea_code}</option>
          ))}
        </select>
      </td>
      <td className="border border-border p-1 min-w-[100px]">
        <input
          type="text"
          defaultValue={row.bulanTtdNotif}
          onChange={(e) => handleChange('bulanTtdNotif', e.target.value)}
          placeholder="Contoh: Januari 2024"
          className="w-full px-2 py-1.5 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded"
        />
      </td>
      <td className="border border-border p-center min-w-[50px]">
        <button
          onClick={() => onRemove(index)}
          disabled={totalRows === 1}
          className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer p-1"
          title="Hapus baris"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};
