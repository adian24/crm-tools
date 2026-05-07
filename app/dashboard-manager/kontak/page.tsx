"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  ColumnDef, ColumnFiltersState, ExpandedState, FilterFn, GroupingState,
  PaginationState, SortingState, VisibilityState, Column, Row,
  flexRender, getCoreRowModel, getExpandedRowModel, getFacetedRowModel,
  getFacetedUniqueValues, getFilteredRowModel, getGroupedRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  IconFilter, IconFilterOff, IconSearch, IconLayoutColumns,
  IconChevronDown, IconChevronRight, IconChevronsLeft, IconChevronsRight,
  IconChevronLeft, IconSelector, IconSortAscending, IconSortDescending,
  IconX, IconPlus, IconDownload,
} from "@tabler/icons-react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Phone, Mail, User, Building, Save, X, Building2, Briefcase, Copy, Check, Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon, formatPhoneForWa, buildWaMessage, renderWaPreview, formatDateId } from '@/lib/wa-utils';
import { toast } from 'sonner';
import { InfinityLoader } from '@/components/ui/infinity-loader';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CrmTarget } from '@/lib/crm-types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ContactData {
  _id: Id<"crmTargets">;
  namaPerusahaan: string;
  noTelp?: string;
  email?: string;
  namaKonsultan?: string;
  noTelpKonsultan?: string;
  emailKonsultan?: string;
  picDirect?: string;
  picCrm: string;
  provinsi: string;
  kota: string;
  createdAt: number;
  updatedAt: number;
  produk?: string;
  std?: string;
  tahapAudit?: string;
  expDate?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "kontak-table-column-visibility";

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  provinsi: false,
  email: false,
  emailKonsultan: false,
  status: false,
  bulanExpDate: false,
  expDate: false,
  std: false,
};

