import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterDateSectionProps {
  filterTahun: string;
  setFilterTahun: (value: string) => void;
  filterFromBulanExp: string;
  setFilterFromBulanExp: (value: string) => void;
  filterToBulanExp: string;
  setFilterToBulanExp: (value: string) => void;
  tahunOptions: string[];
  bulanOptions: Array<{ value: string; label: string }>;
}

export function FilterDateSection({
  filterTahun,
  setFilterTahun,
  filterFromBulanExp,
  setFilterFromBulanExp,
  filterToBulanExp,
  setFilterToBulanExp,
  tahunOptions,
  bulanOptions,
}: FilterDateSectionProps) {
  return (
    <>
      {/* Tahun */}
      <div>
        <Label className="mb-1.5 block text-xs">Tahun</Label>
        <Select value={filterTahun} onValueChange={setFilterTahun}>
          <SelectTrigger className="w-full h-8">
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

      {/* From/To Bulan Exp */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-xs">From Bulan Exp</Label>
          <Select value={filterFromBulanExp} onValueChange={setFilterFromBulanExp}>
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
          <Label className="mb-1.5 block text-xs">To Bulan Exp</Label>
          <Select value={filterToBulanExp} onValueChange={setFilterToBulanExp}>
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
    </>
  );
}
