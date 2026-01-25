"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import indonesiaData from '@/data/indonesia-provinsi-kota.json';
import masterSalesData from '@/data/master-sales.json';
import { ChartCardCrmData } from '@/components/chart-card-crm-data';

interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun?: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi?: string;
  eaCode?: string;
  std?: string;
  iaDate?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: number;
  bulanTtdNotif?: string;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  cashback?: number;
  terminPembayaran?: string;
  statusSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  createdAt: number;
  updatedAt: number;
}

// Helper functions to normalize provinsi and kota for flexible matching
const normalizeProvinsi = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove special chars
    .replace(/\bdki\b/g, 'dki')
    .replace(/\bd\.k\.i\./g, 'dki');
};

const normalizeKota = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/^kota\s+/i, '') // remove "Kota " prefix
    .replace(/^kabupaten\s+/i, '') // remove "Kabupaten " prefix
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // remove special chars
};

export default function CrmDataManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPicCrm, setFilterPicCrm] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedChartType, setSelectedChartType] = useState<string>('area');

  // Comprehensive Filters
  const [expandedFilterSections, setExpandedFilterSections] = useState<string[]>(['date', 'details']);
  const currentYear = new Date().getFullYear().toString();
  const [filterTahun, setFilterTahun] = useState<string>(currentYear);
  const [filterFromBulanExp, setFilterFromBulanExp] = useState<string>('all');
  const [filterToBulanExp, setFilterToBulanExp] = useState<string>('all');
  const [filterAlasan, setFilterAlasan] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProvinsi, setFilterProvinsi] = useState<string>('all');
  const [filterKota, setFilterKota] = useState<string>('all');
  const [filterStandar, setFilterStandar] = useState<string>('all');
  const [filterAkreditasi, setFilterAkreditasi] = useState<string>('all');
  const [filterEaCode, setFilterEaCode] = useState<string>('');
  const [filterTahapAudit, setFilterTahapAudit] = useState<string>('all');
  const [filterFromBulanTTD, setFilterFromBulanTTD] = useState<string>('all');
  const [filterToBulanTTD, setFilterToBulanTTD] = useState<string>('all');
  const [filterStatusSertifikat, setFilterStatusSertifikat] = useState<string>('all');
  const [filterTermin, setFilterTermin] = useState<string>('all');
  const [filterTipeProduk, setFilterTipeProduk] = useState<string>('all');
  const [filterPicSales, setFilterPicSales] = useState<string>('all');
  const [filterFromKunjungan, setFilterFromKunjungan] = useState<string>('all');
  const [filterToKunjungan, setFilterToKunjungan] = useState<string>('all');
  const [filterStatusKunjungan, setFilterStatusKunjungan] = useState<string>('all');

  // Fetch CRM targets
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const allUsers = useQuery(api.auth.getAllUsers);
  const staffUsers = allUsers?.filter(user => user.role === 'staff') || [];

  // Filter options - Dynamic from crmTargets data
  const tahunOptions = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
  const bulanOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];
  const alasanOptions = [...new Set(crmTargets?.map(t => t.alasan).filter(Boolean) || [])].sort() as string[];
  const standarOptions = [...new Set(crmTargets?.map(t => t.std).filter(Boolean) || [])].sort() as string[];

  // Get unique produk values for Tipe Produk filter
  const produkOptions = [...new Set(crmTargets?.map(t => t.produk).filter(Boolean) || [])].sort() as string[];

  // Get sales options from master-sales.json
  const salesOptions = masterSalesData.map((sales: any) => sales.nama).sort();

  // Get provinsi options from Indonesia data
  const provinsiOptions = Object.keys(indonesiaData).sort();

  // Get unique provinsi values from actual data (for debugging)
  const provinsiFromData = [...new Set(crmTargets?.map(t => t.provinsi).filter(Boolean) || [])].sort();
  console.log('Provinsi from JSON (first 5):', provinsiOptions.slice(0, 5));
  console.log('Provinsi from Data (first 5):', provinsiFromData.slice(0, 5));
  console.log('Sample data provinsi values:', crmTargets?.slice(0, 3).map(t => ({ provinsi: t.provinsi, kota: t.kota })));

  // Get kota options based on selected provinsi from Indonesia data
  const kotaOptions = filterProvinsi !== 'all' && (indonesiaData as any)[filterProvinsi]
    ? [...new Set((indonesiaData as any)[filterProvinsi].kabupaten_kota)].sort() as string[]
    : [];

  // Tahapan Audit - Default options + dynamic from data
  const defaultTahapanAudit = ['IA', 'SV1', 'SV2', 'SV3', 'SV4', 'RC'];
  const tahapanAuditFromData = [...new Set(crmTargets?.map(t => t.tahapAudit).filter(Boolean) || [])];
  const tahapanAuditOptions = [...new Set([...defaultTahapanAudit, ...tahapanAuditFromData])].sort() as string[];

  // Toggle filter section
  const toggleFilterSection = (section: string) => {
    setExpandedFilterSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterTahun(currentYear);
    setFilterFromBulanExp('all');
    setFilterToBulanExp('all');
    setFilterPicCrm('all');
    setFilterStatus('all');
    setFilterAlasan('all');
    setFilterCategory('all');
    setFilterProvinsi('all');
    setFilterKota('all');
    setFilterStandar('all');
    setFilterAkreditasi('all');
    setFilterEaCode('');
    setFilterTahapAudit('all');
    setFilterFromBulanTTD('all');
    setFilterToBulanTTD('all');
    setFilterStatusSertifikat('all');
    setFilterTermin('all');
    setFilterTipeProduk('all');
    setFilterPicSales('all');
    setFilterFromKunjungan('all');
    setFilterToKunjungan('all');
    setFilterStatusKunjungan('all');
    setSearchTerm('');
  };

  // Filter and search
  const filteredTargets = crmTargets?.filter(target => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      target.namaPerusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.sales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.picCrm.toLowerCase().includes(searchTerm.toLowerCase());

    // Date section filters
    const matchesTahun = filterTahun === 'all' || target.tahun === filterTahun;

    let matchesBulanExp = true;
    if (filterFromBulanExp !== 'all' || filterToBulanExp !== 'all') {
      // Mapping bulan nama ke angka
      const bulanNameToNum: { [key: string]: number } = {
        'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
        'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };

      // Coba parse sebagai angka dulu, lalu sebagai nama bulan
      let bulanExpNum = 0;
      const bulanExpLower = (target.bulanExpDate || '').toLowerCase().trim();

      if (bulanExpLower) {
        // Cek apakah angka
        const parsedNum = parseInt(bulanExpLower);
        if (!isNaN(parsedNum)) {
          bulanExpNum = parsedNum;
        } else if (bulanNameToNum[bulanExpLower]) {
          // Jika nama bulan
          bulanExpNum = bulanNameToNum[bulanExpLower];
        }
      }

      const fromMonth = filterFromBulanExp !== 'all' ? parseInt(filterFromBulanExp) : 1;
      const toMonth = filterToBulanExp !== 'all' ? parseInt(filterToBulanExp) : 12;

      matchesBulanExp = bulanExpNum > 0 && bulanExpNum >= fromMonth && bulanExpNum <= toMonth;
    }

    // Details section filters
    const matchesPicCrm = filterPicCrm === 'all' || target.picCrm === filterPicCrm;
    const matchesPicSales = filterPicSales === 'all' || target.sales === filterPicSales;
    const matchesStatus = filterStatus === 'all' || target.status === filterStatus;
    const matchesAlasan = filterAlasan === 'all' || target.alasan === filterAlasan;
    const matchesCategory = filterCategory === 'all' || target.category === filterCategory;

    // Provinsi filter - case insensitive with flexible matching
    const matchesProvinsi = filterProvinsi === 'all' ||
      (target.provinsi && normalizeProvinsi(target.provinsi) === normalizeProvinsi(filterProvinsi));

    // Kota filter - case insensitive with flexible matching
    const matchesKota = filterKota === 'all' ||
      (target.kota && normalizeKota(target.kota) === normalizeKota(filterKota));

    // Sertifikat section filters
    const matchesStandar = filterStandar === 'all' || target.std === filterStandar;
    const matchesAkreditasi = filterAkreditasi === 'all' || target.akreditasi === filterAkreditasi;
    const matchesEaCode = filterEaCode === '' || (target.eaCode || '').toLowerCase().includes(filterEaCode.toLowerCase());
    const matchesTahapAudit = filterTahapAudit === 'all' || target.tahapAudit === filterTahapAudit;
    const matchesStatusSertifikat = filterStatusSertifikat === 'all' || target.statusSertifikat === filterStatusSertifikat;
    const matchesTermin = filterTermin === 'all' || target.terminPembayaran === filterTermin;

    // Tipe Produk filter
    let matchesTipeProduk = true;
    if (filterTipeProduk !== 'all') {
      const produkUpper = (target.produk || '').toUpperCase();
      if (filterTipeProduk === 'XMS') {
        matchesTipeProduk = produkUpper.includes('ISO');
      } else if (filterTipeProduk === 'SUSTAIN') {
        matchesTipeProduk = produkUpper.includes('ISPO');
      }
    }

    let matchesBulanTTD = true;
    if (filterFromBulanTTD !== 'all' || filterToBulanTTD !== 'all') {
      const ttdDate = target.bulanTtdNotif;
      if (ttdDate) {
        const ttdMonth = new Date(ttdDate).getMonth() + 1;
        const fromMonth = filterFromBulanTTD !== 'all' ? parseInt(filterFromBulanTTD) : 1;
        const toMonth = filterToBulanTTD !== 'all' ? parseInt(filterToBulanTTD) : 12;
        matchesBulanTTD = ttdMonth >= fromMonth && ttdMonth <= toMonth;
      } else {
        matchesBulanTTD = false;
      }
    }

    // Jadwal Kunjungan section filters
    let matchesKunjungan = true;
    if (filterFromKunjungan !== 'all' || filterToKunjungan !== 'all') {
      const visitDate = target.tanggalKunjungan;
      if (visitDate) {
        const visitMonth = new Date(visitDate).getMonth() + 1;
        const fromMonth = filterFromKunjungan !== 'all' ? parseInt(filterFromKunjungan) : 1;
        const toMonth = filterToKunjungan !== 'all' ? parseInt(filterToKunjungan) : 12;
        matchesKunjungan = visitMonth >= fromMonth && visitMonth <= toMonth;
      } else {
        matchesKunjungan = false;
      }
    }
    const matchesStatusKunjungan = filterStatusKunjungan === 'all' || target.statusKunjungan === filterStatusKunjungan;

    return matchesSearch && matchesTahun && matchesBulanExp && matchesPicCrm &&
           matchesPicSales && matchesStatus && matchesAlasan && matchesCategory && matchesProvinsi &&
           matchesKota && matchesStandar && matchesAkreditasi && matchesEaCode &&
           matchesTahapAudit && matchesBulanTTD && matchesStatusSertifikat &&
           matchesTermin && matchesTipeProduk && matchesKunjungan && matchesStatusKunjungan;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage);

  // Get paginated data
  const paginatedTargets = filteredTargets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const uniqueStatuses = [...new Set(crmTargets?.map(t => t.status) || [])].sort();
  const uniquePicCrms = [...new Set(crmTargets?.map(t => t.picCrm) || [])].sort();

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'default';
      case 'LANJUT':
        return 'secondary';
      case 'LOSS':
        return 'destructive';
      case 'SUSPEND':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string): string => {
    const statusUpper = status?.toUpperCase() || '';

    switch (statusUpper) {
      case 'PROSES':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'LANJUT':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'LOSS':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'SUSPEND':
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
      case 'WAITING':
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
      case 'DONE':
        return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Helper function to get category badge style
  const getCategoryBadgeStyle = (category: string): string => {
    const categoryUpper = category?.toUpperCase() || '';

    switch (categoryUpper) {
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-yellow-500 font-semibold shadow-sm';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-white border-gray-400 font-semibold shadow-sm';
      case 'BRONZE':
        return 'bg-gradient-to-r from-orange-400 to-orange-700 hover:from-orange-500 hover:to-orange-800 text-white border-orange-600 font-semibold shadow-sm';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Helper function to get status kunjungan badge style
  const getStatusKunjunganBadgeStyle = (statusKunjungan: string | undefined): string => {
    if (!statusKunjungan) return 'bg-gray-400 hover:bg-gray-500 text-white border-gray-400';

    const statusUpper = statusKunjungan?.toUpperCase() || '';

    switch (statusUpper) {
      case 'VISITED':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600 font-semibold';
      case 'NOT YET':
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  // Format date helper
  const formatDateToDayMonth = (dateString: string | undefined): string => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNamesIndo[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTanggalKunjungan = (dateString: string | undefined): string => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNamesIndo[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  if (crmTargets === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:flex-row gap-6 py-4 lg:py-8 px-4 lg:px-6">
      {/* LEFT SIDEBAR - FILTERS */}
      <div className="hidden lg:block lg:w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-7 text-xs bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Reset Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Section Date */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('date')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Date</span>
                  {expandedFilterSections.includes('date') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('date') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* Tahun */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tahun</Label>
                      <Select value={filterTahun} onValueChange={setFilterTahun}>
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="All Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tahun</SelectItem>
                          {tahunOptions.map(tahun => (
                            <SelectItem key={tahun} value={tahun}>{tahun}</SelectItem>
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
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
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
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Details */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('details')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter PIC CRM</span>
                  {expandedFilterSections.includes('details') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('details') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* PIC CRM - Button Filter */}
                    <div>
                      <Label className="mb-1.5 block text-xs">PIC CRM</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterPicCrm === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPicCrm("all")}
                          className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
                        >
                          All PIC
                        </Button>
                        {uniquePicCrms.map((pic) => (
                          <Button
                            key={pic}
                            variant={filterPicCrm === pic ? "default" : "outline"}
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

                    {/* Status - Button Filter with Colors */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterStatus === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterStatus === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All Status
                        </Button>
                        {uniqueStatuses.map((status) => {
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

                    {/* Category - Button Filter with Gradient Colors */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Category</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterCategory === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterCategory("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterCategory === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All Category
                        </Button>
                        {['GOLD', 'SILVER', 'BRONZE'].map((category) => {
                          let categoryColor = '';

                          switch (category) {
                            case 'GOLD':
                              categoryColor = 'bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-800 border-yellow-300 font-medium shadow-sm';
                              break;
                            case 'SILVER':
                              categoryColor = 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border-gray-300 font-medium shadow-sm';
                              break;
                            case 'BRONZE':
                              categoryColor = 'bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-800 border-orange-300 font-medium shadow-sm';
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
                      <Select
                        value={filterKota}
                        onValueChange={setFilterKota}
                        disabled={filterProvinsi === 'all'}
                      >
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
                  </div>
                )}
              </div>

              {/* Section PIC Sales */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('picSales')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter PIC Sales</span>
                  {expandedFilterSections.includes('picSales') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('picSales') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* PIC Sales - Button Filter */}
                    <div>
                      <Label className="mb-1.5 block text-xs">PIC Sales</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterPicSales === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPicSales("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterPicSales === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All Sales
                        </Button>
                        {salesOptions.map((sales) => (
                          <Button
                            key={sales}
                            variant={filterPicSales === sales ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterPicSales(sales)}
                            className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                              filterPicSales === sales
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0"></div>
                            {sales}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Sertifikat */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('sertifikat')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Sertifikat</span>
                  {expandedFilterSections.includes('sertifikat') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('sertifikat') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* Tipe Produk */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tipe Produk</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterTipeProduk === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterTipeProduk("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterTipeProduk === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          All
                        </Button>
                        {['XMS', 'SUSTAIN'].map((tipe) => {
                          let tipeColor = '';
                          switch (tipe) {
                            case 'XMS':
                              tipeColor = 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300';
                              break;
                            case 'SUSTAIN':
                              tipeColor = 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300';
                              break;
                          }

                          return (
                            <Button
                              key={tipe}
                              size="sm"
                              onClick={() => setFilterTipeProduk(tipe)}
                              className={`flex items-center gap-1 text-xs h-8 px-2 border cursor-pointer ${
                                filterTipeProduk === tipe
                                  ? 'bg-black hover:bg-gray-800 text-white border-black'
                                  : tipeColor
                              }`}
                            >
                              {tipe}
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
                          variant={filterAkreditasi === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterAkreditasi("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterAkreditasi === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
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

                    {/* EA CODE */}
                    <div>
                      <Label className="mb-1.5 block text-xs">EA CODE</Label>
                      <Input
                        placeholder="Search EA Code..."
                        value={filterEaCode}
                        onChange={(e) => setFilterEaCode(e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* Tahapan Audit */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Tahapan Audit</Label>
                      <Select value={filterTahapAudit} onValueChange={setFilterTahapAudit}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="All Tahapan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tahapan</SelectItem>
                          {tahapanAuditOptions.map((tahap) => (
                            <SelectItem key={tahap} value={tahap}>
                              {tahap}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* From/To Bulan TTD */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block text-xs">From Bulan TTD</Label>
                        <Select value={filterFromBulanTTD} onValueChange={setFilterFromBulanTTD}>
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="From" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">To Bulan TTD</Label>
                        <Select value={filterToBulanTTD} onValueChange={setFilterToBulanTTD}>
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Status Sertifikat */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status Sertifikat</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterStatusSertifikat === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatusSertifikat("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterStatusSertifikat === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
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

                    {/* Termin */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Termin</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterTermin === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterTermin("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterTermin === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
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
                  </div>
                )}
              </div>

              {/* Section Jadwal Kunjungan */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('jadwal')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Filter Jadwal Kunjungan</span>
                  {expandedFilterSections.includes('jadwal') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('jadwal') && (
                  <div className="p-3 space-y-3 border-t">
                    {/* From/To Kunjungan */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block text-xs">From</Label>
                        <Select value={filterFromKunjungan} onValueChange={setFilterFromKunjungan}>
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="From" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">To</Label>
                        <Select value={filterToKunjungan} onValueChange={setFilterToKunjungan}>
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {bulanOptions.map(bulan => (
                              <SelectItem key={bulan.value} value={bulan.value}>{bulan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Status Kunjungan */}
                    <div>
                      <Label className="mb-1.5 block text-xs">Status Kunjungan</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={filterStatusKunjungan === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatusKunjungan("all")}
                          className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                            filterStatusKunjungan === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MOBILE FILTERS */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Company, Sales, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                    className={`flex items-center gap-1 text-xs h-8 px-2 cursor-pointer ${
                      filterStatus === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : ""
                    }`}
                  >
                    All Status
                  </Button>
                  {uniqueStatuses.map((status) => {
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
              <div>
                <Label className="mb-2 block">PIC CRM</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterPicCrm === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPicCrm("all")}
                    className="flex items-center gap-1 text-xs h-8 px-2 cursor-pointer"
                  >
                    All PIC
                  </Button>
                  {uniquePicCrms.map((pic) => (
                    <Button
                      key={pic}
                      variant={filterPicCrm === pic ? "default" : "outline"}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">CRM Dashboard Data</h1>
            <p className="text-muted-foreground mt-1">
              {filteredTargets.length} records found
            </p>
          </div>
        </div>

        {/* Staff Performance Cards - MRC & DHA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MRC Card - Only show when filterPicCrm is 'all' or 'MRC' */}
          {(filterPicCrm === 'all' || filterPicCrm === 'MRC') && (
            <Card>
              <CardContent className="">
                {(() => {
                  // Get MRC data from crmTargets (not filteredTargets) - shows all data regardless of filters (except PIC CRM filter)
                  const mrcData = (crmTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'MRC');
                const mrcTotal = mrcData.length;
                const mrcLanjut = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const mrcLoss = mrcData.filter(t => t.status === 'LOSS').length;
                const mrcSuspend = mrcData.filter(t => t.status === 'SUSPEND').length;
                const mrcProses = mrcData.filter(t => t.status === 'PROSES').length;
                const mrcWaiting = mrcData.filter(t => t.status === 'WAITING').length;
                const mrcTotalAmount = mrcData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const mrcLanjutAmount = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const targetVisits = 100; // Sesuaikan dengan target tahunan

                  return (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left Side - Profile Photo */}
                      <div className="flex-shrink-0 flex justify-center">
                        <div className="relative">
                          <img
                            src="/images/mercy.jpeg"
                            onError={(e) => (e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=MRC")}
                            className="w-32 h-32 sm:w-60 sm:h-auto rounded-full object-cover border-2 border-background shadow-lg"
                            style={{ maxHeight: '300px' }}
                            alt="MRC"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                      </div>

                      {/* Right Side - Info & Stats */}
                      <div className="flex-1 space-y-2">
                        {/* Profile Info */}
                        <div className="text-center sm:text-left">
                          <p className="font-bold text-xl">MRC</p>
                          <p className="text-sm text-muted-foreground">PIC CRM</p>
                        </div>

                        {/* Performance Overview */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Total Nilai Kontrak</span>
                            <span className="text-sm font-bold text-primary">Rp {mrcTotalAmount.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${mrcTotalAmount > 0 ? Math.min((mrcLanjutAmount / mrcTotalAmount) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Kontrak Lanjut: Rp {mrcLanjutAmount.toLocaleString('id-ID')}</span>
                            <span>{mrcTotalAmount > 0 ? Math.round((mrcLanjutAmount / mrcTotalAmount) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance Breakdown</div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-green-600">✓ Lanjut</span>
                              <span className="font-medium">{mrcLanjut}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <span className="font-medium">{mrcLoss}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <span className="font-medium">{mrcSuspend}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <span className="font-medium">{mrcProses}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <span className="font-medium">{mrcWaiting}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-purple-600">📊 Visits</span>
                              <span className="font-medium">{mrcData.filter(t => t.tanggalKunjungan).length}/{mrcTotal}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* DHA Card - Only show when filterPicCrm is 'all' or 'DHA' */}
          {(filterPicCrm === 'all' || filterPicCrm === 'DHA') && (
            <Card>
              <CardContent className="">
                {(() => {
                  // Get DHA data from crmTargets (not filteredTargets) - shows all data regardless of filters (except PIC CRM filter)
                  const dhaData = (crmTargets || []).filter(t => (t.picCrm || '').toUpperCase() === 'DHA');
                const dhaTotal = dhaData.length;
                const dhaLanjut = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const dhaLoss = dhaData.filter(t => t.status === 'LOSS').length;
                const dhaSuspend = dhaData.filter(t => t.status === 'SUSPEND').length;
                const dhaProses = dhaData.filter(t => t.status === 'PROSES').length;
                const dhaWaiting = dhaData.filter(t => t.status === 'WAITING').length;
                const dhaTotalAmount = dhaData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const dhaLanjutAmount = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const targetVisits = 100; // Sesuaikan dengan target tahunan

                  return (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left Side - Profile Photo */}
                      <div className="flex-shrink-0 flex justify-center">
                        <div className="relative">
                          <img
                            src="/images/dhea.jpeg"
                            onError={(e) => (e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=DHA")}
                            className="w-32 h-32 sm:w-60 sm:h-auto rounded-full object-cover border-2 border-background shadow-lg"
                            style={{ maxHeight: '300px' }}
                            alt="DHA"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                      </div>

                      {/* Right Side - Info & Stats */}
                      <div className="flex-1 space-y-2">
                        {/* Profile Info */}
                        <div className="text-center sm:text-left">
                          <p className="font-bold text-xl">DHA</p>
                          <p className="text-sm text-muted-foreground">PIC CRM</p>
                        </div>

                        {/* Performance Overview */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Total Nilai Kontrak</span>
                            <span className="text-sm font-bold text-primary">Rp {dhaTotalAmount.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${dhaTotalAmount > 0 ? Math.min((dhaLanjutAmount / dhaTotalAmount) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Kontrak Lanjut: Rp {dhaLanjutAmount.toLocaleString('id-ID')}</span>
                            <span>{dhaTotalAmount > 0 ? Math.round((dhaLanjutAmount / dhaTotalAmount) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance Breakdown</div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-green-600">✓ Lanjut</span>
                              <span className="font-medium">{dhaLanjut}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-600">✗ Loss</span>
                              <span className="font-medium">{dhaLoss}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600">⏸ Suspend</span>
                              <span className="font-medium">{dhaSuspend}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600">⏸ Proses</span>
                              <span className="font-medium">{dhaProses}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⏳ Waiting</span>
                              <span className="font-medium">{dhaWaiting}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-purple-600">📊 Visits</span>
                              <span className="font-medium">{dhaData.filter(t => t.tanggalKunjungan).length}/{dhaTotal}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Section - Lanjut, Loss, Suspend, Proses, Waiting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                CRM Status Analytics (Contract Base)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filterStatus === 'all'
                  ? 'Visualisasi data berdasarkan harga kontrak dengan semua status'
                  : `Visualisasi data berdasarkan harga kontrak dengan status ${filterStatus?.toUpperCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chart Type:</span>
              <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show all 5 charts when filterStatus is 'all', otherwise show only selected status chart */}
          {filterStatus === 'all' ? (
            <div className="space-y-4">
              {/* First row: LANJUT, LOSS, SUSPEND */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Lanjut Chart */}
                <ChartCardCrmData
                  title="Status - LANJUT"
                  data={filteredTargets.filter(t => t.status === 'LANJUT' || t.status === 'DONE')}
                  statusColor="green"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Loss Chart */}
                <ChartCardCrmData
                  title="Status - LOSS"
                  data={filteredTargets.filter(t => t.status === 'LOSS')}
                  statusColor="red"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Suspend Chart */}
                <ChartCardCrmData
                  title="Status - SUSPEND"
                  data={filteredTargets.filter(t => t.status === 'SUSPEND')}
                  statusColor="orange"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />
              </div>

              {/* Second row: PROSES, WAITING */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {/* Proses Chart */}
                <ChartCardCrmData
                  title="Status - PROSES"
                  data={filteredTargets.filter(t => t.status === 'PROSES')}
                  statusColor="blue"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />

                {/* Waiting Chart */}
                <ChartCardCrmData
                  title="Status - WAITING"
                  data={filteredTargets.filter(t => t.status === 'WAITING')}
                  statusColor="gray"
                  chartType={selectedChartType}
                  filterTahun={filterTahun}
                  filterPicCrm={filterPicCrm}
                  filterProvinsi={filterProvinsi}
                  filterKota={filterKota}
                />
              </div>
            </div>
          ) : (
            /* Show only selected status chart with full width */
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              <ChartCardCrmData
                title={`Status - ${filterStatus?.toUpperCase()}`}
                data={filteredTargets.filter(t => {
                  const statusUpper = filterStatus?.toUpperCase() || '';
                  return t.status === statusUpper || (statusUpper === 'LANJUT' && t.status === 'DONE');
                })}
                statusColor={
                  filterStatus?.toUpperCase() === 'LANJUT' ? 'green' :
                  filterStatus?.toUpperCase() === 'LOSS' ? 'red' :
                  filterStatus?.toUpperCase() === 'SUSPEND' ? 'orange' : 'blue'
                }
                chartType={selectedChartType}
                filterTahun={filterTahun}
                filterPicCrm={filterPicCrm}
                filterProvinsi={filterProvinsi}
                filterKota={filterKota}
                isFullWidth={true}
              />
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          {/* Header - Title & Search */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Detail Perusahaan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredTargets.length} records
                </p>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Company, Sales, PIC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 hidden md:table-cell sticky left-0 bg-white z-10">No</TableHead>
                    <TableHead className="hidden md:table-cell sticky left-[1.7rem] bg-white z-10 border-r border-border min-w-[200px]">Company</TableHead>
                    <TableHead className="md:hidden">No</TableHead>
                    <TableHead className="md:hidden">Company</TableHead>
                    <TableHead>Bulan Exp</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>PIC CRM</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Nama Associate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Provinsi</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Akreditasi</TableHead>
                    <TableHead>EA Code</TableHead>
                    <TableHead>STD</TableHead>
                    <TableHead>IA Date</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Tahap Audit</TableHead>
                    <TableHead>Harga Kontrak</TableHead>
                    <TableHead>Bulan TTD</TableHead>
                    <TableHead>Harga Update</TableHead>
                    <TableHead>Trimming</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Cashback</TableHead>
                    <TableHead>Termin</TableHead>
                    <TableHead>Status Sertifikat</TableHead>
                    <TableHead>Tgl Kunjungan</TableHead>
                    <TableHead>Status Kunjungan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTargets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={29} className="text-center py-8">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTargets.map((target, index) => (
                      <TableRow
                        key={target._id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium hidden md:table-cell sticky left-0 bg-white z-10 border-border">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium hidden md:table-cell sticky left-[1.7rem] bg-white z-10 border-r border-border min-w-[200px]">{target.namaPerusahaan}</TableCell>
                        <TableCell className="md:hidden font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="md:hidden font-medium">{target.namaPerusahaan}</TableCell>
                        <TableCell>{target.bulanExpDate || '-'}</TableCell>
                        <TableCell>{target.produk || '-'}</TableCell>
                        <TableCell>{target.picCrm}</TableCell>
                        <TableCell>{target.sales}</TableCell>
                        <TableCell>{target.namaAssociate || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(target.status)}
                            className={getStatusBadgeColor(target.status)}
                          >
                            {target.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{target.alasan || '-'}</TableCell>
                        <TableCell>
                          {target.category ? (
                            <Badge
                              variant="outline"
                              className={getCategoryBadgeStyle(target.category)}
                            >
                              {target.category}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{target.provinsi || '-'}</TableCell>
                        <TableCell>{target.kota || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={target.alamat}>{target.alamat || '-'}</TableCell>
                        <TableCell>{target.akreditasi || '-'}</TableCell>
                        <TableCell>{target.eaCode || '-'}</TableCell>
                        <TableCell>{target.std || '-'}</TableCell>
                        <TableCell>{target.iaDate || '-'}</TableCell>
                        <TableCell>{target.expDate || '-'}</TableCell>
                        <TableCell>{target.tahapAudit || '-'}</TableCell>
                        <TableCell>
                          {target.hargaKontrak ? `Rp ${target.hargaKontrak.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell title={target.bulanTtdNotif || ''}>
                          {formatDateToDayMonth(target.bulanTtdNotif)}
                        </TableCell>
                        <TableCell>
                          {target.hargaTerupdate ? `Rp ${target.hargaTerupdate.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.trimmingValue ? `Rp ${target.trimmingValue.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.lossValue ? `Rp ${target.lossValue.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {target.cashback ? `Rp ${target.cashback.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell>{target.terminPembayaran || '-'}</TableCell>
                        <TableCell>{target.statusSertifikat || '-'}</TableCell>
                        <TableCell>{formatTanggalKunjungan(target.tanggalKunjungan)}</TableCell>
                        <TableCell>
                          {target.statusKunjungan ? (
                            <Badge
                              variant="outline"
                              className={getStatusKunjunganBadgeStyle(target.statusKunjungan)}
                            >
                              {target.statusKunjungan}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTargets.length)} of {filteredTargets.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
