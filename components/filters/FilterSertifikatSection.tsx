import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSertifikatSectionProps {
  filterStandar: string;
  setFilterStandar: (value: string) => void;
  filterAkreditasi: string;
  setFilterAkreditasi: (value: string) => void;
  filterStatusSertifikat: string;
  setFilterStatusSertifikat: (value: string) => void;
  standarOptions: string[];
}

export function FilterSertifikatSection({
  filterStandar,
  setFilterStandar,
  filterAkreditasi,
  setFilterAkreditasi,
  filterStatusSertifikat,
  setFilterStatusSertifikat,
  standarOptions,
}: FilterSertifikatSectionProps) {
  return (
    <>
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
