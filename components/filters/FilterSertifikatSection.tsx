import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSertifikatSectionProps {
  filterTipeProduk: string;
  setFilterTipeProduk: (value: string) => void;
  filterStandar: string;
  setFilterStandar: (value: string) => void;
  filterAkreditasi: string;
  setFilterAkreditasi: (value: string) => void;
  filterEaCode: string;
  setFilterEaCode: (value: string) => void;
  filterTahapAudit: string;
  setFilterTahapAudit: (value: string) => void;
  filterFromBulanTTD: string;
  setFilterFromBulanTTD: (value: string) => void;
  filterToBulanTTD: string;
  setFilterToBulanTTD: (value: string) => void;
  filterStatusSertifikat: string;
  setFilterStatusSertifikat: (value: string) => void;
  standarOptions: string[];
  tahapanAuditOptions: string[];
  bulanOptions: Array<{ value: string; label: string }>;
}

export function FilterSertifikatSection({
  filterTipeProduk,
  setFilterTipeProduk,
  filterStandar,
  setFilterStandar,
  filterAkreditasi,
  setFilterAkreditasi,
  filterEaCode,
  setFilterEaCode,
  filterTahapAudit,
  setFilterTahapAudit,
  filterFromBulanTTD,
  setFilterFromBulanTTD,
  filterToBulanTTD,
  setFilterToBulanTTD,
  filterStatusSertifikat,
  setFilterStatusSertifikat,
  standarOptions,
  tahapanAuditOptions,
  bulanOptions,
}: FilterSertifikatSectionProps) {
  return (
    <>
      {/* Tipe Produk */}
      <div>
        <Label className="mb-1.5 block text-xs">Tipe Produk</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterTipeProduk === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTipeProduk('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterTipeProduk === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['XMS', 'SUSTAIN'].map((tipe) => {
            let tipeColor = '';
            switch (tipe) {
              case 'XMS':
                tipeColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                break;
              case 'SUSTAIN':
                tipeColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                break;
            }

            return (
              <Button
                key={tipe}
                size="sm"
                onClick={() => setFilterTipeProduk(tipe)}
                className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                  filterTipeProduk === tipe ? 'bg-black hover:bg-gray-800 text-white border-black' : tipeColor
                }`}
              >
                {tipe}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Standar */}
      <div>
        <Label className="mb-1.5 block text-xs">Standar</Label>
        <Select value={filterStandar} onValueChange={setFilterStandar}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="All Standar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standar</SelectItem>
            {standarOptions.map((standar) => (
              <SelectItem key={standar} value={standar}>
                {standar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Akreditasi */}
      <div>
        <Label className="mb-1.5 block text-xs">Akreditasi</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterAkreditasi === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAkreditasi('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterAkreditasi === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['KAN', 'NON AKRE'].map((akreditasi) => (
            <Button
              key={akreditasi}
              size="sm"
              onClick={() => setFilterAkreditasi(akreditasi)}
              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                filterAkreditasi === akreditasi
                  ? 'bg-black hover:bg-gray-800 text-white border-black'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}
            >
              {akreditasi}
            </Button>
          ))}
        </div>
      </div>

      {/* EA CODE */}
      <div>
        <Label className="mb-1.5 block text-xs">EA CODE</Label>
        <Input
          placeholder="Search EA Code..."
          value={filterEaCode}
          onChange={(e) => setFilterEaCode(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Tahapan Audit */}
      <div>
        <Label className="mb-1.5 block text-xs">Tahapan Audit</Label>
        <Select value={filterTahapAudit} onValueChange={setFilterTahapAudit}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="All Tahapan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tahapan</SelectItem>
            {tahapanAuditOptions.map((tahap) => (
              <SelectItem key={tahap} value={tahap}>
                {tahap}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* From/To Bulan TTD */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-xs">From Bulan TTD</Label>
          <Select value={filterFromBulanTTD} onValueChange={setFilterFromBulanTTD}>
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {bulanOptions.map((bulan) => (
                <SelectItem key={bulan.value} value={bulan.value}>
                  {bulan.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">To Bulan TTD</Label>
          <Select value={filterToBulanTTD} onValueChange={setFilterToBulanTTD}>
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {bulanOptions.map((bulan) => (
                <SelectItem key={bulan.value} value={bulan.value}>
                  {bulan.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Sertifikat */}
      <div>
        <Label className="mb-1.5 block text-xs">Status Sertifikat</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatusSertifikat === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatusSertifikat('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterStatusSertifikat === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['Terbit', 'Belum Terbit'].map((status) => (
            <Button
              key={status}
              size="sm"
              onClick={() => setFilterStatusSertifikat(status)}
              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                filterStatusSertifikat === status
                  ? 'bg-black hover:bg-gray-800 text-white border-black'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
