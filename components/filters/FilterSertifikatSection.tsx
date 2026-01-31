import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSertifikatSectionProps {
  filterStandar: string;
  setFilterStandar: (value: string) => void;
  filterAkreditasi: string;
  setFilterAkreditasi: (value: string) => void;
  filterStatusSertifikatTerbit: string;
  setFilterStatusSertifikatTerbit: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  standarOptions: string[];
}

export function FilterSertifikatSection({
  filterStandar,
  setFilterStandar,
  filterAkreditasi,
  setFilterAkreditasi,
  filterStatusSertifikatTerbit,
  setFilterStatusSertifikatTerbit,
  filterStatus,
  setFilterStatus,
  standarOptions,
}: FilterSertifikatSectionProps) {
  return (
    <>
      {/* Status */}
      <div>
        <Label className="mb-1.5 block text-xs">Status</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterStatus === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['DONE', 'PROSES', 'LOSS', 'SUSPEND', 'WAITING'].map((status) => {
            let statusColor = '';
            switch (status) {
              case 'DONE':
                statusColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                break;
              case 'PROSES':
                statusColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                break;
              case 'LOSS':
                statusColor = 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300';
                break;
              case 'SUSPEND':
                statusColor = 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300';
                break;
              case 'WAITING':
                statusColor = 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300';
                break;
            }

            return (
              <Button
                key={status}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                  filterStatus === status
                    ? 'bg-black hover:bg-gray-800 text-white border-black'
                    : statusColor
                }`}
              >
                {status}
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

      {/* Status Sertifikat */}
      <div>
        <Label className="mb-1.5 block text-xs">Status Sertifikat Terbit</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatusSertifikatTerbit === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatusSertifikatTerbit('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterStatusSertifikatTerbit === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['Terbit', 'Belum Terbit'].map((status) => (
            <Button
              key={status}
              size="sm"
              onClick={() => setFilterStatusSertifikatTerbit(status)}
              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                filterStatusSertifikatTerbit === status
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
