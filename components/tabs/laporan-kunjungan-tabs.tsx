"use client";

import React, { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Sparkles } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ExistingClientView } from './existing-client-view';
import { NewClientView } from './new-client-view';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, User, Search, X, DollarSign, LayoutGrid, Table as TableIcon, Plus } from 'lucide-react';
import { useGlobalFilter } from "@/lib/global-filter-context";

const MONTHS = [
  "All", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface FilterContextType {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedPicCrm: string;
  setSelectedPicCrm: (pic: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  showHargaKontrak: boolean;
  setShowHargaKontrak: (show: boolean) => void;
  existingAddTrigger: number;
  setExistingAddTrigger: React.Dispatch<React.SetStateAction<number>>;
  newAddTrigger: number;
  setNewAddTrigger: React.Dispatch<React.SetStateAction<number>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within LaporanKunjunganTabs');
  }
  return context;
}

export function LaporanKunjunganTabs() {
  const visitedTargets = useQuery(api.crmTargets.getVisitedTargets);
  const newClients = useQuery(api.crmNewClient.getAllNewClients);

  const [activeTab, setActiveTab] = useState("existing");

  // Shared filter state
  const { month: selectedMonth, setMonth: setSelectedMonth, year: selectedYear, setYear: setSelectedYear } = useGlobalFilter();
  const [selectedPicCrm, setSelectedPicCrm] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showHargaKontrak, setShowHargaKontrak] = useState(false);
  const [existingAddTrigger, setExistingAddTrigger] = useState(0);
  const [newAddTrigger, setNewAddTrigger] = useState(0);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filtered counts based on current filter state
  const filteredExisting = visitedTargets?.filter(item => {
    if (!item.tanggalKunjungan) return false;
    const visitDate = new Date(item.tanggalKunjungan);
    const visitMonth = visitDate.getMonth() + 1;
    const visitYear = visitDate.getFullYear();
    const matchesMonth = selectedMonth === 0 || visitMonth === selectedMonth;
    const matchesYear = visitYear === selectedYear;
    const matchesPicCrm = selectedPicCrm === "All" || item.picCrm === selectedPicCrm;
    const matchesSearch = searchQuery === "" ||
      item.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picCrm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sales.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kota.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesPicCrm && matchesSearch;
  }) || [];
  const existingCount = new Set(filteredExisting.map(t => t.namaPerusahaan)).size;

  const newClientCount = newClients?.filter(item => {
    const matchesMonth = selectedMonth === 0 || item.month === selectedMonth;
    const matchesYear = item.year === selectedYear;
    const matchesSearch = searchQuery === "" ||
      item.namaClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaPicClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picTsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesYear && matchesSearch;
  }).length || 0;

  return (
    <FilterContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        selectedPicCrm,
        setSelectedPicCrm,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        showHargaKontrak,
        setShowHargaKontrak,
        existingAddTrigger,
        setExistingAddTrigger,
        newAddTrigger,
        setNewAddTrigger,
      }}
    >
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Sticky Tab Header + Filters */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Tab Switcher */}
              <TabsList className="grid w-full max-w-[380px] grid-cols-2 h-12 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg shadow-md flex-shrink-0">
                <TabsTrigger
                  value="existing"
                  className="cursor-pointer relative gap-2 bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Existing Client</span>
                  <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                    {existingCount}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger
                  value="new"
                  className="cursor-pointer relative gap-2 bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>New Client</span>
                  <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                    {newClientCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Filters - inline beside tabs, desktop only */}
              <div className="hidden sm:flex flex-1 items-center gap-2 flex-wrap">
                {/* Bulan */}
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className={`h-9 w-[148px] text-sm rounded-md border-2 font-medium transition-all shadow-sm ${
                    selectedMonth !== 0
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${selectedMonth !== 0 ? 'text-purple-500' : 'text-slate-400'}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tahun */}
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className={`h-9 w-[100px] text-sm rounded-md border-2 font-medium transition-all shadow-sm ${
                    selectedYear !== currentYear
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${selectedYear !== currentYear ? 'text-blue-500' : 'text-slate-400'}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* PIC CRM - hanya di tab Existing */}
                {activeTab === "existing" && (
                  <Select value={selectedPicCrm} onValueChange={setSelectedPicCrm}>
                    <SelectTrigger className={`h-9 w-[135px] text-sm rounded-md border-2 font-medium transition-all shadow-sm ${
                      selectedPicCrm !== "All"
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className={`h-3.5 w-3.5 flex-shrink-0 ${selectedPicCrm !== "All" ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Semua PIC</SelectItem>
                      <SelectItem value="DHA">DHA</SelectItem>
                      <SelectItem value="MRC">MRC</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Cari */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${searchQuery ? 'text-orange-500' : 'text-slate-400'}`} />
                  <Input
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`h-9 w-[170px] text-sm pl-8 pr-7 rounded-md border-2 font-medium shadow-sm transition-all ${
                      searchQuery
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-700'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Harga Kontrak - hanya di tab Existing */}
                {activeTab === "existing" && (
                  <Button
                    onClick={() => setShowHargaKontrak(!showHargaKontrak)}
                    size="sm"
                    className={`h-9 rounded-md cursor-pointer font-medium shadow-sm transition-all border-2 gap-1.5 ${
                      showHargaKontrak
                        ? "border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300"
                    }`}
                    variant="outline"
                  >
                    <DollarSign className={`h-3.5 w-3.5 ${showHargaKontrak ? 'text-red-500' : 'text-slate-400'}`} />
                    {showHargaKontrak ? "Sembunyikan Harga" : "Tampilkan Harga"}
                  </Button>
                )}

                {/* Action buttons - pojok kanan */}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-md cursor-pointer border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium shadow-sm gap-1.5 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
                  >
                    {viewMode === "grid" ? (
                      <>
                        <TableIcon className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-sm">Tabel</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-sm">Grid</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (activeTab === "existing") setExistingAddTrigger(t => t + 1);
                      else setNewAddTrigger(t => t + 1);
                    }}
                    size="sm"
                    className={`h-9 rounded-md cursor-pointer font-medium shadow-md gap-1.5 transition-all ${
                      activeTab === "existing"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Kunjungan
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="existing" className="bg-purple-200 mt-4">
            <ExistingClientView />
          </TabsContent>

          <TabsContent value="new" className="bg-purple-200 mt-4">
            <NewClientView />
          </TabsContent>
        </Tabs>
      </div>
    </FilterContext.Provider>
  );
}
