import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FilterKunjunganSectionProps {
  filterStatusKunjungan: string;
  setFilterStatusKunjungan: (value: string) => void;
}

export function FilterKunjunganSection({
  filterStatusKunjungan,
  setFilterStatusKunjungan,
}: FilterKunjunganSectionProps) {
  return (
    <>
      {/* Status Kunjungan */}
      <div>
        <Label className="mb-1.5 block text-xs">Status Kunjungan</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatusKunjungan === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatusKunjungan('all')}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterStatusKunjungan === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
            }`}
          >
            All
          </Button>
          {['VISITED', 'NOT YET'].map((status) => {
            let statusColor = '';
            switch (status) {
              case 'VISITED':
                statusColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                break;
              case 'NOT YET':
                statusColor = 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300';
                break;
            }

            return (
              <Button
                key={status}
                size="sm"
                onClick={() => setFilterStatusKunjungan(status)}
                className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                  filterStatusKunjungan === status
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
    </>
  );
}
