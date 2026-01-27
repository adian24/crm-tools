import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterCompanySectionProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterProvinsi: string;
  setFilterProvinsi: (value: string) => void;
  filterKota: string;
  setFilterKota: (value: string) => void;
  filterAlasan: string;
  setFilterAlasan: (value: string) => void;
  statusOptions: string[];
  provinsiOptions: string[];
  kotaOptions: string[];
  alasanOptions: string[];
}

export function FilterCompanySection({
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  filterProvinsi,
  setFilterProvinsi,
  filterKota,
  setFilterKota,
  filterAlasan,
  setFilterAlasan,
  statusOptions,
  provinsiOptions,
  kotaOptions,
  alasanOptions,
}: FilterCompanySectionProps) {
  return (
    <>
      {/* Status - Button Filter with Colors */}
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
            All Status
          </Button>
          {statusOptions.map((status) => {
            const statusUpper = status?.toUpperCase() || '';
            let statusColor = '';

            switch (statusUpper) {
              case 'PROSES':
                statusColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                break;
              case 'LANJUT':
                statusColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                break;
              case 'LOSS':
                statusColor = 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300';
                break;
              case 'SUSPEND':
                statusColor = 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300';
                break;
              case 'WAITING':
                statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
                break;
              case 'DONE':
                statusColor = 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300';
                break;
              default:
                statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
            }

            return (
              <Button
                key={status}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                  filterStatus === status ? 'bg-black hover:bg-gray-800 text-white border-black' : statusColor
                }`}
              >
                {status}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Category - Button Filter with Gradient Colors */}
      <div>
        <Label className="mb-1.5 block text-xs">Category</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All Category
          </Button>
          {['GOLD', 'SILVER', 'BRONZE'].map((category) => {
            let categoryColor = '';

            switch (category) {
              case 'GOLD':
                categoryColor =
                  'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-800 border-yellow-300 font-medium shadow-sm';
                break;
              case 'SILVER':
                categoryColor =
                  'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border-gray-300 font-medium shadow-sm';
                break;
              case 'BRONZE':
                categoryColor =
                  'bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-800 border-orange-300 font-medium shadow-sm';
                break;
            }

            return (
              <Button
                key={category}
                size="sm"
                onClick={() => setFilterCategory(category)}
                className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                  filterCategory === category
                    ? 'bg-black hover:bg-gray-800 text-white border-black font-semibold'
                    : categoryColor
                }`}
              >
                {category}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Provinsi */}
      <div>
        <Label className="mb-1.5 block text-xs">Provinsi</Label>
        <Select
          value={filterProvinsi}
          onValueChange={(val) => {
            setFilterProvinsi(val);
            setFilterKota('all');
          }}
        >
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="All Provinsi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinsi</SelectItem>
            {provinsiOptions.map((provinsi) => (
              <SelectItem key={provinsi} value={provinsi}>
                {provinsi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kota */}
      <div>
        <Label className="mb-1.5 block text-xs">Kota</Label>
        <Select value={filterKota} onValueChange={setFilterKota} disabled={filterProvinsi === 'all'}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder={filterProvinsi === 'all' ? 'Select Provinsi first' : 'All Kota'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kota</SelectItem>
            {kotaOptions.map((kota) => (
              <SelectItem key={kota} value={kota}>
                {kota}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alasan */}
      <div>
        <Label className="mb-1.5 block text-xs">Alasan</Label>
        <Select value={filterAlasan} onValueChange={setFilterAlasan}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="All Alasan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alasan</SelectItem>
            {alasanOptions.map((alasan) => (
              <SelectItem key={alasan} value={alasan}>
                {alasan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
