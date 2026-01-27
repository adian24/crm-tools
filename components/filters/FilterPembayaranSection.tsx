import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FilterPembayaranSectionProps {
  filterTermin: string;
  setFilterTermin: (value: string) => void;
}

export function FilterPembayaranSection({
  filterTermin,
  setFilterTermin,
}: FilterPembayaranSectionProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">Termin</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterTermin === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterTermin('all')}
          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
            filterTermin === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
          }`}
        >
          All
        </Button>
        {['DP', 'Lunas Diawal', 'Lunas Diakhir'].map((termin) => (
          <Button
            key={termin}
            size="sm"
            onClick={() => setFilterTermin(termin)}
            className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
              filterTermin === termin
                ? 'bg-black hover:bg-gray-800 text-white border-black'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
          >
            {termin}
          </Button>
        ))}
      </div>
    </div>
  );
}
