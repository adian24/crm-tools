"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  FilterFn,
  GroupingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconFilter,
  IconFilterOff,
  IconSearch,
  IconRowInsertBottom,
  IconLayoutColumns,
  IconChevronDown,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronLeft,
  IconSelector,
  IconSortAscending,
  IconSortDescending,
  IconDownload,
  IconTrash,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "@/convex/_generated/dataModel";

// ── Module augmentation ──────────────────────────────────────────────────────
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    isNumeric?: boolean;
    footerColorClass?: string;
    label?: string;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface CrmTarget {
  _id: Id<"crmTargets">;
  tahun?: string;
  bulanExpDate: string;
  produk: string;
  picCrm: string;
  sales: string;
  namaAssociate: string;
  directOrAssociate?: string;
  grup?: string;
  namaPerusahaan: string;
  status: string;
  alasan?: string;
  category?: string;
  kuadran?: string;
  luarKota?: string;
  provinsi: string;
  kota: string;
  alamat: string;
  akreditasi?: string;
  catAkre?: string;
  eaCode?: string;
  std?: string;
  iaDate?: string;
  bulanAuditSebelumnyaSustain?: string;
  expDate?: string;
  tahapAudit?: string;
  hargaKontrak?: number;
  bulanTtdNotif?: string;
  bulanAudit?: string;
  hargaTerupdate?: number;
  trimmingValue?: number;
  lossValue?: number;
  cashback?: number;
  terminPembayaran?: string;
  statusInvoice?: string;
  statusPembayaran?: string;
  statusKomisi?: string;
  statusSertifikat?: string;
  tanggalKunjungan?: string;
  statusKunjungan?: string;
  catatanKunjungan?: string;
  fotoBuktiKunjungan?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CrmDataTableProps {
  data: CrmTarget[];
  canEdit?: boolean;
  onEdit?: (target: CrmTarget) => void;
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onFilteredRowsChange?: (count: number) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "crm-data-table-column-visibility";

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  grup: false,
  catatanKunjungan: false,
  alamat: false,
  eaCode: false,
  iaDate: false,
  bulanAuditSebelumnyaSustain: false,
  fotoBuktiKunjungan: false,
  tahun: false,
};

const DEFAULT_COLUMN_PINNING: ColumnPinningState = {
  left: ["select", "no", "namaPerusahaan"],
};

const BULAN_ORDER: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4,
  mei: 5, juni: 6, juli: 7, agustus: 8,
  september: 9, oktober: 10, november: 11, desember: 12,
};

const GROUPABLE_COLUMNS = [
  { id: "namaPerusahaan", label: "Perusahaan" },
  { id: "tahun", label: "Tahun" },
  { id: "bulanExpDate", label: "Bulan Exp" },
  { id: "produk", label: "Produk" },
  { id: "picCrm", label: "PIC CRM" },
  { id: "sales", label: "Sales" },
  { id: "namaAssociate", label: "Associate" },
  { id: "directOrAssociate", label: "Direct/Assoc" },
  { id: "grup", label: "Grup" },
  { id: "status", label: "Status" },
  { id: "alasan", label: "Alasan" },
  { id: "category", label: "Category" },
  { id: "kuadran", label: "Kuadran" },
  { id: "luarKota", label: "Luar Kota" },
  { id: "provinsi", label: "Provinsi" },
  { id: "kota", label: "Kota" },
  { id: "akreditasi", label: "Akreditasi" },
  { id: "catAkre", label: "Cat Akre" },
  { id: "std", label: "STD" },
  { id: "tahapAudit", label: "Tahap Audit" },
  { id: "terminPembayaran", label: "Termin" },
  { id: "statusInvoice", label: "Status Invoice" },
  { id: "statusPembayaran", label: "Status Bayar" },
  { id: "statusKomisi", label: "Status Komisi" },
  { id: "statusSertifikat", label: "Status Sertifikat" },
  { id: "statusKunjungan", label: "Status Kunjungan" },
  { id: "eaCode", label: "EA Code" },
  { id: "iaDate", label: "IA Date" },
  { id: "bulanAuditSebelumnyaSustain", label: "Bln Audit Sblm" },
  { id: "expDate", label: "Exp Date" },
  { id: "tahapAudit", label: "Tahap Audit" },
  { id: "bulanTtdNotif", label: "Bulan TTD" },
  { id: "bulanAudit", label: "Bulan Audit" },
  { id: "tanggalKunjungan", label: "Tgl Kunjungan" },
];

