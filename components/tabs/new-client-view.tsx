"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export function NewClientView() {
  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Laporan Kunjungan New Client</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Laporan kunjungan untuk new client (Coming Soon)
          </p>
        </div>
      </div>

      {/* Empty State */}
      <Card className="p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Fitur Laporan Kunjungan untuk New Client sedang dalam pengembangan.
              Silakan gunakan tab Existing Client untuk saat ini.
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/dashboard-manager/laporan-kunjungan'}
            className="mt-4"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Pindah ke Existing Client
          </Button>
        </div>
      </Card>
    </div>
  );
}