const GROUPABLE_COLUMNS = [
  { id: "namaPerusahaan", label: "Perusahaan" },
  { id: "picCrm", label: "PIC CRM" },
  { id: "kota", label: "Kota" },
  { id: "provinsi", label: "Provinsi" },
  { id: "namaKonsultan", label: "Konsultan" },
  { id: "picDirect", label: "PIC Direct" },
  { id: "status", label: "Status" },
  { id: "bulanExpDate", label: "Bulan Exp" },
  { id: "expDate", label: "Exp Date" },
  { id: "std", label: "Standar" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadgeColor(s: string): string {
  switch ((s ?? "").toUpperCase()) {
    case "DONE":    return "bg-green-600 text-white border-green-600";
    case "PROSES":  return "bg-blue-600 text-white border-blue-600";
    case "LANJUT":  return "bg-blue-400 text-white border-blue-400";
    case "LOSS":    return "bg-red-600 text-white border-red-600";
    case "SUSPEND": return "bg-orange-500 text-white border-orange-500";
    case "WAITING": return "bg-gray-400 text-white border-gray-400";
    default:        return "bg-gray-400 text-white border-gray-400";
  }
}

const EMPTY_SENTINEL = "__EMPTY__";

const multiSelectFilter: FilterFn<CrmTarget> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const raw = row.getValue(columnId);
  const cell = String(raw ?? "").toLowerCase().trim();
  const isEmpty = !cell || cell === "-";
  if (filterValue.includes(EMPTY_SENTINEL) && isEmpty) return true;
  const others = filterValue.filter(v => v !== EMPTY_SENTINEL).map(v => v.toLowerCase().trim());
  return others.length > 0 && others.includes(cell);
};
multiSelectFilter.autoRemove = (v: string[]) => !v?.length;

const EXCLUDED_KEYS = new Set(["_id", "createdAt", "updatedAt"]);
const globalSearchFilter: FilterFn<CrmTarget> = (row, _columnId, filterValue) => {
  const search = String(filterValue ?? "").toLowerCase().trim();
  if (!search) return true;
  return Object.entries(row.original).some(([key, val]) => {
    if (EXCLUDED_KEYS.has(key)) return false;
    return String(val ?? "").toLowerCase().includes(search);
  });
};
globalSearchFilter.autoRemove = (v: string) => !v?.trim();

// ── ColumnFilterPopover ───────────────────────────────────────────────────────
function ColumnFilterPopover({ column, title }: { column: Column<CrmTarget>; title: string }) {
  const [search, setSearch] = useState("");
  const currentFilter = (column.getFilterValue() as string[] | undefined) ?? [];
  const isActive = currentFilter.length > 0;

  const uniqueValues = useMemo(() => {
    return Array.from(column.getFacetedUniqueValues().keys())
      .map(v => String(v ?? "").trim())
      .filter((v, i, arr) => v && v !== "-" && arr.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.getFacetedUniqueValues()]);

  const displayed = search ? uniqueValues.filter(v => v.toLowerCase().includes(search.toLowerCase())) : uniqueValues;

  const toggle = (value: string) => {
    const lo = value.toLowerCase();
    const next = currentFilter.some(v => v.toLowerCase() === lo)
      ? currentFilter.filter(v => v.toLowerCase() !== lo)
      : [...currentFilter, value];
    column.setFilterValue(next.length ? next : undefined);
  };

  const toggleEmpty = () => {
    const next = currentFilter.includes(EMPTY_SENTINEL)
      ? currentFilter.filter(v => v !== EMPTY_SENTINEL)
      : [...currentFilter, EMPTY_SENTINEL];
    column.setFilterValue(next.length ? next : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative ml-1 inline-flex items-center rounded p-0.5 hover:bg-accent" onClick={e => e.stopPropagation()}>
          <IconFilter className={`h-3 w-3 ${isActive ? "text-yellow-300" : "text-white/60"}`} />
          {isActive && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white leading-none">
              {currentFilter.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3 z-[60]" align="start" onClick={e => e.stopPropagation()}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Input placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2 h-7 text-xs" />
        <ScrollArea className="h-44">
          <div className="space-y-0.5 pr-1">
            <div className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent border-b border-dashed border-muted mb-1 pb-1" onClick={toggleEmpty}>
              <Checkbox checked={currentFilter.includes(EMPTY_SENTINEL)} className="pointer-events-none h-3.5 w-3.5" />
              <span className="truncate text-xs italic text-muted-foreground">(Kosong)</span>
            </div>
            {displayed.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Tidak ada nilai</p>
            ) : displayed.map(val => {
              const checked = currentFilter.some(v => v.toLowerCase() === val.toLowerCase());
              return (
                <div key={val} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent" onClick={() => toggle(val)}>
                  <Checkbox checked={checked} className="pointer-events-none h-3.5 w-3.5" />
                  <span className="truncate text-xs">{val}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {isActive && (
          <>
            <Separator className="my-2" />
            <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-destructive hover:text-destructive"
              onClick={() => { column.setFilterValue(undefined); setSearch(""); }}>
              Reset filter ini
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── ColHead ───────────────────────────────────────────────────────────────────
function ColHead({ column, title }: { column: Column<CrmTarget>; title: string }) {
  const sortDir = column.getIsSorted();
  return (
    <div className="flex items-center gap-0.5 whitespace-nowrap select-none">
      {column.getCanSort() ? (
        <button className="flex items-center gap-1 hover:text-foreground"
          onClick={e => { e.stopPropagation(); column.getToggleSortingHandler()?.(e); }}>
          {title}
          {sortDir === "asc" ? <IconSortAscending className="h-3 w-3 text-yellow-300" />
           : sortDir === "desc" ? <IconSortDescending className="h-3 w-3 text-yellow-300" />
           : <IconSelector className="h-3 w-3 text-white/40" />}
        </button>
      ) : <span>{title}</span>}
      {column.getCanFilter() && <ColumnFilterPopover column={column} title={title} />}
    </div>
  );
}

// ── GroupByBar ────────────────────────────────────────────────────────────────
function GroupByBar({ grouping, onGroupingChange }: { grouping: string[]; onGroupingChange: (g: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const available = GROUPABLE_COLUMNS.filter(c => !grouping.includes(c.id));
  const displayed = search ? available.filter(c => c.label.toLowerCase().includes(search.toLowerCase())) : available;
  const getLabel = (id: string) => GROUPABLE_COLUMNS.find(c => c.id === id)?.label ?? id;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {grouping.map((g, i) => (
        <React.Fragment key={g}>
          {i > 0 && <span className="text-muted-foreground text-xs">›</span>}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-700 h-8 px-3 text-xs font-medium text-white">
            {getLabel(g)}
            <button onClick={() => onGroupingChange(grouping.filter(x => x !== g))} className="hover:opacity-70 cursor-pointer">
              <IconX className="h-2.5 w-2.5" />
            </button>
          </span>
        </React.Fragment>
      ))}
      {available.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 cursor-pointer">
              <IconPlus className="h-3.5 w-3.5" />Group By
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 z-50" align="start">
            <Input placeholder="Cari kolom..." value={search} onChange={e => setSearch(e.target.value)} className="mb-2 h-7 text-xs" />
            <ScrollArea className="h-40">
              <div className="space-y-0.5">
                {displayed.map(col => (
                  <button key={col.id} className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                    onClick={() => { onGroupingChange([...grouping, col.id]); setOpen(false); setSearch(""); }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
      {grouping.length > 0 && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          onClick={() => onGroupingChange([])}>
          <IconX className="h-3 w-3 mr-0.5" /> Clear
        </Button>
      )}
    </div>
  );
}

// ── WhatsAppButton ────────────────────────────────────────────────────────────
function WhatsAppButton({ phone, onClick }: { phone: string; onClick: () => void }) {
  if (!phone?.trim()) return null;
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex items-center justify-center h-5 w-5 rounded hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors cursor-pointer shrink-0"
      title="Kirim WhatsApp">
      <WhatsAppIcon className="h-3 w-3 text-green-500" />
    </button>
  );
}

// ── EditContactForm ───────────────────────────────────────────────────────────
interface EditContactFormProps {
  contact: CrmTarget;
  onSubmit: (data: Partial<CrmTarget>) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

function EditContactForm({ contact, onSubmit, onCancel, isUpdating }: EditContactFormProps) {
  const [formData, setFormData] = useState({
    noTelp: contact.noTelp || '',
    email: contact.email || '',
    namaKonsultan: contact.namaKonsultan || '',
    noTelpKonsultan: contact.noTelpKonsultan || '',
    emailKonsultan: contact.emailKonsultan || '',
    picDirect: contact.picDirect || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">Kontak Perusahaan</h3>
        </div>
        <div className="grid gap-3 pl-7">
          <div className="grid gap-2">
            <Label htmlFor="noTelp" className="text-sm font-medium">No. Telp Perusahaan</Label>
            <Input id="noTelp" value={formData.noTelp} onChange={e => setFormData({ ...formData, noTelp: e.target.value })} placeholder="Contoh: 021-12345678" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Perusahaan</Label>
            <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="info@perusahaan.com" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-semibold text-purple-900 dark:text-purple-100">Kontak Konsultan</h3>
        </div>
        <div className="grid gap-3 pl-7">
          <div className="grid gap-2">
            <Label htmlFor="namaKonsultan" className="text-sm font-medium">Nama Konsultan</Label>
            <Input id="namaKonsultan" value={formData.namaKonsultan} onChange={e => setFormData({ ...formData, namaKonsultan: e.target.value })} placeholder="Nama lengkap konsultan" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="noTelpKonsultan" className="text-sm font-medium">No. Telp Konsultan</Label>
            <Input id="noTelpKonsultan" value={formData.noTelpKonsultan} onChange={e => setFormData({ ...formData, noTelpKonsultan: e.target.value })} placeholder="08123456789" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emailKonsultan" className="text-sm font-medium">Email Konsultan</Label>
            <Input id="emailKonsultan" type="email" value={formData.emailKonsultan} onChange={e => setFormData({ ...formData, emailKonsultan: e.target.value })} placeholder="konsultan@example.com" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-lg border-2 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">PIC Direct</h3>
        </div>
        <div className="grid gap-3 pl-7">
          <div className="grid gap-2">
            <Label htmlFor="picDirect" className="text-sm font-medium">Nama PIC Direct</Label>
            <Input id="picDirect" value={formData.picDirect} onChange={e => setFormData({ ...formData, picDirect: e.target.value })} placeholder="Nama lengkap PIC Direct" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUpdating} className="cursor-pointer">
          <X className="h-4 w-4 mr-2" />Batal
        </Button>
        <Button type="submit" disabled={isUpdating} className="cursor-pointer">
          <Save className="h-4 w-4 mr-2" />{isUpdating ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KontakManagementPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // ── Convex ────────────────────────────────────────────────────────────────
  const crmTargets = useQuery(api.crmTargets.getCrmTargets);
  const updateTargetMutation = useMutation(api.crmTargets.updateCrmTarget);
  const isLoading = crmTargets === undefined;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [canEdit, setCanEdit] = React.useState(true);

  React.useEffect(() => {
    try {
      const userData = localStorage.getItem('crm_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
        setCanEdit(true);
      }
    } catch { setCanEdit(true); }
  }, []);

  const filteredCrmTargets = React.useMemo<CrmTarget[]>(() => {
    if (!crmTargets) return [];
    if (currentUser?.role === 'staff') {
      const userPicCode = currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase();
      if (userPicCode && userPicCode !== 'STAFF') {
        return (crmTargets as CrmTarget[]).filter(t => t.picCrm === userPicCode);
      }
    }
    return crmTargets as CrmTarget[];
  }, [crmTargets, currentUser]);

  // ── TanStack Table state ──────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_VISIBILITY;
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : DEFAULT_COLUMN_VISIBILITY;
    } catch { return DEFAULT_COLUMN_VISIBILITY; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // ── WA dialog ─────────────────────────────────────────────────────────────
  const [waDialog, setWaDialog] = useState<{ open: boolean; phone: string; target: CrmTarget; message: string } | null>(null);
  const [waTab, setWaTab] = useState<'preview' | 'edit'>('preview');

  const openWaDialog = useCallback((target: CrmTarget, phone: string) => {
    setWaDialog({ open: true, phone, target, message: buildWaMessage(target) });
    setWaTab('preview');
  }, []);

  // ── Edit dialog ───────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<CrmTarget | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateContact = async (data: Partial<CrmTarget>) => {
    if (!editTarget) return;
    setIsUpdating(true);
    try {
      const targets = filteredCrmTargets.filter(t => t.namaPerusahaan === editTarget.namaPerusahaan);
      let ok = 0, fail = 0;
      for (const t of targets) {
        try {
          await updateTargetMutation({
            id: t._id,
            noTelp: (data.noTelp as string)?.trim() || null,
            email: (data.email as string)?.trim() || null,
            namaKonsultan: (data.namaKonsultan as string)?.trim() || null,
            noTelpKonsultan: (data.noTelpKonsultan as string)?.trim() || null,
            emailKonsultan: (data.emailKonsultan as string)?.trim() || null,
            picDirect: (data.picDirect as string)?.trim() || null,
          });
          ok++;
        } catch { fail++; }
      }
      if (ok > 0) { toast.success(`✅ Berhasil update ${ok} data!`); setIsEditOpen(false); setEditTarget(null); }
      if (fail > 0) toast.error(`⚠️ ${fail} data gagal diupdate`);
    } catch { toast.error('❌ Error update'); }
    finally { setIsUpdating(false); }
  };

  // ── Upload dialog ─────────────────────────────────────────────────────────
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [skippedRowsCount, setSkippedRowsCount] = useState(0);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`✅ ${label} berhasil disalin!`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch { toast.error('❌ Gagal menyalin'); }
  };

  const handleDownloadTemplate = async () => {
    try {
      toast.loading('📥 Mengunduh template...', { id: 'dl-tpl' });
      const response = await fetch('/api/download-template?type=kontak');
      if (!response.ok) throw new Error('Gagal');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `template-import-kontak-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('✅ Template berhasil diunduh!', { id: 'dl-tpl' });
    } catch { toast.error('❌ Gagal mengunduh template', { id: 'dl-tpl' }); }
  };

  const parseExcelFile = async (file: File) => {
    setIsParsing(true); setValidationErrors([]);
    try {
      toast.loading('📊 Membaca file Excel...', { id: 'parse-excel' });
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false }) as any[];
      if (jsonData.length === 0) throw new Error('File kosong');
      const errors: string[] = [];
      const validData: any[] = [];
      let skipped = 0;
      const companyMap = new Map<string, string>();
      crmTargets?.forEach((t: any) => { if (t.namaPerusahaan) companyMap.set(t.namaPerusahaan.toLowerCase(), t.namaPerusahaan); });
      jsonData.forEach((row: any, i: number) => {
        const rowNum = i + 2;
        if (!row.namaPerusahaan && !row.noTelp && !row.email && !row.namaKonsultan && !row.noTelpKonsultan && !row.emailKonsultan) { skipped++; return; }
        if (!row.namaPerusahaan?.trim()) { errors.push(`Baris ${rowNum}: namaPerusahaan wajib`); return; }
        const lo = row.namaPerusahaan.trim().toLowerCase();
        if (!companyMap.has(lo)) { errors.push(`Baris ${rowNum}: "${row.namaPerusahaan.trim()}" tidak ditemukan`); return; }
        if (row.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) { errors.push(`Baris ${rowNum}: format email tidak valid`); return; }
        if (row.emailKonsultan?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.emailKonsultan.trim())) { errors.push(`Baris ${rowNum}: format email konsultan tidak valid`); return; }
        validData.push({
          namaPerusahaan: companyMap.get(lo)!,
          noTelp: row.noTelp?.trim() || '', email: row.email?.trim() || '',
          namaKonsultan: row.namaKonsultan?.trim() || '', noTelpKonsultan: row.noTelpKonsultan?.trim() || '',
          emailKonsultan: row.emailKonsultan?.trim() || '', picDirect: row.picDirect?.trim() || '',
        });
      });
      setParsedData(validData); setSkippedRowsCount(skipped);
      if (errors.length > 0) { setValidationErrors(errors); toast.warning(`⚠️ ${validData.length} valid, ${errors.length} error`, { id: 'parse-excel' }); }
      else if (validData.length === 0) toast.error('❌ Tidak ada data valid', { id: 'parse-excel' });
      else toast.success(`✅ ${validData.length} data siap diimport`, { id: 'parse-excel' });
    } catch (e: any) { toast.error(`❌ ${e.message}`, { id: 'parse-excel' }); setParsedData([]); }
    finally { setIsParsing(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); parseExcelFile(file); }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.xlsx')) { setUploadedFile(file); parseExcelFile(file); }
    else toast.error('❌ Harap upload file .xlsx');
  };

  const handleBulkUpdate = async () => {
    if (!parsedData.length) return;
    setIsUploading(true); setUploadProgress({ current: 0, total: parsedData.length });
    try {
      let ok = 0, fail = 0;
      for (let i = 0; i < parsedData.length; i += 10) {
        const batch = parsedData.slice(i, i + 10);
        await Promise.all(batch.map(async (d) => {
          const targets = crmTargets?.filter((t: any) => t.namaPerusahaan === d.namaPerusahaan) || [];
          try {
            await Promise.all(targets.map((t: any) => updateTargetMutation({ id: t._id, noTelp: d.noTelp || null, email: d.email || null, namaKonsultan: d.namaKonsultan || null, noTelpKonsultan: d.noTelpKonsultan || null, emailKonsultan: d.emailKonsultan || null, picDirect: d.picDirect || null })));
            ok++;
          } catch { fail++; }
        }));
        setUploadProgress({ current: Math.min(i + 10, parsedData.length), total: parsedData.length });
      }
      if (ok > 0) { toast.success(`✅ Berhasil update ${ok} perusahaan!`); setIsUploadDialogOpen(false); setUploadedFile(null); setParsedData([]); setValidationErrors([]); setSkippedRowsCount(0); }
      if (fail > 0) toast.error(`❌ ${fail} gagal`);
    } catch { toast.error('❌ Error bulk update'); }
    finally { setIsUploading(false); setUploadProgress({ current: 0, total: 0 }); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueCompanies = new Set(filteredCrmTargets.map(t => t.namaPerusahaan));
    const withPhone = new Set(filteredCrmTargets.filter(t => t.noTelp).map(t => t.namaPerusahaan));
    const withKonsultan = new Set(filteredCrmTargets.filter(t => t.namaKonsultan).map(t => t.namaPerusahaan));
    return { total: uniqueCompanies.size, withPhone: withPhone.size, withKonsultan: withKonsultan.size };
  }, [filteredCrmTargets]);

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<CrmTarget>[]>(() => {
    const mkCol = (
      key: keyof CrmTarget, title: string,
      cell?: (val: unknown, row: Row<CrmTarget>) => React.ReactNode,
      extra?: Partial<ColumnDef<CrmTarget>>
    ): ColumnDef<CrmTarget> => ({
      accessorKey: key,
      header: ({ column }) => <ColHead column={column} title={title} />,
      cell: ({ getValue, row }) => {
        if (row.getIsGrouped()) return null;
        const v = getValue();
        if (cell) return cell(v, row);
        return String(v ?? "") || "-";
      },
      filterFn: multiSelectFilter,
      aggregationFn: () => null,
      aggregatedCell: () => null,
      meta: { label: title, ...(extra?.meta as object ?? {}) },
      ...extra,
    });

    return [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => row.getIsGrouped() ? null : <span className="text-muted-foreground text-xs">{row.index + 1}</span>,
        enableSorting: false, enableHiding: false, enableGrouping: false, enableColumnFilter: false,
        size: 40,
      },
      mkCol("namaPerusahaan", "Perusahaan", v => (
        <span className="font-medium text-sm leading-snug block whitespace-normal break-words">{String(v ?? "-")}</span>
      ), { size: 220, minSize: 220, maxSize: 220, enableResizing: false }),
      mkCol("picCrm", "PIC CRM", v => {
        const val = String(v ?? "");
        if (!val) return <span className="text-muted-foreground">-</span>;
        const style = val === "DHA" ? "bg-red-100 text-red-700 border-red-200"
          : val === "MRC" ? "bg-purple-100 text-purple-700 border-purple-200"
          : "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 80 }),
      mkCol("status", "Status", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getStatusBadgeColor(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 85 }),
      mkCol("std", "Standar", v => {
        const val = String(v ?? "");
        if (!val) return "-";
        const STD_COLORS: Record<string, string> = {
          "9001":        "bg-blue-100 text-blue-700 border-blue-200",
          "14001":       "bg-green-100 text-green-700 border-green-200",
          "27001":       "bg-purple-100 text-purple-700 border-purple-200",
          "45001":       "bg-orange-100 text-orange-700 border-orange-200",
          "22000":       "bg-teal-100 text-teal-700 border-teal-200",
          "21000":       "bg-indigo-100 text-indigo-700 border-indigo-200",
          "22301":       "bg-cyan-100 text-cyan-700 border-cyan-200",
          "27701":       "bg-violet-100 text-violet-700 border-violet-200",
          "37001":       "bg-rose-100 text-rose-700 border-rose-200",
          "37301":       "bg-pink-100 text-pink-700 border-pink-200",
          "20000-1":     "bg-sky-100 text-sky-700 border-sky-200",
          "31000":       "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
          "13485":       "bg-amber-100 text-amber-700 border-amber-200",
          "56001":       "bg-yellow-100 text-yellow-700 border-yellow-200",
          "9994":        "bg-slate-200 text-slate-700 border-slate-300",
          "SMK3":        "bg-red-100 text-red-700 border-red-200",
          "ISPO":        "bg-emerald-100 text-emerald-700 border-emerald-200",
          "ISCC":        "bg-lime-100 text-lime-700 border-lime-200",
          "HACCP":       "bg-zinc-200 text-zinc-700 border-zinc-300",
          "GMP":         "bg-orange-600 text-white border-orange-600",
          "GDP":         "bg-amber-600 text-white border-amber-600",
        };
        const style = STD_COLORS[val] ?? "bg-gray-100 text-gray-600 border-gray-200";
        return <Badge variant="outline" className={`text-[10px] font-semibold ${style}`}>{val}</Badge>;
      }, { size: 100 }),
      mkCol("bulanExpDate", "Bulan Exp", undefined, { size: 100 }),
      mkCol("expDate", "Exp Date", v => <span>{v ? formatDateId(String(v)) : "-"}</span>, { size: 130 }),
      mkCol("kota", "Kota", undefined, { size: 100 }),
      mkCol("provinsi", "Provinsi", undefined, { size: 110 }),
      mkCol("picDirect", "PIC Direct", v => <span className="text-sm">{String(v ?? "") || "-"}</span>, { size: 120 }),
      mkCol("noTelp", "No Telp", (v, row) => {
        const phone = String(v ?? "");
        if (!phone) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => copyToClipboard(phone, `Telp ${row.original.namaPerusahaan}`)}
              className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer group text-sm">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{phone}</span>
              {copiedItem === `Telp ${row.original.namaPerusahaan}`
                ? <Check className="h-3 w-3 text-green-600 shrink-0" />
                : <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
            </button>
            <WhatsAppButton phone={phone} onClick={() => openWaDialog(row.original, phone)} />
          </div>
        );
      }, { size: 170 }),
      mkCol("email", "Email", (v, row) => {
        const em = String(v ?? "");
        if (!em) return <span className="text-muted-foreground">-</span>;
        return (
          <button onClick={() => copyToClipboard(em, `Email ${row.original.namaPerusahaan}`)}
            className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer group text-xs truncate max-w-[160px]">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{em}</span>
            {copiedItem === `Email ${row.original.namaPerusahaan}`
              ? <Check className="h-3 w-3 text-green-600 shrink-0" />
              : <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
          </button>
        );
      }, { size: 175, enableColumnFilter: false }),
      mkCol("namaKonsultan", "Konsultan", v => {
        const val = String(v ?? "");
        return val
          ? <div className="flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground shrink-0" /><span>{val}</span></div>
          : <span className="text-muted-foreground italic text-xs">-</span>;
      }, { size: 140 }),
      mkCol("noTelpKonsultan", "Telp Kslt", (v, row) => {
        const phone = String(v ?? "");
        if (!phone) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => copyToClipboard(phone, `Telp Kslt ${row.original.namaPerusahaan}`)}
              className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer group text-sm">
              <Phone className="h-3 w-3 text-purple-500 shrink-0" />
              <span>{phone}</span>
              {copiedItem === `Telp Kslt ${row.original.namaPerusahaan}`
                ? <Check className="h-3 w-3 text-green-600 shrink-0" />
                : <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
            </button>
            <WhatsAppButton phone={phone} onClick={() => openWaDialog(row.original, phone)} />
          </div>
        );
      }, { size: 170 }),
      mkCol("emailKonsultan", "Email Kslt", (v, row) => {
        const em = String(v ?? "");
        if (!em) return <span className="text-muted-foreground">-</span>;
        return (
          <button onClick={() => copyToClipboard(em, `Email Kslt ${row.original.namaPerusahaan}`)}
            className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer group text-xs truncate max-w-[160px]">
            <Mail className="h-3 w-3 text-purple-500 shrink-0" />
            <span className="truncate">{em}</span>
            {copiedItem === `Email Kslt ${row.original.namaPerusahaan}`
              ? <Check className="h-3 w-3 text-green-600 shrink-0" />
              : <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
          </button>
        );
      }, { size: 175, enableColumnFilter: false }),
      {
        id: "aksi",
        header: "Aksi",
        cell: ({ row }) => row.getIsGrouped() ? null : (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer"
            onClick={e => { e.stopPropagation(); setEditTarget(row.original); setIsEditOpen(true); }}
            disabled={!canEdit}>
            <Edit className="h-3.5 w-3.5 text-blue-600" />
          </Button>
        ),
        enableSorting: false, enableHiding: false, enableGrouping: false, enableColumnFilter: false,
        size: 50,
      },
    ];
  }, [canEdit, copiedItem, openWaDialog]);

  // ── Table instance ────────────────────────────────────────────────────────
  const table = useReactTable({
    data: filteredCrmTargets,
    columns,
    getRowId: row => row._id,
    filterFns: { multiSelect: multiSelectFilter },
    globalFilterFn: globalSearchFilter,
    state: { sorting, columnFilters, globalFilter, grouping, expanded, pagination, columnVisibility },
    autoResetExpanded: false,
    groupedColumnMode: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const hasActiveFilters = columnFilters.length > 0 || !!globalFilter;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const handleExport = () => {
    const exportData = filteredRows.filter(r => !r.getIsGrouped()).map(r => {
      const d = r.original;
      return {
        "Nama Perusahaan": d.namaPerusahaan, "PIC CRM": d.picCrm,
        "Kota": d.kota, "Provinsi": d.provinsi, "PIC Direct": d.picDirect ?? "",
        "No Telp": d.noTelp ?? "", "Email": d.email ?? "",
        "Konsultan": d.namaKonsultan ?? "", "Telp Konsultan": d.noTelpKonsultan ?? "",
        "Email Konsultan": d.emailKonsultan ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kontak");
    XLSX.writeFile(wb, `kontak-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <InfinityLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pt-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Manajemen Kontak
              </h1>
              <span className="rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                {stats.total} perusahaan
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi kontak perusahaan dan konsultan</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3 md:gap-4">
        {/* Card 1 — Total Perusahaan */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-500 to-indigo-600">
          <div className="absolute inset-0 opacity-10">
            <Building2 className="absolute -right-4 -bottom-4 h-24 w-24 text-white" />
          </div>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-purple-100 uppercase tracking-wide">Total Perusahaan</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
            <div className="mt-2 md:mt-3">
              <div className="h-1 w-full rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-white/70" style={{ width: '100%' }} />
              </div>
              <p className="text-[9px] md:text-[10px] text-purple-100 mt-1">Seluruh data kontak</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Ada No Telp */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="absolute inset-0 opacity-10">
            <Phone className="absolute -right-4 -bottom-4 h-24 w-24 text-white" />
          </div>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-emerald-100 uppercase tracking-wide">Ada No Telp</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.withPhone}</p>
              </div>
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
            <div className="mt-2 md:mt-3">
              <div className="h-1 w-full rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-white/70" style={{ width: `${stats.total ? Math.round((stats.withPhone / stats.total) * 100) : 0}%` }} />
              </div>
              <p className="text-[9px] md:text-[10px] text-emerald-100 mt-1">
                {stats.total ? Math.round((stats.withPhone / stats.total) * 100) : 0}% dari total perusahaan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Ada Konsultan */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-orange-500 to-rose-500">
          <div className="absolute inset-0 opacity-10">
            <User className="absolute -right-4 -bottom-4 h-24 w-24 text-white" />
          </div>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-orange-100 uppercase tracking-wide">Ada Konsultan</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{stats.withKonsultan}</p>
              </div>
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
            <div className="mt-2 md:mt-3">
              <div className="h-1 w-full rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-white/70" style={{ width: `${stats.total ? Math.round((stats.withKonsultan / stats.total) * 100) : 0}%` }} />
              </div>
              <p className="text-[9px] md:text-[10px] text-orange-100 mt-1">
                {stats.total ? Math.round((stats.withKonsultan / stats.total) * 100) : 0}% dari total perusahaan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Daftar Kontak</CardTitle>
              <CardDescription>{filteredRows.filter(r => !r.getIsGrouped()).length} data ditampilkan</CardDescription>
            </div>
            {currentUser?.role !== 'staff' && (
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1.5 text-xs cursor-pointer h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={handleDownloadTemplate}>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Template</span>
                </Button>
                <Button size="sm" className="gap-1.5 text-xs cursor-pointer h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button size="sm" className="gap-1.5 text-xs cursor-pointer h-8 bg-orange-500 hover:bg-orange-600 text-white shadow-sm" onClick={handleExport}>
                  <IconDownload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                    {filteredRows.filter(r => !r.getIsGrouped()).length}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 border-b px-3 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:max-w-[240px]">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Cari..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-8 h-8 text-xs" />
              </div>
              <div className="hidden sm:flex flex-1 items-center gap-2">
                <GroupByBar grouping={grouping} onGroupingChange={setGrouping} />
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredRows.filter(r => !r.getIsGrouped()).length} data</span>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => { setColumnFilters([]); setGlobalFilter(""); }}>
                    <IconFilterOff className="h-3.5 w-3.5" />Reset
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                      <IconLayoutColumns className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Kolom</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel className="text-xs">Tampilkan Kolom</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table.getAllLeafColumns().filter(c => c.getCanHide()).map(column => (
                      <DropdownMenuCheckboxItem key={column.id} className="text-xs cursor-pointer"
                        checked={column.getIsVisible()} onCheckedChange={v => column.toggleVisibility(!!v)}>
                        {(column.columnDef.meta as any)?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Mobile group-by */}
            <div className="flex sm:hidden">
              <GroupByBar grouping={grouping} onGroupingChange={setGrouping} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                    {hg.headers.map(header => (
                      <TableHead key={header.id} className="h-9 text-xs font-semibold text-white bg-purple-700 dark:bg-purple-900 whitespace-nowrap"
                        style={{ width: header.getSize(), minWidth: header.getSize() }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.map(row => {
                  if (row.getIsGrouped()) {
                    const groupVal = row.getValue(row.groupingColumnId ?? "");
                    const hasSubGroups = row.subRows.some(r => r.getIsGrouped());
                    const count = row.subRows.length;
                    const countLabel = hasSubGroups ? `${count} grup` : `${count} data`;
                    const depth = row.depth;
                    // Style palette per depth level
                    const depthStyles = [
                      { row: "bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200/80 dark:hover:bg-purple-800/60 border-l-purple-500 dark:border-l-purple-400", text: "text-purple-900 dark:text-purple-100", chevron: "text-purple-600 dark:text-purple-300", badge: "bg-purple-600 hover:bg-purple-600 text-white border-purple-600", font: "font-bold text-sm" },
                      { row: "bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-800/40 border-l-violet-400 dark:border-l-violet-500", text: "text-violet-800 dark:text-violet-200", chevron: "text-violet-500 dark:text-violet-400", badge: "bg-violet-500 hover:bg-violet-500 text-white border-violet-500", font: "font-semibold text-[13px]" },
                      { row: "bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-800/30 border-l-sky-400 dark:border-l-sky-500", text: "text-sky-800 dark:text-sky-200", chevron: "text-sky-500 dark:text-sky-400", badge: "bg-sky-500 hover:bg-sky-500 text-white border-sky-500", font: "font-semibold text-xs" },
                    ];
                    const style = depthStyles[Math.min(depth, depthStyles.length - 1)];
                    return (
                      <TableRow key={row.id}
                        className={`cursor-pointer border-l-4 ${style.row}`}
                        onClick={() => row.toggleExpanded()}>
                        <TableCell colSpan={columns.length} className="py-2.5 px-3">
                          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                            {row.getIsExpanded()
                              ? <IconChevronDown className={`h-4 w-4 ${style.chevron} shrink-0`} />
                              : <IconChevronRight className={`h-4 w-4 ${style.chevron} shrink-0`} />}
                            <span className={`${style.font} ${style.text}`}>
                              {String(groupVal ?? "(kosong)")}
                            </span>
                            <Badge className={`text-[10px] ${style.badge}`}>
                              {countLabel}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  const isInsideGroup = grouping.length > 0;
                  const leafIndent = grouping.length * 20;
                  return (
                    <TableRow key={row.id}
                      className={
                        isInsideGroup
                          ? "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-l-4 border-l-slate-200 dark:border-l-zinc-700 text-sm"
                          : "hover:bg-muted/30 text-sm"
                      }>
                      {row.getVisibleCells().map((cell, idx) => (
                        <TableCell key={cell.id} className="py-2 px-3 text-xs"
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                            paddingLeft: isInsideGroup && idx === 0 ? leafIndent + 12 : undefined,
                          }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Baris per halaman</span>
              <select value={pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="h-7 rounded border px-1 text-xs bg-background">
                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredRows.filter(r => !r.getIsGrouped()).length)} / {filteredRows.filter(r => !r.getIsGrouped()).length}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <IconChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <IconChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-1">{pageIndex + 1} / {pageCount || 1}</span>
              <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <IconChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
                <IconChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Dialog */}
      {waDialog && (
        <Dialog open={waDialog.open} onOpenChange={open => !open && setWaDialog(null)}>
          <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!w-[70vw] sm:!max-w-[70vw] !h-[90vh] !max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 text-green-500" />Kirim WhatsApp
              </DialogTitle>
              <DialogDescription>ke {waDialog.phone} — {waDialog.target.namaPerusahaan}</DialogDescription>
            </DialogHeader>
            <div className="flex sm:hidden shrink-0 border rounded-lg overflow-hidden">
              <button onClick={() => setWaTab('preview')} className={`flex-1 py-2 text-sm font-medium transition-colors ${waTab === 'preview' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>Preview</button>
              <button onClick={() => setWaTab('edit')} className={`flex-1 py-2 text-sm font-medium transition-colors ${waTab === 'edit' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>Edit</button>
            </div>
            <div className="flex-1 min-h-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <div className={`flex flex-col space-y-1.5 min-h-0 h-full ${isMobile && waTab !== 'preview' ? 'hidden' : ''}`}>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm font-medium">Preview WhatsApp</span>
                </div>
                <div className="flex-1 overflow-y-auto rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-[#056162] p-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {renderWaPreview(waDialog.message)}
                </div>
              </div>
              <div className={`flex flex-col space-y-1.5 min-h-0 h-full ${isMobile && waTab !== 'edit' ? 'hidden' : ''}`}>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">Edit Pesan</span>
                  <span className="text-xs text-muted-foreground">— gunakan *teks* untuk bold</span>
                </div>
                <textarea className="flex-1 w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-background font-mono"
                  value={waDialog.message}
                  onChange={e => setWaDialog({ ...waDialog, message: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 shrink-0">
              <Button variant="outline" onClick={() => setWaDialog(null)}>Batal</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { const phone = formatPhoneForWa(waDialog.phone); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waDialog.message)}`, '_blank'); }}>
                <WhatsAppIcon className="h-4 w-4 mr-2" />Buka WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kontak — {editTarget?.namaPerusahaan}</DialogTitle>
            <DialogDescription>Update akan diterapkan ke semua data CRM dengan nama perusahaan yang sama</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <EditContactForm contact={editTarget}
              onSubmit={handleUpdateContact}
              onCancel={() => { setIsEditOpen(false); setEditTarget(null); }}
              isUpdating={isUpdating} />
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-none w-[95vw] h-[90vh] max-h-[90vh] p-0" style={{ maxWidth: '95vw', width: '95vw' }}>
          <div className="sticky top-0 bg-background border-b px-6 py-4 z-10 h-16 shrink-0">
            <DialogHeader className="px-0 h-full flex flex-col justify-center">
              <DialogTitle>Import Excel — Bulk Update Kontak</DialogTitle>
              <DialogDescription>Upload file Excel untuk update banyak kontak sekaligus</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 overflow-y-auto" style={{ height: 'calc(90vh - 8rem)' }}>
            <div className="space-y-4">
              {parsedData.length === 0 && (
                <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <input type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" id="excel-upload" disabled={isParsing} />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">{isParsing ? 'Membaca file...' : 'Drag & drop atau klik untuk upload'}</p>
                    <p className="text-sm text-muted-foreground">Format file: .xlsx</p>
                  </label>
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="font-semibold text-red-900 dark:text-red-100">Error Validasi ({validationErrors.length})</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="text-sm text-red-700 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded">{err}</div>
                    ))}
                  </div>
                </div>
              )}
              {parsedData.length > 0 && !isUploading && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">{parsedData.length} Data Siap Diupdate</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">File: {uploadedFile?.name}{skippedRowsCount > 0 && ` • ${skippedRowsCount} baris kosong di-skip`}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b">
                      <p className="font-semibold text-sm">Preview {parsedData.length > 100 ? `(100 dari ${parsedData.length})` : ''}</p>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left border-r w-10">No</th>
                            <th className="px-3 py-2 text-left border-r min-w-[180px]">namaPerusahaan</th>
                            <th className="px-3 py-2 text-left border-r min-w-[120px]">noTelp</th>
                            <th className="px-3 py-2 text-left border-r min-w-[150px]">email</th>
                            <th className="px-3 py-2 text-left border-r min-w-[130px]">namaKonsultan</th>
                            <th className="px-3 py-2 text-left border-r min-w-[120px]">noTelpKonsultan</th>
                            <th className="px-3 py-2 text-left border-r min-w-[150px]">emailKonsultan</th>
                            <th className="px-3 py-2 text-left min-w-[120px]">picDirect</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 100).map((row, i) => (
                            <tr key={i} className="border-t hover:bg-muted/30">
                              <td className="px-3 py-1.5 border-r text-muted-foreground">{i + 1}</td>
                              <td className="px-3 py-1.5 border-r font-medium">{row.namaPerusahaan}</td>
                              <td className="px-3 py-1.5 border-r">{row.noTelp || <span className="text-muted-foreground">-</span>}</td>
                              <td className="px-3 py-1.5 border-r">{row.email || <span className="text-muted-foreground">-</span>}</td>
                              <td className="px-3 py-1.5 border-r">{row.namaKonsultan || <span className="text-muted-foreground">-</span>}</td>
                              <td className="px-3 py-1.5 border-r">{row.noTelpKonsultan || <span className="text-muted-foreground">-</span>}</td>
                              <td className="px-3 py-1.5 border-r">{row.emailKonsultan || <span className="text-muted-foreground">-</span>}</td>
                              <td className="px-3 py-1.5">{row.picDirect || <span className="text-muted-foreground">-</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setParsedData([]); setUploadedFile(null); setValidationErrors([]); }}>Upload Ulang</Button>
                    <Button onClick={handleBulkUpdate}>Update {parsedData.length} Perusahaan</Button>
                  </div>
                </div>
              )}
              {isUploading && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="text-center">
                    <p className="font-semibold mb-1">Mengupdate data...</p>
                    <p className="text-sm text-muted-foreground">{uploadProgress.current} / {uploadProgress.total}</p>
                  </div>
                  <div className="w-full max-w-sm bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
