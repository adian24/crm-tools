'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, MapPin, Calendar, Clock, CheckCircle, AlertCircle, Edit, Trash2, Eye, Users, Target, ChevronLeft, ChevronRight, Sun, Moon, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

interface TargetData {
  id?: string;
  client: string;
  address: string;
  pic: string;
  picName: string;
  scheduleVisit: string;
  statusClient: 'LANJUT' | 'LOSS' | 'SUSPEND';
  nilaiKontrak: number;
  statusKunjungan: 'TO_DO' | 'VISITED';
  contactPerson?: string;
  contactPhone?: string;
  location: string;
  photoUrl?: string;
  salesAmount?: number;
  notes?: string;
  visitTime?: string;
  created_by?: string;
}

interface VisitTask {
  id: string;
  clientName: string;
  date: string;
  time: string;
  location: string;
  status: 'completed' | 'pending';
  notes?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

interface CalendarDay {
  date: Date;
  tasks: VisitTask[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

type UserRole = 'super_admin' | 'manager' | 'staff';

interface User {
  role: UserRole;
  name: string;
  staffId?: string;
  _id?: string;
}

const mockVisitTasks: VisitTask[] = [
  {
    id: '1',
    clientName: 'PT. Digital Indonesia',
    date: '2025-12-01',
    time: '09:00',
    location: 'Jl. Sudirman No. 123, Jakarta Pusat',
    status: 'completed', // VISITED
    notes: 'Kick off meeting Q4 2025',
    contactPerson: 'Ricky Halim',
    phone: '0812-1111-2222',
    email: 'ricky@digitalindonesia.com',
    photoUrl: '/images/visit.jpeg'
  },
  {
    id: '2',
    clientName: 'CV. Teknologi Maju',
    date: '2025-12-02',
    time: '13:30',
    location: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
    status: 'completed', // VISITED
    notes: 'Diskusi implementasi sistem',
    contactPerson: 'Andi Wijaya',
    phone: '0813-3333-4444',
    email: 'andi@teknologimaju.com'
  },
  {
    id: '3',
    clientName: 'PT. Global Solution',
    date: '2025-12-03',
    time: '10:00',
    location: 'Jl. MH Thamrin No. 789, Jakarta Utara',
    status: 'completed', // VISITED
    notes: 'Presentasi solusi enterprise',
    contactPerson: 'Michael Chen',
    phone: '0814-5555-6666',
    email: 'michael@globalsolution.com',
    photoUrl: '/images/visit.jpeg'
  },
  {
    id: '4',
    clientName: 'CV. Sukses Abadi',
    date: '2025-12-04',
    time: '14:30',
    location: 'Ruko Golden Boulevard, Tangerang',
    status: 'pending', // TO_DO
    notes: 'Meeting perkenalan produk',
    contactPerson: 'Lisa Permatasari',
    phone: '0815-7777-8888',
    email: 'lisa@suksesabadi.com'
  },
  {
    id: '5',
    clientName: 'PT. Fortune Nusantara',
    date: '2025-12-05',
    time: '11:00',
    location: 'Jl. Thamrin No. 1, Jakarta Pusat',
    status: 'completed', // VISITED
    notes: 'Negosiasi kontrak tahunan',
    contactPerson: 'David Kusuma',
    phone: '0816-9999-0000',
    email: 'david@fortunenusantara.com'
  },
  {
    id: '6',
    clientName: 'CV. Cahaya Baru',
    date: '2025-12-08',
    time: '09:30',
    location: 'Kawasan Industri Bekasi',
    status: 'completed', // VISITED
    notes: 'Deal berhasil - Paket Premium',
    contactPerson: 'Siti Rahayu',
    phone: '0817-1111-2222',
    email: 'siti@cahayabaru.com'
  },
  {
    id: '7',
    clientName: 'PT. Mitra Sejahtera',
    date: '2025-12-10',
    time: '15:00',
    location: 'Jl. Pajajaran No. 23, Bogor',
    status: 'completed', // VISITED
    notes: 'Finalisasi kerjasama',
    contactPerson: 'Budi Santoso',
    phone: '0818-3333-4444',
    email: 'budi@mitrasejahtera.com'
  },
  {
    id: '8',
    clientName: 'CV. Karya Mandiri',
    date: '2025-12-11',
    time: '13:00',
    location: 'BSD City, Tangerang Selatan',
    status: 'pending', // TO_DO
    notes: 'Survey lokasi proyek',
    contactPerson: 'Eko Prasetyo',
    phone: '0819-5555-6666',
    email: 'eko@karyamandiri.com'
  },
  {
    id: '9',
    clientName: 'PT. Investama Global',
    date: '2025-12-12',
    time: '10:30',
    location: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    status: 'completed', // VISITED
    notes: 'Presentasi portfolio',
    contactPerson: 'Ahmad Fauzi',
    phone: '0820-7777-8888',
    email: 'ahmad@investamaglobal.com'
  },
  {
    id: '10',
    clientName: 'CV. Berkah Jaya',
    date: '2025-12-15',
    time: '14:00',
    location: 'Jl. Margonda Raya No. 88, Depok',
    status: 'completed', // VISITED
    notes: 'Renewal kontrak tahunan',
    contactPerson: 'Rina Wijaya',
    phone: '0821-9999-0000',
    email: 'rina@berkahjaya.com'
  },
  {
    id: '11',
    clientName: 'PT. Harapan Mulia',
    date: '2025-12-16',
    time: '11:30',
    location: 'Jl. Sudirman No. 234, Jakarta Pusat',
    status: 'completed', // VISITED
    notes: 'Review kinerja Q3',
    contactPerson: 'Doni Hermawan',
    phone: '0822-1111-2222',
    email: 'doni@harapanmulia.com'
  },
  {
    id: '12',
    clientName: 'CV. Sentosa Abadi',
    date: '2025-12-17',
    time: '09:00',
    location: 'Jl. Gatot Subroto No. 567, Jakarta Selatan',
    status: 'pending', // TO_DO (changed from in_progress)
    notes: 'Meeting dengan direksi',
    contactPerson: 'Faisal Rahman',
    phone: '0823-3333-4444',
    email: 'faisal@sentosaabadi.com'
  },
  {
    id: '13',
    clientName: 'PT. Nusantara Makmur',
    date: '2025-12-18',
    time: '13:30',
    location: 'Jl. MH Thamrin No. 890, Jakarta Utara',
    status: 'pending', // TO_DO
    notes: 'Diskusi rencana 2026',
    contactPerson: 'Yudi Pratama',
    phone: '0824-5555-6666',
    email: 'yudi@nusantaramakmur.com'
  },
  {
    id: '14',
    clientName: 'CV. Jaya Perkasa',
    date: '2025-12-19',
    time: '10:00',
    location: 'Ruko Bekasi Square, Bekasi',
    status: 'pending', // TO_DO
    notes: 'Presentasi produk baru',
    contactPerson: 'Indah Permata',
    phone: '0825-7777-8888',
    email: 'indah@jayaperkasa.com'
  },
  {
    id: '15',
    clientName: 'PT. Central Vision',
    date: '2025-12-22',
    time: '14:30',
    location: 'Jl. Pajajaran No. 345, Bogor',
    status: 'pending', // TO_DO
    notes: 'Meeting stakeholder',
    contactPerson: 'Rizki Ahmad',
    phone: '0826-9999-0000',
    email: 'rizki@centralvision.com'
  }
];

export default function MyVisitsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<VisitTask[]>(mockVisitTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VisitTask | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<TargetData[]>([]);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const currentUser: User = {
          role: parsedUser.role,
          name: parsedUser.name,
          staffId: parsedUser.staffId,
          _id: parsedUser._id || parsedUser.id || 'user-' + Date.now()
        };
        setUser(currentUser);
      } else {
        const currentUser: User = {
          _id: 'user-123',
          role: 'staff',
          name: 'Guest User',
          staffId: 'STAFF001'
        };
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const currentUser: User = {
        _id: 'user-123',
        role: 'staff',
        name: 'Guest User',
        staffId: 'STAFF001'
      };
      setUser(currentUser);
    }

    const checkDarkMode = () => {
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(systemDarkMode || storedDarkMode);
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getTasksForMonth = (month: number, year: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });
  };

