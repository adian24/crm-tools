"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { format, parseISO, isPast, isToday, isFuture, startOfMonth, endOfMonth } from "date-fns"
import { id } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { IconCalendar, IconMapPin, IconPhone, IconBuilding, IconSearch, IconFilter, IconCheck, IconX, IconClock, IconCalendarTime, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface CrmTarget {
  _id: Id<"crmTargets">
  tahun: string
  bulanExpDate: string
  produk: string
  picCrm: string
  sales: string
  namaAssociate: string
  namaPerusahaan: string
  status: string
  alasan?: string
  category?: string
  provinsi: string
  kota: string
  alamat: string
  tanggalKunjungan?: string
  statusKunjungan?: string
  catatanKunjungan?: string
  fotoBuktiKunjungan?: string
  akreditasi?: string
  std?: string
  eaCode?: string
  iaDate?: string
  expDate?: string
  tahapAudit?: string
  hargaKontrak?: number
  bulanTtdNotif?: string
  hargaTerupdate?: number
  trimmingValue?: number
  lossValue?: number
  cashback?: number
  terminPembayaran?: string
  statusSertifikat?: string
  createdAt: number
  updatedAt: number
}

interface CalendarDay {
  date: Date
  tasks: CrmTarget[]
  isCurrentMonth: boolean
  isToday: boolean
}

export default function DashboardKunjunganPage() {
  const crmTargets = useQuery(api.crmTargets.list) || []
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Filter states
  const [filterPic, setFilterPic] = React.useState<string>("all")
  const [filterSales, setFilterSales] = React.useState<string>("all")
  const [filterStatusKunjungan, setFilterStatusKunjungan] = React.useState<string>("all")
  const [filterMonth, setFilterMonth] = React.useState<string>(format(new Date(), "yyyy-MM"))
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [tableSearchQuery, setTableSearchQuery] = React.useState<string>("")
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = React.useState<CrmTarget | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

  // Form states
  const [editTanggal, setEditTanggal] = React.useState<string>("")
  const [editStatus, setEditStatus] = React.useState<string>("")
  const [editCatatan, setEditCatatan] = React.useState<string>("")
  const [editFoto, setEditFoto] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  // Mutations
  const updateCrmTarget = useMutation(api.crmTargets.updateCrmTarget)

  // Get unique values for filters
  const picList = React.useMemo(() => {
    const pics = new Set(crmTargets.map(t => t.picCrm))
    return Array.from(pics).sort()
  }, [crmTargets])

  const salesList = React.useMemo(() => {
    const sales = new Set(crmTargets.map(t => t.sales))
    return Array.from(sales).sort()
  }, [crmTargets])

  const companyList = React.useMemo(() => {
    const companies = new Set(crmTargets.map(t => t.namaPerusahaan))
    return Array.from(companies).sort()
  }, [crmTargets])

  // Filter data
  const filteredData = React.useMemo(() => {
    console.log('🔍 Filter Month:', filterMonth)
    console.log('📊 Total CRM Targets:', crmTargets.length)
    console.log('✅ VISITED Count:', crmTargets.filter(t => t.statusKunjungan === 'VISITED').length)

    return crmTargets.filter(target => {
      // Filter by PIC CRM
      if (filterPic !== "all" && target.picCrm !== filterPic) return false

      // Filter by Sales
      if (filterSales !== "all" && target.sales !== filterSales) return false

      // Filter by Status Kunjungan
      if (filterStatusKunjungan !== "all") {
        if (filterStatusKunjungan === "visited" && target.statusKunjungan !== "VISITED") return false
        if (filterStatusKunjungan === "not_yet" && target.statusKunjungan !== "NOT YET") return false
        if (filterStatusKunjungan === "not_scheduled" && target.tanggalKunjungan) return false
      }

      // Filter by month - ONLY if there's a tanggalKunjungan
      if (target.tanggalKunjungan) {
        const visitDate = parseISO(target.tanggalKunjungan)
        const targetMonth = format(visitDate, "yyyy-MM")
        if (targetMonth !== filterMonth) {
          console.log(`❌ Filtered out ${target.namaPerusahaan}: visit month ${targetMonth} != filter ${filterMonth}`)
          return false
        }
      }
      // Don't filter out items without tanggalKunjungan unless explicitly filtering for "not_scheduled"

      // Search query (from sidebar)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          target.namaPerusahaan?.toLowerCase().includes(query) ||
          target.namaAssociate?.toLowerCase().includes(query) ||
          target.kota?.toLowerCase().includes(query) ||
          target.provinsi?.toLowerCase().includes(query) ||
          target.produk?.toLowerCase().includes(query)
        )
      }

      // Table search query
      if (tableSearchQuery) {
        const query = tableSearchQuery.toLowerCase()
        return (
          target.namaPerusahaan?.toLowerCase().includes(query) ||
          target.namaAssociate?.toLowerCase().includes(query) ||
          target.kota?.toLowerCase().includes(query) ||
          target.provinsi?.toLowerCase().includes(query) ||
          target.produk?.toLowerCase().includes(query) ||
          target.sales?.toLowerCase().includes(query) ||
          target.picCrm?.toLowerCase().includes(query) ||
          target.status?.toLowerCase().includes(query) ||
          target.category?.toLowerCase().includes(query)
        )
      }

      return true
    }).sort((a, b) => {
      // Sort by tanggalKunjungan
      if (!a.tanggalKunjungan) return 1
      if (!b.tanggalKunjungan) return -1
      return new Date(a.tanggalKunjungan).getTime() - new Date(b.tanggalKunjungan).getTime()
    })
  }, [crmTargets, filterPic, filterSales, filterStatusKunjungan, filterMonth, searchQuery, tableSearchQuery])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getTasksForMonth = (month: number, year: number) => {
    return filteredData.filter(target => {
      if (!target.tanggalKunjungan) return false
      const [yearStr, monthStr, dayStr] = target.tanggalKunjungan.split('-').map(Number)
      if (yearStr && monthStr && dayStr) {
        const taskDate = new Date(yearStr, monthStr - 1, dayStr)
        return taskDate.getMonth() === month && taskDate.getFullYear() === year
      }
      return false
    })
  }

  const currentMonthTasks = getTasksForMonth(currentMonth, currentYear)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const today = new Date()

    const days: CalendarDay[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, -firstDay + i + 1),
        tasks: [],
        isCurrentMonth: false,
        isToday: false
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const dayTasks = filteredData.filter(task => task.tanggalKunjungan === dateStr)

      days.push({
        date,
        tasks: dayTasks,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const displayTasks = selectedDate
    ? filteredData.filter(task => {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const selectedDateStr = `${year}-${month}-${day}`
        return task.tanggalKunjungan === selectedDateStr
      })
    : filteredData

  // Debug: log data
  React.useEffect(() => {
    console.log('📊 CRM Targets:', crmTargets.length)
    console.log('🔍 Filtered Data:', filteredData.length)
    console.log('📅 Display Tasks:', displayTasks.length)
    console.log('🗓️ Selected Date:', selectedDate)
    console.log('📆 Filter Month:', filterMonth)
  }, [crmTargets, filteredData, displayTasks, selectedDate, filterMonth])

  // Pagination
  const totalPages = Math.ceil(displayTasks.length / itemsPerPage)

  // Get paginated data
  const paginatedTargets = displayTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterPic, filterSales, filterStatusKunjungan, filterMonth, searchQuery, tableSearchQuery, selectedDate])

  const getVisitStatusBadge = (target: CrmTarget) => {
    if (!target.tanggalKunjungan) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">Not Scheduled</Badge>
    }

    if (target.statusKunjungan === "VISITED") {
      return <Badge className="bg-green-500 hover:bg-green-600">Visited</Badge>
    }

    if (target.statusKunjungan === "NOT YET") {
      const visitDate = parseISO(target.tanggalKunjungan)
      if (isPast(visitDate) && !isToday(visitDate)) {
        return <Badge variant="destructive">Overdue</Badge>
      }
      if (isToday(visitDate)) {
        return <Badge className="bg-blue-500 hover:bg-blue-600">Today</Badge>
      }
      return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">Upcoming</Badge>
    }

    return <Badge variant="outline">Unknown</Badge>
  }

  const getCategoryBadge = (category?: string) => {
    if (!category) return null

    const colors: Record<string, string> = {
      "GOLD": "bg-yellow-500 hover:bg-yellow-600 text-white",
      "SILVER": "bg-gray-400 hover:bg-gray-500 text-white",
      "BRONZE": "bg-orange-700 hover:bg-orange-800 text-white",
    }

    return (
      <Badge className={colors[category] || "bg-gray-200"}>
        {category}
      </Badge>
    )
  }

  const [expandedFilterSections, setExpandedFilterSections] = React.useState<string[]>(['date', 'picCrm', 'company', 'jadwal']);

  const toggleFilterSection = (section: string) => {
    setExpandedFilterSections(prev =>
      prev.includes(section)
        ? prev.filter((s: string) => s !== section)
        : [...prev, section]
    );
  };

  // Reset form when selected task changes
  React.useEffect(() => {
    if (selectedTask) {
      setEditTanggal(selectedTask.tanggalKunjungan || "")
      setEditStatus(selectedTask.statusKunjungan || "")
      setEditCatatan(selectedTask.catatanKunjungan || "")
      setEditFoto(selectedTask.fotoBuktiKunjungan || null)
    }
  }, [selectedTask])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // For now, we'll use a simple approach - convert to base64 and store
      // In production, you should use a proper file storage service
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        setEditFoto(base64String)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      setIsUploading(false)
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!selectedTask) return

    try {
      await updateCrmTarget({
        id: selectedTask._id,
        tanggalKunjungan: editTanggal || undefined,
        statusKunjungan: editStatus || undefined,
        catatanKunjungan: editCatatan || undefined,
        fotoBuktiKunjungan: editFoto || undefined,
      })

      // Close modal and reset form
      setIsEditModalOpen(false)
      setSelectedTask(null)
      setEditTanggal("")
      setEditStatus("")
      setEditCatatan("")
      setEditFoto(null)

      // Show success message
      alert('Kunjungan berhasil diupdate!')
    } catch (error) {
      console.error('Error updating kunjungan:', error)
      alert('Gagal mengupdate kunjungan. Silakan coba lagi.')
    }
  }

  return (
    <div className="lg:flex lg:flex-row gap-6 py-4 lg:py-8 px-4 lg:px-6 pb-20 lg:pb-8">
      {/* LEFT SIDEBAR - FILTERS */}
      <div className="hidden lg:block lg:w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Filter Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IconFilter className="h-4 w-4" />
                Filter
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
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('date') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-1">
                      <Label htmlFor="filter-month" className="text-xs">Bulan</Label>
                      <Input
                        id="filter-month"
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section PIC CRM */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('picCrm')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">PIC CRM</span>
                  {expandedFilterSections.includes('picCrm') ? (
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('picCrm') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-1">
                      <Select value={filterPic} onValueChange={setFilterPic}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Semua PIC" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua PIC</SelectItem>
                          {picList.map(pic => (
                            <SelectItem key={pic} value={pic}>{pic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Company */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFilterSection('company')}
                  className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">Company</span>
                  {expandedFilterSections.includes('company') ? (
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('company') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Perusahaan</Label>
                      <Select value={searchQuery} onValueChange={(val) => {
                        setSearchQuery(val === 'all' ? '' : val)
                      }}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Semua Perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Perusahaan</SelectItem>
                          {companyList.slice(0, 50).map(company => (
                            <SelectItem key={company} value={company}>{company}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select value={filterStatusKunjungan} onValueChange={setFilterStatusKunjungan}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="visited">Visited</SelectItem>
                          <SelectItem value="not_yet">Not Yet</SelectItem>
                          <SelectItem value="not_scheduled">Not Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <span className="font-medium text-sm">Jadwal</span>
                  {expandedFilterSections.includes('jadwal') ? (
                    <IconChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedFilterSections.includes('jadwal') && (
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Sales</Label>
                      <Select value={filterSales} onValueChange={setFilterSales}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Semua Sales" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Sales</SelectItem>
                          {salesList.map(sales => (
                            <SelectItem key={sales} value={sales}>{sales}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Search</Label>
                      <div className="relative">
                        <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Cari..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Kunjungan</h1>
          <p className="text-muted-foreground mt-2">
            Monitor dan lacak jadwal kunjungan berdasarkan data CRM Targets
          </p>
        </div>

      {/* Stats Cards - Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kunjungan Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Kunjungan</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                  {displayTasks.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {displayTasks.length} jadwal
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <IconCalendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visited Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Sudah Dikunjungi</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {displayTasks.filter(t => t.statusKunjungan === 'VISITED').length}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {displayTasks.length > 0 ? Math.round((displayTasks.filter(t => t.statusKunjungan === 'VISITED').length / displayTasks.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <IconCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Belum Dikunjungi</p>
                <p className="text-3xl font-bold text-orange-700 mt-2">
                  {displayTasks.filter(t => t.statusKunjungan === 'NOT YET').length}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {displayTasks.length > 0 ? Math.round((displayTasks.filter(t => t.statusKunjungan === 'NOT YET').length / displayTasks.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <IconClock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Not Scheduled Card */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Belum Terjadwal</p>
                <p className="text-3xl font-bold text-gray-700 mt-2">
                  {displayTasks.filter(t => !t.tanggalKunjungan).length}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {displayTasks.length > 0 ? Math.round((displayTasks.filter(t => !t.tanggalKunjungan).length / displayTasks.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-500 flex items-center justify-center">
                <IconX className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIC CRM Performance Cards - MRC & DHA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MRC Card */}
        {(filterPic === 'all' || filterPic === 'MRC') && (
          <Card>
            <CardContent className="">
              {(() => {
                const mrcData = crmTargets.filter(t => (t.picCrm || '').toUpperCase() === 'MRC');
                const mrcTotal = mrcData.length;
                const mrcLanjut = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const mrcLoss = mrcData.filter(t => t.status === 'LOSS').length;
                const mrcSuspend = mrcData.filter(t => t.status === 'SUSPEND').length;
                const mrcProses = mrcData.filter(t => t.status === 'PROSES').length;
                const mrcWaiting = mrcData.filter(t => t.status === 'WAITING').length;
                const mrcTotalAmount = mrcData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const mrcLanjutAmount = mrcData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);

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
                          <span className="text-xs text-muted-foreground">Progress Kunjungan</span>
                          <span className="text-sm font-bold text-primary">{mrcData.filter(t => t.statusKunjungan === 'VISITED').length}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((mrcData.filter(t => t.statusKunjungan === 'VISITED').length / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Total Kunjungan: {mrcData.filter(t => t.statusKunjungan === 'VISITED').length} visited</span>
                          <span>{Math.round((mrcData.filter(t => t.statusKunjungan === 'VISITED').length / 100) * 100)}%</span>
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

        {/* DHA Card */}
        {(filterPic === 'all' || filterPic === 'DHA') && (
          <Card>
            <CardContent className="">
              {(() => {
                const dhaData = crmTargets.filter(t => (t.picCrm || '').toUpperCase() === 'DHA');
                const dhaTotal = dhaData.length;
                const dhaLanjut = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').length;
                const dhaLoss = dhaData.filter(t => t.status === 'LOSS').length;
                const dhaSuspend = dhaData.filter(t => t.status === 'SUSPEND').length;
                const dhaProses = dhaData.filter(t => t.status === 'PROSES').length;
                const dhaWaiting = dhaData.filter(t => t.status === 'WAITING').length;
                const dhaTotalAmount = dhaData.reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);
                const dhaLanjutAmount = dhaData.filter(t => t.status === 'LANJUT' || t.status === 'DONE').reduce((sum, t) => sum + (t.hargaKontrak || 0), 0);

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
                          <span className="text-xs text-muted-foreground">Progress Kunjungan</span>
                          <span className="text-sm font-bold text-primary">{dhaData.filter(t => t.statusKunjungan === 'VISITED').length}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((dhaData.filter(t => t.statusKunjungan === 'VISITED').length / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Total Kunjungan: {dhaData.filter(t => t.statusKunjungan === 'VISITED').length} visited</span>
                          <span>{Math.round((dhaData.filter(t => t.statusKunjungan === 'VISITED').length / 100) * 100)}%</span>
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

      {/* Main Content - 2 Columns: Calendar | Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Calendar View */}
        <div className="lg:col-span-5">
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 p-0"
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {getMonthName(currentDate)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 p-0"
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="text-xs font-bold text-muted-foreground uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                      className={`
                        relative aspect-square p-1 rounded-md text-center cursor-pointer transition-all
                        ${day.isCurrentMonth
                          ? 'bg-background border border-border hover:bg-accent hover:shadow-sm'
                          : 'opacity-25'
                        }
                        ${day.isToday
                          ? 'bg-primary/10 border-2 border-primary'
                          : ''
                        }
                        ${selectedDate?.toDateString() === day.date.toDateString()
                          ? 'bg-primary/20 border-2 border-primary shadow-md'
                          : ''
                        }
                      `}
                    >
                      <div className={`text-xs font-bold mb-1 ${
                        day.isCurrentMonth
                          ? day.isToday || selectedDate?.toDateString() === day.date.toDateString()
                            ? 'text-primary'
                            : 'text-foreground'
                          : 'text-muted-foreground'
                      }`}>
                        {day.date.getDate()}
                      </div>

                      {/* Task indicators - Company Names */}
                      <div className="space-y-0.5">
                        {day.tasks.length > 0 ? (
                          <>
                            {day.tasks.slice(0, 2).map((task, taskIndex) => (
                              <div
                                key={taskIndex}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTask(task)
                                  setIsEditModalOpen(true)
                                }}
                                className={`
                                  text-[8px] px-1 py-0.5 rounded truncate cursor-pointer
                                  transition-all hover:shadow-sm
                                  ${
                                    task.statusKunjungan === 'VISITED'
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                      : task.statusKunjungan === 'NOT YET'
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                  }
                                `}
                                title={`${task.namaPerusahaan} - ${task.picCrm} - Click to edit`}
                              >
                                {task.namaPerusahaan.length > 15
                                  ? task.namaPerusahaan.substring(0, 15) + '...'
                                  : task.namaPerusahaan
                                }
                              </div>
                            ))}
                            {day.tasks.length > 2 && (
                              <div
                                className="text-[8px] font-medium text-center bg-primary/80 rounded text-primary-foreground cursor-pointer hover:bg-primary"
                                onClick={() => setSelectedDate(day.date)}
                                title={`${day.tasks.length} total visits - Click to see all`}
                              >
                                +{day.tasks.length - 2} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="h-3"></div>
                        )}
                      </div>

                      {/* Today indicator */}
                      {day.isToday && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Selected Date Info */}
                {selectedDate && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-primary">
                            {selectedDate.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDate(null)}
                          className="h-8 w-8 p-0"
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </div>
                      {(() => {
                        const year = selectedDate.getFullYear()
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                        const day = String(selectedDate.getDate()).padStart(2, '0')
                        const selectedDateStr = `${year}-${month}-${day}`
                        const selectedDateTasks = filteredData.filter(task => task.tanggalKunjungan === selectedDateStr)
                        const visitedCount = selectedDateTasks.filter(t => t.statusKunjungan === 'VISITED').length
                        const notYetCount = selectedDateTasks.filter(t => t.statusKunjungan === 'NOT YET').length
                        const pendingCount = selectedDateTasks.filter(t => !t.statusKunjungan).length

                        return (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-3">
                              <span>Total: {selectedDateTasks.length} kunjungan</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Visited: {visitedCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Not Yet: {notYetCount}
                              </span>
                              {pendingCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Pending: {pendingCount}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Data Table */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconBuilding className="h-5 w-5" />
                    Data Perusahaan
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedDate
                      ? `Kunjungan pada ${selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${displayTasks.length} data)`
                      : `Menampilkan ${displayTasks.length} dari ${crmTargets.length} data`
                    }
                  </CardDescription>
                </div>

                {/* Table Search Bar */}
                <div className="relative w-80">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari perusahaan, PIC, sales..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Company</TableHead>
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
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedTask(target)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{target.namaPerusahaan}</TableCell>
                          <TableCell>{target.bulanExpDate || '-'}</TableCell>
                          <TableCell>{target.produk || '-'}</TableCell>
                          <TableCell>{target.picCrm}</TableCell>
                          <TableCell>{target.sales}</TableCell>
                          <TableCell>{target.namaAssociate || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={target.status === 'PROSES' ? 'default' : target.status === 'LANJUT' ? 'default' : 'destructive'}
                              className={
                                target.status === 'PROSES' ? 'bg-blue-600 hover:bg-blue-700' :
                                target.status === 'LANJUT' ? 'bg-green-600 hover:bg-green-700' :
                                target.status === 'LOSS' ? 'bg-red-600 hover:bg-red-700' :
                                target.status === 'SUSPEND' ? 'bg-orange-500 hover:bg-orange-600' :
                                target.status === 'WAITING' ? 'bg-gray-500 hover:bg-gray-600' :
                                target.status === 'DONE' ? 'bg-purple-600 hover:bg-purple-700' :
                                'bg-gray-500 hover:bg-gray-600'
                              }
                            >
                              {target.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{target.alasan || '-'}</TableCell>
                          <TableCell>
                            {target.category ? (
                              <Badge
                                variant="outline"
                                className={target.category === 'GOLD' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-yellow-500 font-semibold shadow-sm' :
                                          target.category === 'SILVER' ? 'bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-white border-gray-400 font-semibold shadow-sm' :
                                          target.category === 'BRONZE' ? 'bg-gradient-to-r from-orange-400 to-orange-700 hover:from-orange-500 hover:to-orange-800 text-white border-orange-600 font-semibold shadow-sm' :
                                          'bg-gray-200'}
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
                            {target.bulanTtdNotif ? new Date(target.bulanTtdNotif).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
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
                          <TableCell>
                            {target.tanggalKunjungan ? (
                              <div className="flex items-center gap-1">
                                <IconCalendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {format(parseISO(target.tanggalKunjungan), "dd MMM yyyy", { locale: id })}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {target.statusKunjungan ? (
                              <Badge
                                variant="outline"
                                className={target.statusKunjungan === 'VISITED' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 font-semibold' :
                                          target.statusKunjungan === 'NOT YET' ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500' :
                                          'bg-gray-400 hover:bg-gray-500 text-white border-gray-400'}
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
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayTasks.length)} of {displayTasks.length} results
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
    </div>

    {/* Edit Modal */}
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Kunjungan</DialogTitle>
          <DialogDescription>
            Update informasi kunjungan untuk {selectedTask?.namaPerusahaan}
          </DialogDescription>
        </DialogHeader>

        {selectedTask && (
          <div className="space-y-4 py-4">
            {/* Company Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <IconBuilding className="h-4 w-4" />
                Informasi Perusahaan
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <p className="font-medium">{selectedTask.namaPerusahaan}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Associate:</span>
                  <p className="font-medium">{selectedTask.namaAssociate || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">PIC CRM:</span>
                  <p className="font-medium">{selectedTask.picCrm}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sales:</span>
                  <p className="font-medium">{selectedTask.sales}</p>
                </div>
              </div>
            </div>

            {/* Visit Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                Detail Kunjungan
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tanggal">Tanggal Kunjungan</Label>
                  <Input
                    id="edit-tanggal"
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status Kunjungan</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISITED">Visited</SelectItem>
                      <SelectItem value="NOT YET">Not Yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-foto">Foto Bukti Kunjungan</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {editFoto && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <img
                        src={editFoto}
                        alt="Preview bukti kunjungan"
                        className="max-w-xs max-h-40 object-cover rounded-lg border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditFoto(null)}
                        className="mt-1 text-xs text-red-600 hover:text-red-700"
                      >
                        Hapus foto
                      </Button>
                    </div>
                  )}
                  {isUploading && (
                    <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Catatan Kunjungan</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Tambahkan catatan kunjungan..."
                  className="min-h-[100px]"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                />
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <IconMapPin className="h-4 w-4" />
                Lokasi
              </h3>
              <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                <p><span className="text-muted-foreground">Alamat:</span> {selectedTask.alamat || '-'}</p>
                <p><span className="text-muted-foreground">Kota:</span> {selectedTask.kota || '-'}</p>
                <p><span className="text-muted-foreground">Provinsi:</span> {selectedTask.provinsi || '-'}</p>
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Informasi Kontrak</h3>
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Produk:</span>
                  <p className="font-medium">{selectedTask.produk || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={
                    selectedTask.status === 'PROSES' ? 'bg-blue-600 hover:bg-blue-700' :
                    selectedTask.status === 'LANJUT' ? 'bg-green-600 hover:bg-green-700' :
                    selectedTask.status === 'LOSS' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-gray-500 hover:bg-gray-600'
                  }>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Harga Kontrak:</span>
                  <p className="font-medium">
                    {selectedTask.hargaKontrak ? `Rp ${selectedTask.hargaKontrak.toLocaleString('id-ID')}` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bulan Exp:</span>
                  <p className="font-medium">{selectedTask.bulanExpDate || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isUploading}>
            {isUploading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  )
}
