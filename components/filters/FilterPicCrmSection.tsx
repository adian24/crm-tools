import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FilterPicCrmSectionProps {
  filterPicCrm: string;
  setFilterPicCrm: (value: string) => void;
  picCrmOptions: string[];
}

export function FilterPicCrmSection({
  filterPicCrm,
  setFilterPicCrm,
  picCrmOptions,
}: FilterPicCrmSectionProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">PIC CRM</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPicCrm === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPicCrm('all')}
          className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
        >
          All PIC
        </Button>
        {picCrmOptions.map((pic) => (
          <Button
            key={pic}
            variant={filterPicCrm === pic ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPicCrm(pic)}
            className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
          >
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
            {pic}
          </Button>
        ))}
      </div>
    </div>
  );
}