  const currentMonthTasks = getTasksForMonth(currentMonth, currentYear);

  const filteredTasks = currentMonthTasks.filter(task => {
    const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, -firstDay + i + 1),
        tasks: [],
        isCurrentMonth: false,
        isToday: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task => task.date === dateStr);

      days.push({
        date,
        tasks: dayTasks,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    return days;
  };

  const getStatusVariant = (status: VisitTask['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default'; // VISITED
      case 'pending': return 'outline'; // TO_DO
      default: return 'outline';
    }
  };

  const getStatusText = (status: VisitTask['status']) => {
    switch (status) {
      case 'completed': return 'Visited'; // VISITED
      case 'pending': return 'To Do'; // TO_DO
      default: return status;
    }
  };

  const handleViewDetail = (task: VisitTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kunjungan ini?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const downloadTemplate = () => {
    const currentUser = user?.name || 'Current User';
    const templateData = [
      {
        'Client': 'PT. Digital Indonesia',
        'Address': 'Jl. Sudirman No. 123, Jakarta Pusat',
        'PIC Staff': currentUser,
        'Schedule Visit': '2025-12-25',
        'Visit Time': '10:00',
        'Status Client': 'LANJUT',
        'Nilai Kontrak': 100000000,
        'Status Kunjungan': 'TO_DO',
        'Contact Person': 'Ricky Halim',
        'Contact Phone': '0812-1111-2222',
        'Location': 'Gedung Graha Kirana Lt. 7',
        'Sales Amount': 75000000,
        'Notes': `Template untuk ${currentUser} - Client berminat dengan paket enterprise`,
        'Photo URL': ''
      },
      {
        'Client': 'CV. Teknologi Maju',
        'Address': 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
        'PIC Staff': currentUser,
        'Schedule Visit': '2025-12-26',
        'Visit Time': '14:00',
        'Status Client': 'LOSS',
        'Nilai Kontrak': 50000000,
        'Status Kunjungan': 'VISITED',
        'Contact Person': 'Andi Wijaya',
        'Contact Phone': '0813-3333-4444',
        'Location': 'Ruko Sudirman Plaza',
        'Sales Amount': 0,
        'Notes': `Template untuk ${currentUser} - Client memilih competitor`,
        'Photo URL': ''
      },
      {
        'Client': 'PT. Global Solution',
        'Address': 'Jl. MH Thamrin No. 789, Jakarta Utara',
        'PIC Staff': currentUser,
        'Schedule Visit': '2025-12-27',
        'Visit Time': '15:30',
        'Status Client': 'SUSPEND',
        'Nilai Kontrak': 75000000,
        'Status Kunjungan': 'TO_DO',
        'Contact Person': 'Michael Chen',
        'Contact Phone': '0814-5555-6666',
        'Location': 'Kawasan Industri Ancol',
        'Sales Amount': 0,
        'Notes': `Template untuk ${currentUser} - Client pending keputusan`,
        'Photo URL': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Targets');

    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Template_Import_Targets.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedTargets: TargetData[] = jsonData.map((row: any, index: number) => {
          const picStaffFromExcel = row['PIC Staff'] || row['PIC'] || row['pic'] || row['Staff'] || '';
          const finalPicStaff = picStaffFromExcel.trim() ? picStaffFromExcel : (user?.name || '');

          return {
            id: `import-${Date.now()}-${index}`,
            client: row['Client'] || row['Nama Client'] || row['client'] || '',
            address: row['Address'] || row['Alamat'] || row['address'] || '',
            pic: user?._id || 'user-123',
            picName: finalPicStaff,
            scheduleVisit: validateDate(row['Schedule Visit'] || row['ScheduleVisit'] || row['Schedule'] || row['Tanggal'] || row['Date'] || row['date'] || ''),
            visitTime: validateTime(row['Visit Time'] || row['VisitTime'] || row['Waktu'] || row['Time'] || row['time'] || ''),
            statusClient: validateStatusClient(row['Status Client'] || row['StatusClient'] || row['statusClient'] || row['Status Akhir'] || row['statusClient'] || 'LANJUT'),
            nilaiKontrak: validateNumber(row['Nilai Kontrak'] || row['NilaiKontrak'] || row['nilaiKontrak'] || row['Kontrak'] || row['contract'] || 0),
            statusKunjungan: validateStatusKunjungan(row['Status Kunjungan'] || row['StatusKunjungan'] || row['statusKunjungan'] || row['Status'] || row['status'] || 'TO_DO'),
            contactPerson: row['Contact Person'] || row['ContactPerson'] || row['Contact'] || row['contactPerson'] || '',
            contactPhone: row['Contact Phone'] || row['ContactPhone'] || row['Phone'] || row['Telepon'] || row['phone'] || '',
            location: row['Location'] || row['Lokasi'] || row['location'] || row['address'] || '',
            photoUrl: row['Photo URL'] || row['PhotoURL'] || row['photoUrl'] || row['Photo'] || row['photo'] || '',
            salesAmount: validateNumber(row['Sales Amount'] || row['SalesAmount'] || row['salesAmount'] || row['Sales'] || row['sales'] || 0),
            notes: row['Notes'] || row['Catatan'] || row['notes'] || row['Keterangan'] || row['keterangan'] || '',
            created_by: user?._id || 'user-123'
          };
        }).filter(target => target.client && target.address && target.scheduleVisit);

        if (importedTargets.length === 0) {
          setImportError('Tidak ada data valid yang ditemukan dalam file Excel. Pastikan kolom Client, Address, dan Schedule Visit terisi.');
          return;
        }

        setImportPreview(importedTargets);
        setImportError('');
        setShowImportModal(true);
      } catch (error) {
        setImportError('Error membaca file Excel. Pastikan format file benar dan sesuai template.');
        console.error('Excel import error:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateDate = (date: string): string => {
    if (!date) return '';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return date;
      }
      return parsedDate.toISOString().split('T')[0];
    } catch {
      return date;
    }
  };

  const validateTime = (time: string): string | undefined => {
    if (!time) return undefined;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(time)) {
      return time;
    }
    return undefined;
  };

  const validateStatusClient = (status: string): 'LANJUT' | 'LOSS' | 'SUSPEND' => {
    const statusMap: { [key: string]: 'LANJUT' | 'LOSS' | 'SUSPEND' } = {
      'lanjut': 'LANJUT', 'LANJUT': 'LANJUT', 'continue': 'LANJUT', 'proceed': 'LANJUT',
      'loss': 'LOSS', 'LOSS': 'LOSS', 'lost': 'LOSS', 'hilang': 'LOSS',
      'suspend': 'SUSPEND', 'SUSPEND': 'SUSPEND', 'ditunda': 'SUSPEND', 'pending': 'SUSPEND'
    };
    const normalizedStatus = status?.toString().toLowerCase().trim();
    return statusMap[normalizedStatus] || 'LANJUT';
  };

  const validateStatusKunjungan = (status: string): 'TO_DO' | 'VISITED' => {
    const statusMap: { [key: string]: 'TO_DO' | 'VISITED' } = {
      'to_do': 'TO_DO', 'TO_DO': 'TO_DO', 'todo': 'TO_DO', 'to do': 'TO_DO',
      'belum': 'TO_DO', 'belum dikunjungi': 'TO_DO',
      'visited': 'VISITED', 'VISITED': 'VISITED', 'selesai': 'VISITED',
      'done': 'VISITED', 'sudah': 'VISITED', 'sudah dikunjungi': 'VISITED'
    };
    const normalizedStatus = status?.toString().toLowerCase().trim();
    return statusMap[normalizedStatus] || 'TO_DO';
  };

  const validateNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const confirmImport = () => {
    const convertedTasks: VisitTask[] = importPreview.map(target => ({
      id: target.id || `target-${Date.now()}-${Math.random()}`,
      clientName: target.client,
      date: target.scheduleVisit,
      time: target.visitTime || '09:00',
      location: target.location,
      status: target.statusKunjungan === 'VISITED' ? 'completed' : 'pending', // TO_DO = pending, VISITED = completed
      notes: target.notes,
      contactPerson: target.contactPerson,
      phone: target.contactPhone,
      email: '',
      photoUrl: target.photoUrl
    }));

    setTasks([...tasks, ...convertedTasks]);
    setShowImportModal(false);
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    console.log('Targets to import to Convex:', importPreview);
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setImportPreview([]);
    setImportError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calendarDays = generateCalendarDays();

  const displayTasks = selectedDate
    ? tasks.filter(task => task.date === selectedDate.toISOString().split('T')[0])
    : filteredTasks;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Jadwal Kunjungan</CardTitle>
                <CardDescription>Kelola jadwal kunjungan klien Anda</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role === 'super_admin' ? 'Super Admin' :
                     user.role === 'manager' ? 'Manager' : 'Staff'}
                    {user.staffId && ` • ${user.staffId}`}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button onClick={() => {}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kunjungan
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{currentMonthTasks.length}</h3>
                <p className="text-sm text-muted-foreground">Total Kunjungan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{currentMonthTasks.filter(t => t.status === 'completed').length}</h3>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{currentMonthTasks.filter(t => t.status === 'in_progress').length}</h3>
                <p className="text-sm text-muted-foreground">Berlangsung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{currentMonthTasks.filter(t => t.status === 'pending').length}</h3>
                <p className="text-sm text-muted-foreground">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1">
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {getMonthName(currentDate)}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">Kalender Kunjungan</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-4">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                    className={`
                      relative group min-h-[90px] p-2.5 rounded-xl cursor-pointer transition-all duration-200 transform
                      ${day.isCurrentMonth
                        ? 'bg-background border border-border hover:shadow-md hover:scale-[1.02] hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/20'
                        : 'opacity-25'
                      }
                      ${day.isToday
                        ? 'bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-primary/50 shadow-sm ring-2 ring-primary/20'
                        : ''
                      }
                      ${selectedDate?.toDateString() === day.date.toDateString()
                        ? 'bg-gradient-to-br from-primary/15 to-accent/30 border-2 border-primary shadow-md ring-2 ring-primary/30 scale-[1.02]'
                        : ''
                      }
                    `}
                  >
                    {/* Date Number */}
                    <div className={`text-sm font-bold mb-2 ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? 'text-primary'
                          : selectedDate?.toDateString() === day.date.toDateString()
                            ? 'text-primary'
                            : 'text-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {day.date.getDate()}
                    </div>

                    {/* Tasks Container */}
                    <div className="space-y-1.5">
                      {day.tasks.slice(0, 2).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`
                            relative text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate text-center
                            shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.05]
                            ${task.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-emerald-200/50' // VISITED
                              : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-blue-200/50' // TO_DO
                            }
                          `}
                          title={`${task.clientName} - ${getStatusText(task.status)}`}
                        >
                          <div className="flex items-center gap-1">
                            {task.status === 'completed' && <span className="w-1 h-1 bg-white/60 rounded-full"></span>} {/* VISITED */}
                            {task.status === 'pending' && <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></span>} {/* TO_DO */}
                            <span className="truncate">{task.clientName}</span>
                          </div>
                        </div>
                      ))}
                      {day.tasks.length > 2 && (
                        <div className="text-[10px] font-medium text-center bg-gradient-to-r from-muted/80 to-muted px-2 py-0.5 rounded-md text-muted-foreground/80 shadow-sm">
                          +{day.tasks.length - 2} lagi
                        </div>
                      )}
                    </div>

                    {/* Today Indicator */}
                    {day.isToday && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm"></div>
                        <span className="text-[9px] font-bold text-primary/80">Hari Ini</span>
                      </div>
                    )}

                    {/* Hover Effect Overlay */}
                    {day.isCurrentMonth && day.tasks.length > 0 && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Date Info */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/20 rounded-xl border border-primary/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary/90">
                          {selectedDate.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-primary/80">
                            {tasks.filter(task => task.date === selectedDate.toISOString().split('T')[0]).length}
                          </span> kunjungan terjadwal
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="sr-only">Clear selection</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks List Section - Fixed height with internal scrolling */}
        <Card className="flex flex-col h-[calc(100vh-24rem)]">
          <CardHeader className="flex-shrink-0">
            <CardTitle>
              {selectedDate ? 'Detail Kunjungan' : 'Kunjungan Bulan Ini'}
            </CardTitle>
            {selectedDate && (
              <CardDescription>
                {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari nama klien..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">To Do</SelectItem>
                    <SelectItem value="completed">Visited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {displayTasks.length > 0 ? (
                  displayTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Kiri: Detail Client */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold truncate">{task.clientName}</h4>
                              <Badge variant={getStatusVariant(task.status)}>
                                {getStatusText(task.status)}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(task.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })} • {task.time} WIB
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span className="truncate">{task.location}</span>
                              </div>
                              {task.contactPerson && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    <span className="font-medium">Contact:</span> {task.contactPerson}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tengah: Foto */}
                          <div className="flex-shrink-0">
                            {task.photoUrl ? (
                              <div className="relative group cursor-pointer" onClick={() => handleViewDetail(task)}>
                                <img
                                  src={task.photoUrl}
                                  alt="Bukti kunjungan"
                                  className="w-32 h-24 object-cover rounded-lg border-2 border-muted transition-all duration-200 hover:scale-105 hover:shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-32 h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No Photo</span>
                              </div>
                            )}
                          </div>

                          {/* Kanan: Action Buttons */}
                          <div className="flex-shrink-0">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(task)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View detail</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {selectedDate ? 'Tidak ada kunjungan terjadwal' : 'Tidak ada kunjungan bulan ini'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate ? 'Pilih tanggal lain untuk melihat jadwal' : 'Mulai tambahkan kunjungan baru'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Kunjungan</DialogTitle>
                <DialogDescription>
                  Informasi lengkap mengenai kunjungan ke {selectedTask.clientName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto Bukti Kunjungan */}
                {selectedTask.photoUrl && (
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Bukti Kunjungan</p>
                          <div className="flex justify-center">
                            <img
                              src={selectedTask.photoUrl}
                              alt="Bukti kunjungan"
                              className="max-w-full max-h-96 object-contain rounded-lg border-2 border-muted shadow-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nama Klien</p>
                        <p className="font-semibold">{selectedTask.clientName}</p>
                      </div>
                      {selectedTask.contactPerson && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                          <p className="font-semibold">{selectedTask.contactPerson}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={getStatusVariant(selectedTask.status)}>
                          {getStatusText(selectedTask.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tanggal & Waktu</p>
                        <p className="font-semibold">
                          {new Date(selectedTask.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} pukul {selectedTask.time} WIB
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lokasi</p>
                        <p className="text-sm">{selectedTask.location}</p>
                      </div>
                      {selectedTask.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Catatan</p>
                          <p className="text-sm">{selectedTask.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {selectedTask.phone && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Telepon</p>
                      <p className="font-semibold">{selectedTask.phone}</p>
                    </CardContent>
                  </Card>
                )}
                {selectedTask.email && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-semibold text-sm break-all">{selectedTask.email}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Preview Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview Import Data Excel
            </DialogTitle>
            <DialogDescription>
              Periksa data yang akan diimpor. Pastikan semua data sudah benar sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          {importError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600 font-medium">❌ {importError}</p>
                <p className="text-red-500 text-sm mt-1">
                  Pastikan file Excel memiliki kolom wajib: <strong>Client</strong>, <strong>Address</strong>, <strong>Schedule Visit</strong>.<br/>
                  Kolom opsional: PIC Staff, Visit Time, Status Client, Nilai Kontrak, Status Kunjungan, Contact Person, Contact Phone, Location, Sales Amount, Notes, Photo URL
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 font-medium">
                  📊 Ditemukan <span className="font-bold">{importPreview.length}</span> data kunjungan yang akan diimpor
                </p>
              </div>

              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 border-b">Client</th>
                      <th className="text-left p-3 border-b">PIC Staff</th>
                      <th className="text-left p-3 border-b">Schedule Visit</th>
                      <th className="text-left p-3 border-b">Status Client</th>
                      <th className="text-left p-3 border-b">Status Kunjungan</th>
                      <th className="text-left p-3 border-b">Nilai Kontrak</th>
                      <th className="text-left p-3 border-b">Contact Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((target, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-3 border-b font-medium max-w-xs truncate">{target.client}</td>
                        <td className="p-3 border-b">{target.picName}</td>
                        <td className="p-3 border-b">{target.scheduleVisit}</td>
                        <td className="p-3 border-b">
                          <Badge variant={target.statusClient === 'LANJUT' ? 'default' : target.statusClient === 'LOSS' ? 'destructive' : 'secondary'}>
                            {target.statusClient}
                          </Badge>
                        </td>
                        <td className="p-3 border-b">
                          <Badge variant={target.statusKunjungan === 'VISITED' ? 'default' : 'outline'}>
                            {target.statusKunjungan}
                          </Badge>
                        </td>
                        <td className="p-3 border-b">Rp {target.nilaiKontrak.toLocaleString('id-ID')}</td>
                        <td className="p-3 border-b text-sm max-w-xs truncate">{target.contactPerson || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={cancelImport}>
                  Batal
                </Button>
                <Button onClick={confirmImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {importPreview.length} Data
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}