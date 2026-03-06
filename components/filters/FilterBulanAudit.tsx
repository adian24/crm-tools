import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';

interface FilterBulanAuditProps {
  filterTahunAudit: string;
  setFilterTahunAudit: (value: string) => void;
  filterFromBulanAudit: string;
  setFilterFromBulanAudit: (value: string) => void;
  filterToBulanAudit: string;
  setFilterToBulanAudit: (value: string) => void;
  tahunOptions: string[];
  bulanOptions: Array<{ value: string; label: string }>;
}

export function FilterBulanAudit({
  filterTahunAudit,
  setFilterTahunAudit,
  filterFromBulanAudit,
  setFilterFromBulanAudit,
  filterToBulanAudit,
  setFilterToBulanAudit,
  tahunOptions,
  bulanOptions,
}: FilterBulanAuditProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-blue-900">📅 Tahun Audit</Label>
        <Select value={filterTahunAudit} onValueChange={setFilterTahunAudit}>
          <SelectTrigger className="w-full h-8 border-blue-200">
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

      <div className="border rounded-lg p-2 space-y-2 border-blue-200 bg-blue-50/30">
        <div className="text-xs font-semibold text-blue-900">🔄 Range Bulan Audit</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] text-blue-700">From</Label>
            <Select
              value={filterFromBulanAudit}
              onValueChange={setFilterFromBulanAudit}
            >
              <SelectTrigger className="w-full h-8 border-blue-200 text-xs">
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
            <Label className="mb-1 block text-[10px] text-blue-700">To</Label>
            <Select
              value={filterToBulanAudit}
              onValueChange={setFilterToBulanAudit}
            >
              <SelectTrigger className="w-full h-8 border-blue-200 text-xs">
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
