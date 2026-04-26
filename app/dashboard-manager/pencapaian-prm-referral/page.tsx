"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BarChart3,
  Calendar,
  Filter,
  X,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface PrmReferralPencapaian {
  _id: Id<"prmReferralPencapaian">;
  year: number;
  month: number;
  judul: string;
  category: string; // Allow any string, will be validated as PRM/REFERRAL
  target: number;
  pencapaian: number;
  deskripsi?: string;
  created_by?: Id<"users">;
  updated_by?: Id<"users">;
  createdByName: string;
  updatedByName?: string | null;
  createdAt: number;
  updatedAt: number;
}

interface PrmReferralFormData {
  year: number;
  month: number;
  judul: string;
  category: string; // Allow any string, will be validated as PRM/REFERRAL
  target: string;
  pencapaian: string;
  deskripsi: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function PencapaianPrmReferralPage() {
  const pencapaianData = useQuery(api.prmReferralPencapaian.getAllPrmReferralPencapaian);
  const addMutation = useMutation(api.prmReferralPencapaian.createPrmReferralPencapaian);
  const updateMutation = useMutation(api.prmReferralPencapaian.updatePrmReferralPencapaian);
  const deleteMutation = useMutation(api.prmReferralPencapaian.deletePrmReferralPencapaian);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrmReferralPencapaian | null>(null);
  const [deletingItem, setDeletingItem] = useState<PrmReferralPencapaian | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PrmReferralFormData>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    judul: "",
    category: "PRM",
    target: "",
    pencapaian: "",
    deskripsi: "",
  });

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Filter by month and year
  const filteredItems = pencapaianData?.filter((item) => {
    return item.month === selectedMonth && item.year === selectedYear;
  }) || [];

  // Separate by category
  const prmItems = filteredItems.filter((item) => item.category === "PRM");
  const referralItems = filteredItems.filter((item) => item.category === "REFERRAL");

  // Helper function to parse decimal input
  const parseDecimal = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    const normalized = value.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to handle decimal input
  const handleDecimalChange = (field: keyof PrmReferralFormData, value: string) => {
    const cleaned = value.replace(/\s/g, "");
    if (cleaned === "" || /^[0-9,\.]*$/.test(cleaned)) {
      setFormData((prev) => ({ ...prev, [field]: cleaned }));
    }
  };

  // Helper function to check if HTML content is empty
  const isHtmlEmpty = (html: string): boolean => {
    if (!html) return true;

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Check if there's any text content (excluding whitespace)
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const hasText = textContent.trim().length > 0;

    // Check if there are any images
    const hasImages = tempDiv.querySelector('img') !== null;

    // Check if there are any meaningful elements (not just empty p/div/br)
    const allElements = tempDiv.querySelectorAll('*');
    const hasNonEmptyElements = Array.from(allElements).some(el => {
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'img') return true;
      if (tagName === 'br') return false;
      // Check if element has any non-whitespace content
      return el.textContent && el.textContent.trim().length > 0;
    });

    // Return true if no text, no images, and no meaningful elements
    return !hasText && !hasImages && !hasNonEmptyElements;
  };

  // Helper function to clean HTML content
  const cleanHtmlContent = (html: string): string | undefined => {
    if (!html) return undefined;
    const trimmed = html.trim();

    // First check: is it empty after parsing?
    if (isHtmlEmpty(trimmed)) {
      return undefined;
    }

    return trimmed;
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    setFormData({
      year: selectedYear,
      month: selectedMonth,
      judul: "",
      category: "PRM",
      target: "",
      pencapaian: "",
      deskripsi: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: PrmReferralPencapaian) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      month: item.month,
      judul: item.judul,
      category: item.category,
      target: item.target.toString(),
      pencapaian: item.pencapaian.toString(),
      deskripsi: item.deskripsi || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: PrmReferralPencapaian) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.judul.trim()) {
      toast.error("❌ Judul wajib diisi!");
      return;
    }
    if (!formData.target || parseFloat(formData.target) <= 0) {
      toast.error("❌ Target harus angka positif!");
      return;
    }
    if (!formData.pencapaian || parseFloat(formData.pencapaian) < 0) {
      toast.error("❌ Pencapaian harus angka positif!");
      return;
    }

    const numericData = {
      target: parseDecimal(formData.target),
      pencapaian: parseDecimal(formData.pencapaian),
    };

    const cleanedDeskripsi = cleanHtmlContent(formData.deskripsi);

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await updateMutation({
          id: editingItem._id,
          year: formData.year,
          month: formData.month,
          judul: formData.judul.trim(),
          category: formData.category,
          ...numericData,
          deskripsi: cleanedDeskripsi,
          updated_by: undefined,
          updatedByName: undefined,
        });
        toast.success("✅ Pencapaian berhasil diupdate");
      } else {
        await addMutation({
          year: formData.year,
          month: formData.month,
          judul: formData.judul.trim(),
          category: formData.category,
          ...numericData,
          deskripsi: cleanedDeskripsi,
          created_by: undefined,
          createdByName: "Unknown",
        });
        toast.success("✅ Pencapaian baru berhasil ditambahkan");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menyimpan pencapaian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);

    try {
      await deleteMutation({ id: deletingItem._id });
      toast.success("✅ Pencapaian berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (error) {
      console.error(error);
      toast.error("❌ Gagal menghapus pencapaian");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate percentage
  const calculatePercentage = (target: number, pencapaian: number) => {
    if (target === 0) return 0;
    return (pencapaian / target) * 100;
  };

  // Render Card Component
  const renderCard = (item: PrmReferralPencapaian, color: "blue" | "green") => {
    const percentage = calculatePercentage(item.target, item.pencapaian);
    const isCompleted = item.pencapaian >= item.target;
    const isOverAchieved = percentage > 100;

    // Determine progress bar value (cap at 100 for visual, but show actual percentage in text)
    const progressValue = Math.min(percentage, 100);

    // Prepare data for Bar Chart
    const chartData = [
      {
        name: 'Target',
        value: item.target,
        color: color === "blue" ? "#3b82f6" : "#22c55e",
      },
      {
        name: 'Pencapaian',
        value: item.pencapaian,
        color: percentage >= 100 ? "#22c55e" : (color === "blue" ? "#60a5fa" : "#4ade80"),
      },
    ];

    const gradientColor = color === "blue"
      ? "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
      : "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800";

    const textColor = color === "blue" ? "text-blue-900 dark:text-blue-100" : "text-green-900 dark:text-green-100";
    const subTextColor = color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-green-700 dark:text-green-300";

    return (
      <Card
        key={item._id}
        className={`p-4 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow`}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {item.judul}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.category}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(item)}
                className="cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                disabled={isSubmitting}
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(item)}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={isDeleting}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Chart Section */}
          <div className={`bg-gradient-to-r ${gradientColor} rounded-lg p-3 border`}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Bar Chart */}
              <div className="w-full md:w-2/3">
                <h5 className={`text-xs font-semibold ${textColor} uppercase tracking-wide mb-5 flex items-center gap-1`}>
                  <BarChart3 className="w-3 h-5" />
                  Target vs Pencapaian
                </h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} layout="horizontal" margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      stroke="currentColor"
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      stroke="currentColor"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2">
                              <p className="font-semibold text-sm" style={{ color: data.color }}>{data.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Nilai: {data.value.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        content={({ x, y, width, value }) => {
                          const formattedValue = Number(value).toLocaleString();
                          const xPos = typeof x === 'number' && typeof width === 'number' ? x + width / 2 : 0;
                          const yPos = typeof y === 'number' ? y - 6 : 0;

                          return (
                            <text
                              x={xPos}
                              y={yPos}
                              fill="currentColor"
                              fontSize={13}
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="auto"
                            >
                              {formattedValue}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="w-full md:w-1/3 flex flex-col justify-center space-y-3">

                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Persentase</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-bold ${
                      isOverAchieved
                        ? "text-emerald-600"
                        : isCompleted
                          ? "text-green-600"
                          : "text-blue-600"
                    }`}>
                      {percentage.toFixed(1)}%
                    </p>
                    {isOverAchieved && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        🎉 Over-achieved!
                      </span>
                    )}
                  </div>
                  <Progress
                    value={progressValue}
                    className={`h-2 mt-2 [&_[data-slot=progress-indicator]]:${
                      isOverAchieved
                        ? "bg-emerald-500"
                        : isCompleted
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {item.deskripsi && (
            <div
              dangerouslySetInnerHTML={{ __html: item.deskripsi }}
              className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
              [&_li]:my-0.5
              [&_p]:my-1
              [&_strong]:font-bold [&_strong]:text-slate-800 dark:[&_strong]:text-slate-200
              [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-1
              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1
              [&_h3]:text-xs [&_h3]:font-bold [&_h3]:my-1
              [&_br]:block"
            />
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-8 pt-6 pb-20 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Pencapaian PRM & Referral
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kelola data pencapaian PRM dan Referral per bulan
            </p>
          </div>
          <div className="hidden sm:block">
            <Button
              onClick={handleOpenDialog}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pencapaian
            </Button>
          </div>
        </div>

        {/* Filters - Desktop */}
        <Card className="hidden sm:block p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Bulan
              </Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tahun
              </Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Pencapaian Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRM Grid */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    Pencapaian PRM
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {prmItems.length} data
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {prmItems.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">
                    Belum ada data pencapaian PRM untuk {MONTHS[selectedMonth - 1]}{" "}
                    {selectedYear}
                  </p>
                </Card>
              ) : (
                prmItems.map((item) => renderCard(item, "blue"))
              )}
            </div>
          </div>

          {/* Referral Grid */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    Pencapaian Referral
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {referralItems.length} data
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {referralItems.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900">
                  <p className="text-slate-500 dark:text-slate-400">
                    Belum ada data pencapaian Referral untuk {MONTHS[selectedMonth - 1]}{" "}
                    {selectedYear}
                  </p>
                </Card>
              ) : (
                referralItems.map((item) => renderCard(item, "green"))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Pencapaian" : "Tambah Pencapaian Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update data pencapaian PRM & Referral"
                : "Tambah data pencapaian baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tahun & Bulan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">
                  Tahun <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, year: parseInt(v) }))
                  }
                >
                  <SelectTrigger id="year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">
                  Bulan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, month: parseInt(v) }))
                  }
                >
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Judul & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="judul">
                  Judul <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="judul"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, judul: e.target.value }))
                  }
                  placeholder="Masukkan judul pencapaian"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v: "PRM" | "REFERRAL") =>
                    setFormData((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRM">PRM</SelectItem>
                    <SelectItem value="REFERRAL">REFERRAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target & Pencapaian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">
                  Target <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="target"
                  type="text"
                  inputMode="decimal"
                  value={formData.target}
                  onChange={(e) => handleDecimalChange("target", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pencapaian">
                  Pencapaian <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pencapaian"
                  type="text"
                  inputMode="decimal"
                  value={formData.pencapaian}
                  onChange={(e) => handleDecimalChange("pencapaian", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <RichTextEditor
                value={formData.deskripsi}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, deskripsi: value }))
                }
                placeholder="Deskripsi pencapaian...

Tips:
• Gunakan toolbar untuk format teks
• Klik icon list untuk membuat bullet list
• Bisa copy-paste dari dokumen lain"
                rows={6}
                className="text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Gunakan toolbar di atas untuk: Bold, Italic, List, Alignment, dan Insert Gambar. Bisa copy-paste langsung dari dokumen lain.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Pencapaian"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pencapaian?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pencapaian "{deletingItem?.judul}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-2 gap-1 p-2">
          {/* Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              mobileFilterOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Filter</span>
          </button>

          {/* Add Button */}
          <button
            onClick={handleOpenDialog}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Sheet Overlay */}
      {mobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Filter Sheet */}
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden max-h-[70vh] overflow-y-auto bg-background rounded-t-2xl border-t border-border shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Handle bar */}
            <div className="flex justify-center border-b p-3">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filter Tanggal</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFilterOpen(false)}
                  className="h-8 text-xs"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Bulan */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Bulan</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="w-full bg-muted/50 border-muted focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tahun */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tahun</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-full bg-muted/50 border-muted focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Info */}
                <div className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">📊 Menampilkan data untuk:</p>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    PRM: <span className="font-bold text-blue-600 dark:text-blue-400">{prmItems.length}</span> data |
                    Referral: <span className="font-bold text-green-600 dark:text-green-400">{referralItems.length}</span> data
                  </p>
                </div>

                <Button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