const BASE_COLUMN_IDS = [
  "namaPerusahaan", "tahun", "bulanExpDate", "produk", "picCrm", "sales",
  "namaAssociate", "directOrAssociate", "grup", "status", "alasan",
  "catatanKunjungan", "category", "kuadran", "luarKota", "provinsi", "kota",
  "alamat", "akreditasi", "catAkre", "eaCode", "std", "iaDate",
  "bulanAuditSebelumnyaSustain", "expDate", "tahapAudit", "hargaKontrak",
  "bulanTtdNotif", "bulanAudit", "hargaTerupdate", "trimmingValue", "lossValue",
  "cashback", "terminPembayaran", "statusInvoice", "statusPembayaran",
  "statusKomisi", "statusSertifikat", "tanggalKunjungan", "statusKunjungan",
  "fotoBuktiKunjungan",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadgeColor(s: string): string {
  switch ((s ?? "").toUpperCase()) {
    case "PROSES": return "bg-blue-600 text-white border-blue-600";
    case "LANJUT": return "bg-green-600 text-white border-green-600";
    case "LOSS": return "bg-red-600 text-white border-red-600";
    case "SUSPEND": return "bg-orange-500 text-white border-orange-500";
    case "WAITING": return "bg-gray-500 text-white border-gray-500";
    case "DONE": return "bg-purple-600 text-white border-purple-600";
    default: return "bg-gray-500 text-white border-gray-500";
  }
}
function getCategoryBadgeStyle(c: string): string {
  switch ((c ?? "").toUpperCase()) {
    case "GOLD": return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500 font-semibold";
    case "SILVER": return "bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400 font-semibold";
    case "BRONZE": return "bg-gradient-to-r from-orange-400 to-orange-700 text-white border-orange-600 font-semibold";
    default: return "";
  }
}
function getKuadranBadgeStyle(k: string): string {
  switch (k.toUpperCase()) {
    case "K1": return "bg-violet-600 text-white border-violet-600 font-semibold";
    case "K2": return "bg-fuchsia-600 text-white border-fuchsia-600 font-semibold";
    case "K3": return "bg-purple-500 text-white border-purple-500 font-semibold";
    case "K4": return "bg-pink-500 text-white border-pink-500 font-semibold";
    default: return "bg-gray-400 text-white border-gray-400";
  }
}
function getStatusKunjunganBadgeStyle(s: string | undefined): string {
  switch ((s ?? "").toUpperCase()) {
    case "VISITED": return "bg-green-600 text-white border-green-600 font-semibold";
    default: return "bg-gray-500 text-white border-gray-500";
  }
}
function fmtCurrency(v: number | undefined): string {
  return v ? `Rp ${v.toLocaleString("id-ID")}` : "-";
}
function fmtDateShort(ds: string | undefined): string {
  if (!ds?.trim() || ds.trim() === "-") return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const c = ds.trim();
  const n = parseFloat(c);
  if (!isNaN(n) && n > 10000) {
    const d = new Date(new Date(1900,0,1).getTime() + (n-2)*86400000);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  const m1 = c.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m1) return `${parseInt(m1[3])} ${months[parseInt(m1[2])-1]}`;
  const m2 = c.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${parseInt(m2[1])} ${months[parseInt(m2[2])-1]}`;
  return c;
}
function fmtDateFull(ds: string | undefined): string {
  if (!ds?.trim() || ds.trim() === "-") return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const c = ds.trim();
  const m1 = c.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m1) return `${parseInt(m1[3])} ${months[parseInt(m1[2])-1]} ${m1[1]}`;
  const m2 = c.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) return `${parseInt(m2[1])} ${months[parseInt(m2[2])-1]} ${m2[3]}`;
  return c;
}
function getPinStyles(column: Column<CrmTarget>, isHeader = false): React.CSSProperties {
  const p = column.getIsPinned();
  if (!p) return {};
  return {
    position: "sticky",
    left: p === "left" ? `${column.getStart("left")}px` : undefined,
    right: p === "right" ? `${column.getAfter("right")}px` : undefined,
    zIndex: isHeader ? 4 : 2,
  };
}

// ── Custom filter fn ──────────────────────────────────────────────────────────
const multiSelectFilter: FilterFn<CrmTarget> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const cell = String(row.getValue(columnId) ?? "").toLowerCase().trim();
  return filterValue.map(v => v.toLowerCase().trim()).includes(cell);
};
multiSelectFilter.autoRemove = (v: string[]) => !v?.length;

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
              <IconPlus className="h-3.5 w-3.5" />
              Group By
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

// ── DetailDrawer ──────────────────────────────────────────────────────────────
function DetailDrawer({ target, open, onClose, onEdit, canEdit, isMobile }: {
  target: CrmTarget | null; open: boolean; onClose: () => void;
  onEdit?: (t: CrmTarget) => void; canEdit?: boolean; isMobile: boolean;
}) {
  if (!target) return null;
  const fields: { label: string; value: React.ReactNode; span?: boolean }[] = [
    { label: "Perusahaan", value: target.namaPerusahaan, span: true },
    { label: "Tahun", value: target.tahun ?? "-" },
    { label: "Bulan Exp", value: target.bulanExpDate ?? "-" },
    { label: "Produk", value: target.produk ?? "-" },
    { label: "PIC CRM", value: target.picCrm ?? "-" },
    { label: "Sales", value: target.sales ?? "-" },
    { label: "Associate", value: target.namaAssociate ?? "-" },
    { label: "Direct/Assoc", value: target.directOrAssociate ?? "-" },
    { label: "Grup", value: target.grup ?? "-" },
    { label: "Status", value: <Badge variant="outline" className={`text-[10px] ${getStatusBadgeColor(target.status)}`}>{target.status}</Badge> },
    { label: "Alasan", value: target.alasan ?? "-" },
    { label: "Category", value: target.category ? <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeStyle(target.category)}`}>{target.category}</Badge> : "-" },
    { label: "Kuadran", value: target.kuadran ?? "-" },
    { label: "Luar Kota", value: target.luarKota ?? "-" },
    { label: "Provinsi", value: target.provinsi ?? "-" },
    { label: "Kota", value: target.kota ?? "-" },
    { label: "Alamat", value: target.alamat ?? "-", span: true },
    { label: "Akreditasi", value: target.akreditasi ?? "-" },
    { label: "Cat Akre", value: target.catAkre ?? "-" },
    { label: "EA Code", value: target.eaCode ?? "-" },
    { label: "STD", value: target.std ?? "-" },
    { label: "IA Date", value: target.iaDate ?? "-" },
    { label: "Bulan Audit Sblm", value: target.bulanAuditSebelumnyaSustain ?? "-" },
    { label: "Exp Date", value: target.expDate ?? "-" },
    { label: "Tahap Audit", value: target.tahapAudit ?? "-" },
    { label: "Harga Kontrak", value: <span className="text-blue-600 font-semibold">{fmtCurrency(target.hargaKontrak)}</span> },
    { label: "Bulan TTD", value: fmtDateShort(target.bulanTtdNotif) },
    { label: "Bulan Audit", value: target.bulanAudit ?? "-" },
    { label: "Harga Terupdate", value: <span className="text-purple-600 font-semibold">{fmtCurrency(target.hargaTerupdate)}</span> },
    { label: "Trimming", value: <span className="text-green-600 font-semibold">{fmtCurrency(target.trimmingValue)}</span> },
    { label: "Loss", value: <span className="text-red-600 font-semibold">{fmtCurrency(target.lossValue)}</span> },
    { label: "Cashback", value: <span className="text-orange-600 font-semibold">{fmtCurrency(target.cashback)}</span> },
    { label: "Termin", value: target.terminPembayaran ?? "-" },
    { label: "Status Invoice", value: target.statusInvoice ? <Badge variant={target.statusInvoice === "Terbit" ? "default" : "secondary"} className="text-[10px]">{target.statusInvoice}</Badge> : "-" },
    { label: "Status Bayar", value: target.statusPembayaran ? <Badge variant={target.statusPembayaran === "Lunas" ? "default" : "secondary"} className="text-[10px]">{target.statusPembayaran}</Badge> : "-" },
    { label: "Status Komisi", value: target.statusKomisi ? <Badge variant="outline" className="text-[10px]">{target.statusKomisi}</Badge> : "-" },
    { label: "Status Sertifikat", value: target.statusSertifikat ?? "-" },
    { label: "Tgl Kunjungan", value: fmtDateFull(target.tanggalKunjungan) },
    { label: "Status Kunjungan", value: target.statusKunjungan ? <Badge variant="outline" className={`text-[10px] ${getStatusKunjunganBadgeStyle(target.statusKunjungan)}`}>{target.statusKunjungan}</Badge> : "-" },
    { label: "Catatan", value: target.catatanKunjungan ?? "-", span: true },
  ];

  const content = (
    <ScrollArea className="flex-1 px-4 py-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map(({ label, value, span }) => (
          <div key={label} className={span ? "col-span-2" : ""}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
            <div className="text-xs">{value}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={o => !o && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2 border-b">
            <DrawerTitle className="text-sm">{target.namaPerusahaan}</DrawerTitle>
          </DrawerHeader>
          {content}
          <DrawerFooter className="pt-2 flex-row gap-2 border-t">
            {canEdit && onEdit && (
              <Button className="flex-1 h-9 text-sm cursor-pointer" onClick={() => { onEdit(target); onClose(); }}>Edit Data</Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-9 text-sm cursor-pointer">Tutup</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={o => !o && onClose()} direction="right">
      <DrawerContent className="w-[420px] max-w-[95vw] flex flex-col gap-0">
        <DrawerHeader className="border-b px-5 py-3 flex-row items-center justify-between">
          <DrawerTitle className="text-sm font-semibold leading-tight">{target.namaPerusahaan}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 cursor-pointer"><IconX className="h-4 w-4" /></Button>
          </DrawerClose>
        </DrawerHeader>
        {content}
        {canEdit && onEdit && (
          <DrawerFooter className="border-t px-5 py-3 flex-row gap-2">
            <Button className="flex-1 h-9 text-sm cursor-pointer" onClick={() => { onEdit(target); onClose(); }}>Edit Data</Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ── MobileCardList ─────────────────────────────────────────────────────────────
function MobileCardList({ rows, onRowClick }: { rows: Row<CrmTarget>[]; onRowClick: (t: CrmTarget) => void }) {
  return (
    <div className="space-y-3 p-3">
      {rows.filter(r => !r.getIsGrouped()).map(row => {
        const d = row.original;
        return (
          <div key={row.id} className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow active:bg-accent"
            onClick={() => onRowClick(d)}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{d.namaPerusahaan}</p>
              {d.status && <Badge variant="outline" className={`text-[9px] shrink-0 ${getStatusBadgeColor(d.status)}`}>{d.status}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs mb-2">
              {d.picCrm && <span className="text-muted-foreground">PIC: <span className="text-foreground font-medium">{d.picCrm}</span></span>}
              {d.sales && <span className="text-muted-foreground">Sales: <span className="text-foreground font-medium">{d.sales}</span></span>}
              {d.provinsi && <span className="text-muted-foreground">Provinsi: <span className="text-foreground">{d.provinsi}</span></span>}
              {d.produk && <span className="text-muted-foreground">Produk: <span className="text-foreground">{d.produk}</span></span>}
            </div>
            {(d.hargaKontrak || d.hargaTerupdate) && (
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                {d.hargaKontrak && <div><p className="text-[9px] text-muted-foreground uppercase">Kontrak</p><p className="text-xs font-semibold text-blue-600">{fmtCurrency(d.hargaKontrak)}</p></div>}
                {d.hargaTerupdate && <div><p className="text-[9px] text-muted-foreground uppercase">Update</p><p className="text-xs font-semibold text-purple-600">{fmtCurrency(d.hargaTerupdate)}</p></div>}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {d.category && <Badge variant="outline" className={`text-[9px] ${getCategoryBadgeStyle(d.category)}`}>{d.category}</Badge>}
              {d.statusKunjungan && <Badge variant="outline" className={`text-[9px] ${getStatusKunjunganBadgeStyle(d.statusKunjungan)}`}>{d.statusKunjungan}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ColVisibilityPanel ────────────────────────────────────────────────────────
function ColVisibilityPanel({ table }: { table: ReturnType<typeof useReactTable<CrmTarget>> }) {
  const [search, setSearch] = useState("");
  const allCols = table.getAllLeafColumns().filter(c => c.getCanHide());
  const filtered = search
    ? allCols.filter(c => (c.columnDef.meta?.label ?? c.id).toLowerCase().includes(search.toLowerCase()))
    : allCols;

  return (
    <>
      <Input
        placeholder="Cari kolom..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        className="h-7 text-xs"
      />
      {filtered.map(column => (
        <DropdownMenuCheckboxItem
          key={column.id}
          className="text-xs cursor-pointer"
          checked={column.getIsVisible()}
          onCheckedChange={v => column.toggleVisibility(!!v)}
        >
          {column.columnDef.meta?.label ?? column.id}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
}

// ── CrmDataTable (main) ───────────────────────────────────────────────────────
export function CrmDataTable({ data, canEdit = false, onEdit, onDelete, onBulkDelete, onFilteredRowsChange }: CrmDataTableProps) {
  const isMobile = useIsMobile();

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    canEdit ? DEFAULT_COLUMN_PINNING : { left: ["no", "namaPerusahaan"] }
  );
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_VISIBILITY;
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : DEFAULT_COLUMN_VISIBILITY;
    } catch { return DEFAULT_COLUMN_VISIBILITY; }
  });
  const [drawerTarget, setDrawerTarget] = useState<CrmTarget | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Apply grouping: reorder + pin + show grouped cols
  const applyGrouping = useCallback((newGrouping: GroupingState) => {
    setGrouping(newGrouping);
    // Auto-sort bulanExpDate by month order when grouped by it
    setSorting(prev => {
      const withoutBulan = prev.filter(s => s.id !== "bulanExpDate");
      if (newGrouping.includes("bulanExpDate")) {
        return [{ id: "bulanExpDate", desc: false }, ...withoutBulan];
      }
      return withoutBulan;
    });
    if (newGrouping.length === 0) {
      setColumnPinning(canEdit ? DEFAULT_COLUMN_PINNING : { left: ["no", "namaPerusahaan"] });
      setColumnOrder([]);
    } else {
      const fixed = canEdit ? ["select", "no"] : ["no"];
      const namaCol = newGrouping.includes("namaPerusahaan") ? [] : ["namaPerusahaan"];
      const rest = BASE_COLUMN_IDS.filter(id => !newGrouping.includes(id) && id !== "namaPerusahaan");
      setColumnOrder([...fixed, ...newGrouping, ...namaCol, ...rest]);
      setColumnPinning({ left: [...new Set([...fixed, ...newGrouping, "namaPerusahaan"])] });
      setColumnVisibility(prev => {
        const next = { ...prev };
        newGrouping.forEach(id => { delete next[id]; });
        return next;
      });
    }
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [canEdit]);

  // Column definitions
  const columns = useMemo<ColumnDef<CrmTarget>[]>(() => {
    const mkCol = (
      key: keyof CrmTarget,
      title: string,
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

    const mkNum = (key: keyof CrmTarget, title: string, colorClass: string, size = 120): ColumnDef<CrmTarget> => ({
      accessorKey: key,
      header: ({ column }) => <ColHead column={column} title={title} />,
      cell: ({ getValue, row }) => row.getIsGrouped() ? null : fmtCurrency(getValue() as number | undefined),
      aggregationFn: "sum",
      aggregatedCell: ({ getValue }) => (
        <span className={`text-xs font-bold ${colorClass}`}>{fmtCurrency(getValue() as number | undefined)}</span>
      ),
      enableGrouping: false,
      enableColumnFilter: false,
      size,
      meta: { isNumeric: true, footerColorClass: colorClass, label: title },
    });

    const baseColumns: ColumnDef<CrmTarget>[] = [
      mkCol("namaPerusahaan", "Company", v => (
        <span className="font-medium leading-snug block whitespace-normal break-words" style={{ width: 200, maxWidth: 200 }}>{String(v ?? "-")}</span>
      ), { size: 200, minSize: 200, maxSize: 200, enableResizing: false }),
      mkCol("tahun", "Tahun", undefined, { size: 70, meta: {} }),
      mkCol("bulanExpDate", "Bulan Exp", undefined, {
        size: 100,
        sortingFn: (a, b, colId) => {
          const aVal = BULAN_ORDER[(String(a.getValue(colId) ?? "")).toLowerCase()] ?? 99;
          const bVal = BULAN_ORDER[(String(b.getValue(colId) ?? "")).toLowerCase()] ?? 99;
          return aVal - bVal;
        },
      }),
      mkCol("produk", "Produk", undefined, { size: 75 }),
      mkCol("picCrm", "PIC CRM", undefined, { size: 85 }),
      mkCol("sales", "Sales", undefined, { size: 85 }),
      mkCol("namaAssociate", "Associate", v => (
        <span className="break-words leading-snug">{String(v ?? "-")}</span>
      ), { size: 150 }),
      mkCol("directOrAssociate", "Direct/Assoc", undefined, { size: 105 }),
      mkCol("grup", "Grup", undefined, { size: 90 }),
      mkCol("status", "Status", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getStatusBadgeColor(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 85 }),
      mkCol("alasan", "Alasan", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { size: 160 }),
      mkCol("catatanKunjungan", "Catatan", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { enableColumnFilter: false, size: 200 }),
      mkCol("category", "Category", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 80 }),
      mkCol("kuadran", "Kuadran", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getKuadranBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 80 }),
      mkCol("luarKota", "Luar Kota", undefined, { size: 90 }),
      mkCol("provinsi", "Provinsi", undefined, { size: 100 }),
      mkCol("kota", "Kota", undefined, { size: 100 }),
      mkCol("alamat", "Alamat", v => (
        <span className="break-words leading-snug">{String(v ?? "") || "-"}</span>
      ), { enableColumnFilter: false, enableGrouping: false, size: 180 }),
      mkCol("akreditasi", "Akreditasi", undefined, { size: 90 }),
      mkCol("catAkre", "Cat Akre", undefined, { size: 80 }),
      mkCol("eaCode", "EA Code", undefined, { size: 80 }),
      mkCol("std", "STD", undefined, { size: 70 }),
      mkCol("iaDate", "IA Date", undefined, { size: 90 }),
      mkCol("bulanAuditSebelumnyaSustain", "Bln Audit Sblm", undefined, { size: 120 }),
      mkCol("expDate", "Exp Date", undefined, { size: 90 }),
      mkCol("tahapAudit", "Tahap Audit", undefined, { size: 100 }),
      mkNum("hargaKontrak", "Harga Kontrak", "text-blue-600"),
      mkCol("bulanTtdNotif", "Bulan TTD", v => fmtDateShort(String(v ?? "")), { size: 100 }),
      mkCol("bulanAudit", "Bulan Audit", undefined, { size: 100 }),
      mkNum("hargaTerupdate", "Harga Update", "text-purple-600"),
      mkNum("trimmingValue", "Trimming", "text-green-600"),
      mkNum("lossValue", "Loss", "text-red-600"),
      mkNum("cashback", "Cashback", "text-orange-600"),
      mkCol("terminPembayaran", "Termin", undefined, { size: 100 }),
      mkCol("statusInvoice", "Status Invoice", v => v ? (
        <Badge variant={(v === "Terbit") ? "default" : "secondary"} className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusPembayaran", "Status Bayar", v => v ? (
        <Badge variant={(v === "Lunas") ? "default" : "secondary"} className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusKomisi", "Status Komisi", v => v ? (
        <Badge variant="outline" className="text-[10px]">{String(v)}</Badge>
      ) : "-", { size: 110 }),
      mkCol("statusSertifikat", "Status Sertifikat", undefined, { size: 120 }),
      mkCol("tanggalKunjungan", "Tgl Kunjungan", v => fmtDateFull(String(v ?? "")), { size: 110 }),
      mkCol("statusKunjungan", "Status Kunjungan", v => v ? (
        <Badge variant="outline" className={`text-[10px] ${getStatusKunjunganBadgeStyle(String(v))}`}>{String(v)}</Badge>
      ) : "-", { size: 120 }),
      mkCol("fotoBuktiKunjungan", "Foto Bukti", undefined, { enableColumnFilter: false, enableGrouping: false, size: 100 }),
    ];

    const noCol: ColumnDef<CrmTarget> = {
      id: "no",
      header: "No",
      cell: ({ row }) => row.getIsGrouped() ? null : <span className="text-muted-foreground">{row.index + 1}</span>,
      enableSorting: false,
      enableHiding: false,
      enableGrouping: false,
      enableColumnFilter: false,
      size: 36,
    };

    if (!canEdit) return [noCol, ...baseColumns];

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all" className="cursor-pointer"
          />
        ),
        cell: ({ row }) => row.getIsGrouped() ? null : (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={v => row.toggleSelected(!!v)}
            aria-label="Select row" onClick={e => e.stopPropagation()} className="cursor-pointer" />
        ),
        enableSorting: false, enableHiding: false, enableGrouping: false, enableColumnFilter: false, size: 40,
      },
      noCol,
      ...baseColumns,
    ];
  }, [canEdit]);

  // Table instance
  const table = useReactTable({
    data,
    columns,
    filterFns: { multiSelect: multiSelectFilter },
    state: { sorting, columnFilters, globalFilter, grouping, expanded, rowSelection, columnOrder, columnPinning, pagination, columnVisibility },
    autoResetExpanded: false,
    groupedColumnMode: false,
    enableRowSelection: row => !row.getIsGrouped(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: updater => {
      const next = typeof updater === "function" ? updater(grouping) : updater;
      applyGrouping(next);
    },
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
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

  // Derived
  const filteredRows = table.getFilteredRowModel().rows;
  const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k]);
  const hasActiveFilters = columnFilters.length > 0 || globalFilter;

  useEffect(() => { onFilteredRowsChange?.(filteredRows.length); }, [filteredRows.length, onFilteredRowsChange]);

  // Footer totals from ALL filtered rows (not just current page)
  const totals = useMemo(() => {
    const rows = filteredRows;
    return {
      hargaKontrak: rows.reduce((s, r) => s + (r.original.hargaKontrak ?? 0), 0),
      hargaTerupdate: rows.reduce((s, r) => s + (r.original.hargaTerupdate ?? 0), 0),
      trimmingValue: rows.reduce((s, r) => s + (r.original.trimmingValue ?? 0), 0),
      lossValue: rows.reduce((s, r) => s + (r.original.lossValue ?? 0), 0),
      cashback: rows.reduce((s, r) => s + (r.original.cashback ?? 0), 0),
    };
  }, [filteredRows]);

  // Export
  const handleExport = () => {
    const rows = filteredRows;
    const exportData = rows.map(r => {
      const d = r.original;
      return {
        "Nama Perusahaan": d.namaPerusahaan, "Tahun": d.tahun ?? "", "Bulan Exp": d.bulanExpDate ?? "",
        "Produk": d.produk ?? "", "PIC CRM": d.picCrm ?? "", "Sales": d.sales ?? "",
        "Associate": d.namaAssociate ?? "", "Direct/Assoc": d.directOrAssociate ?? "", "Grup": d.grup ?? "",
        "Status": d.status ?? "", "Alasan": d.alasan ?? "", "Catatan": d.catatanKunjungan ?? "",
        "Category": d.category ?? "", "Kuadran": d.kuadran ?? "", "Luar Kota": d.luarKota ?? "",
        "Provinsi": d.provinsi ?? "", "Kota": d.kota ?? "", "Alamat": d.alamat ?? "",
        "Akreditasi": d.akreditasi ?? "", "Cat Akre": d.catAkre ?? "", "EA Code": d.eaCode ?? "",
        "STD": d.std ?? "", "IA Date": d.iaDate ?? "", "Bulan Audit Sblm": d.bulanAuditSebelumnyaSustain ?? "",
        "Exp Date": d.expDate ?? "", "Tahap Audit": d.tahapAudit ?? "",
        "Harga Kontrak": d.hargaKontrak ?? 0, "Bulan TTD": d.bulanTtdNotif ?? "",
        "Bulan Audit": d.bulanAudit ?? "", "Harga Terupdate": d.hargaTerupdate ?? 0,
        "Trimming": d.trimmingValue ?? 0, "Loss": d.lossValue ?? 0, "Cashback": d.cashback ?? 0,
        "Termin": d.terminPembayaran ?? "", "Status Invoice": d.statusInvoice ?? "",
        "Status Pembayaran": d.statusPembayaran ?? "", "Status Komisi": d.statusKomisi ?? "",
        "Status Sertifikat": d.statusSertifikat ?? "", "Tgl Kunjungan": d.tanggalKunjungan ?? "",
        "Status Kunjungan": d.statusKunjungan ?? "", "Foto Bukti": d.fotoBuktiKunjungan ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM Data");
    XLSX.writeFile(wb, `crm-data-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedRowIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(selectedRowIds);
      setRowSelection({});
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5">
        {/* Row 1: search + group by + actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global search */}
          <div className="relative min-w-[160px] max-w-[260px]">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari data..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Group by — inline next to search */}
          <GroupByBar grouping={grouping} onGroupingChange={applyGrouping} />

          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            {/* Counter */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {selectedRowIds.length > 0 ? (
                <span className="font-medium text-primary">{selectedRowIds.length} dipilih / </span>
              ) : null}
              {filteredRows.length} data
            </span>

            {/* Reset filter */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => { setColumnFilters([]); setGlobalFilter(""); }}>
                <IconFilterOff className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
            )}

            {/* Bulk delete */}
            {canEdit && selectedRowIds.length > 0 && (
              <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer"
                onClick={() => setBulkDeleteOpen(true)}>
                <IconTrash className="h-3.5 w-3.5" />
                Hapus ({selectedRowIds.length})
              </Button>
            )}

            {/* Export */}
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-green-600 text-green-600 hover:bg-green-50"
              onClick={handleExport}>
              <IconDownload className="h-3.5 w-3.5" />
              Export
            </Button>

            {/* Columns visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                  <IconLayoutColumns className="h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 z-50" onCloseAutoFocus={e => e.preventDefault()}>
                <DropdownMenuLabel className="text-xs">Toggle Kolom</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <ScrollArea className="h-72">
                    <ColVisibilityPanel table={table} />
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>

      {/* ── Table or Mobile Cards ── */}
      {isMobile ? (
        <div>
          <MobileCardList
            rows={table.getRowModel().rows}
            onRowClick={t => { setDrawerTarget(t); setDrawerOpen(true); }}
          />
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto max-h-[calc(100vh-300px)]">
            <table className="text-xs caption-bottom border-separate border-spacing-0" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => {
                      const isPinned = header.column.getIsPinned();
                      const pinStyle = isPinned ? { position: "sticky" as const, left: isPinned === "left" ? header.column.getStart("left") : undefined, zIndex: 11 } : {};
                      return (
                        <th
                          key={header.id}
                          style={{ ...pinStyle, width: header.getSize() }}
                          className={`py-2 px-3 text-[11px] font-semibold text-white bg-purple-700 text-left align-middle border-b border-purple-600 ${isPinned === "left" && header.column.id === "namaPerusahaan" ? "border-r border-purple-500" : ""}`}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <IconSearch className="h-8 w-8 opacity-30" />
                        <p className="font-medium">Tidak ada data</p>
                        <p className="text-xs">Coba ubah filter atau kata pencarian</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, rowIdx) => {
                    const isGrouped = row.getIsGrouped();
                    const isSelected = row.getIsSelected();
                    const isEven = rowIdx % 2 === 0;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors cursor-pointer
                          ${isGrouped ? "bg-purple-50 font-medium hover:bg-purple-100" : isSelected ? "bg-primary/10 hover:bg-primary/15" : isEven ? "bg-white hover:bg-purple-50" : "bg-purple-50/40 hover:bg-purple-100/60"}
                        `}
                        onClick={() => {
                          if (isGrouped) { row.getToggleExpandedHandler()(); }
                          else { setDrawerTarget(row.original); setDrawerOpen(true); }
                        }}
                      >
                        {row.getVisibleCells().map(cell => {
                          const isPinned = cell.column.getIsPinned();
                          const isLastLeftPin = isPinned === "left" && cell.column.id === "namaPerusahaan";
                          const pinBg = isPinned ? (isSelected ? "bg-purple-100" : isGrouped ? "bg-purple-50" : "bg-white") : "";

                          if (cell.getIsGrouped()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top ${pinBg} ${isLastLeftPin ? "border-r" : ""}`}>
                                <div className="flex items-center gap-2">
                                  <span className="pointer-events-none">
                                    {row.getIsExpanded() ? <IconChevronDown className="h-3.5 w-3.5" /> : <IconChevronRight className="h-3.5 w-3.5" />}
                                  </span>
                                  <span className="font-medium text-purple-900">{String(cell.getValue() ?? "") || "-"}</span>
                                  <span className="inline-flex items-center justify-center rounded-full bg-purple-700 text-white text-[10px] font-semibold h-5 min-w-5 px-1.5">{row.subRows.length}</span>
                                </div>
                              </td>
                            );
                          }
                          if (cell.getIsAggregated()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top text-right ${pinBg}`}>
                                {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          }
                          if (cell.getIsPlaceholder()) {
                            return (
                              <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                                className={`py-2 px-3 align-top ${pinBg} ${isLastLeftPin ? "border-r" : ""}`}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          }
                          return (
                            <td key={cell.id} style={{ ...getPinStyles(cell.column), width: cell.column.getSize() }}
                              className={`py-2 px-3 align-top ${pinBg} ${isLastLeftPin ? "border-r" : ""}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Footer totals */}
              {filteredRows.length > 0 && (
                <tfoot className="bg-muted/50 border-t font-medium sticky bottom-0 z-10">
                  <tr>
                    {table.getVisibleFlatColumns().map((column) => {
                      const isNumeric = column.columnDef.meta?.isNumeric;
                      const colorClass = column.columnDef.meta?.footerColorClass ?? "";
                      const isPinned = column.getIsPinned();
                      const isLastLeftPin = isPinned === "left" && column.id === "namaPerusahaan";

                      if (column.id === "namaPerusahaan") {
                        return (
                          <td key={column.id} style={{ ...getPinStyles(column), width: column.getSize() }}
                            className={`py-2 px-3 bg-muted/80 ${isLastLeftPin ? "border-r" : ""}`}>
                            <span className="text-[10px] font-bold text-muted-foreground">Total ({filteredRows.length} data)</span>
                          </td>
                        );
                      }
                      if (isNumeric) {
                        const val = totals[column.id as keyof typeof totals];
                        return (
                          <td key={column.id} style={{ width: column.getSize() }} className="py-2 px-3 text-right">
                            <span className={`text-[10px] font-bold ${colorClass}`}>{fmtCurrency(val)}</span>
                          </td>
                        );
                      }
                      return <td key={column.id} style={{ ...getPinStyles(column), width: column.getSize() }}
                        className={`py-2 px-3 ${isPinned ? "bg-muted/80" : ""}`} />;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
        </div>
      )}

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Baris per halaman</span>
          <select
            value={pageSize}
            onChange={e => { table.setPageSize(Number(e.target.value)); }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <span className="text-xs text-muted-foreground">
          Menampilkan {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredRows.length)} dari {filteredRows.length} data
        </span>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <IconChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <IconChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            const start = Math.max(0, Math.min(pageIndex - 2, pageCount - 5));
            const p = start + i;
            return (
              <Button key={p} variant={p === pageIndex ? "default" : "outline"} size="icon"
                className="h-8 w-8 text-xs cursor-pointer" onClick={() => table.setPageIndex(p)}>
                {p + 1}
              </Button>
            );
          })}
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <IconChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
            <IconChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <DetailDrawer
        target={drawerTarget}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={onEdit}
        canEdit={canEdit}
        isMobile={isMobile}
      />

      {/* ── Bulk Delete Dialog ── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedRowIds.length} Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. {selectedRowIds.length} data CRM akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting} className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="cursor-pointer bg-destructive hover:bg-destructive/90">
              {isBulkDeleting ? "Menghapus..." : `Hapus ${selectedRowIds.length} Data`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
