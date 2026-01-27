import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface FilterPicSalesSectionProps {
  filterPicSales: string;
  setFilterPicSales: (value: string) => void;
  salesOptions: string[];
}

export function FilterPicSalesSection({
  filterPicSales,
  setFilterPicSales,
  salesOptions,
}: FilterPicSalesSectionProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">PIC Sales</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPicSales === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPicSales('all')}
          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
            filterPicSales === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''
          }`}
        >
          All Sales
        </Button>
        {salesOptions.map((sales) => (
          <Button
            key={sales}
            variant={filterPicSales === sales ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPicSales(sales)}
            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
              filterPicSales === sales
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0"></div>
            {sales}
          </Button>
        ))}
      </div>
    </div>
  );
}
