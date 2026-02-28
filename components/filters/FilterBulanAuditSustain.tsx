import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';

interface FilterBulanAuditSustainProps {
  filterTahunAuditSustain: string;
  setFilterTahunAuditSustain: (value: string) => void;
  filterFromBulanAuditSustain: string;
  setFilterFromBulanAuditSustain: (value: string) => void;
  filterToBulanAuditSustain: string;
  setFilterToBulanAuditSustain: (value: string) => void;
  tahunOptions: string[];
  bulanOptions: Array<{ value: string; label: string }>;
}

export function FilterBulanAuditSustain({
  filterTahunAuditSustain,
  setFilterTahunAuditSustain,
  filterFromBulanAuditSustain,
  setFilterFromBulanAuditSustain,
  filterToBulanAuditSustain,
  setFilterToBulanAuditSustain,
  tahunOptions,
  bulanOptions,
}: FilterBulanAuditSustainProps) {
  return (
    <div className="space-y-3">
      {/* Tahun Audit Sustain */}
      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-green-900">📅 Tahun Audit Sustain</Label>
        <Select value={filterTahunAuditSustain} onValueChange={setFilterTahunAuditSustain}>
          <SelectTrigger className="w-full h-8 border-green-200">
            <SelectValue placeholder="All Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tahun</SelectItem>
            {tahunOptions.map((tahun) => (
              <SelectItem key={tahun} value={tahun}>
                {tahun}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulan Audit Sebelumnya Sustain - Range */}
      <div className="border rounded-lg p-2 space-y-2 border-green-200 bg-green-50/30">
        <div className="text-xs font-semibold text-green-900">🔄 Range Bulan Audit Sblm</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] text-green-700">From</Label>
            <Select
              value={filterFromBulanAuditSustain}
              onValueChange={setFilterFromBulanAuditSustain}
            >
              <SelectTrigger className="w-full h-8 border-green-200 text-xs">
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
            <Label className="mb-1 block text-[10px] text-green-700">To</Label>
            <Select
              value={filterToBulanAuditSustain}
              onValueChange={setFilterToBulanAuditSustain}
            >
              <SelectTrigger className="w-full h-8 border-green-200 text-xs">
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
      </div>
    </div>
  );
}
