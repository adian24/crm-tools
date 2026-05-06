"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Loader2,
  Camera,
  BarChart3,
  Users,
  GitBranch,
  TrendingUp,
  Star,
  MessageCircle,
  AlertTriangle,
  StickyNote,
  Image,
  Handshake,
  FileText,
  Award,
} from "lucide-react";
import { usePptxCapture } from "@/lib/pptx-capture-context";
import { useGlobalFilter } from "@/lib/global-filter-context";

const MONTHS = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const SLIDES = [
  { icon: null,           label: "Cover",                              desc: "Halaman judul" },
  { icon: TrendingUp,     label: "KPI",                                desc: "Screenshot halaman KPI" },
  { icon: GitBranch,      label: "Struktur Divisi CRP",                desc: "Screenshot org chart" },
  { icon: Users,          label: "Kolaborasi CRM",                     desc: "Screenshot kolaborasi" },
  { icon: Award,          label: "Pencapaian – Summary",               desc: "Kartu statistik CRM" },
  { icon: BarChart3,      label: "Pencapaian – Target VS Pencapaian",  desc: "Chart breakdown bulanan" },
  { icon: BarChart3,      label: "Pencapaian – Kuadran Analytics",     desc: "Chart kuadran per bulan" },
  { icon: BarChart3,      label: "Pencapaian – Associate Category",    desc: "Chart direct vs associate" },
  { icon: BarChart3,      label: "Pencapaian – Sales Performance",     desc: "Chart per sales person" },
  { icon: BarChart3,      label: "Pencapaian – Tahapan Audit",         desc: "Chart distribusi tahapan" },
  { icon: BarChart3,      label: "Pencapaian – Chart Standar",         desc: "Chart distribusi standar" },
  { icon: BarChart3,      label: "Pencapaian – EA Code Distribution",  desc: "Chart distribusi EA code" },
  { icon: BarChart3,      label: "Pencapaian – Trimming Value",        desc: "Chart trimming per bulan" },
  { icon: BarChart3,      label: "Pencapaian – Pareto Alasan",         desc: "Chart pareto 80/20" },
  { icon: TrendingUp,     label: "Pencapaian – Tren Penjualan",        desc: "Chart tren 2024-2026" },
  { icon: BarChart3,      label: "Pencapaian PRM & Referral",          desc: "Screenshot chart PRM" },
  { icon: FileText,       label: "Laporan Kunjungan",                  desc: "Screenshot laporan" },
  { icon: Handshake,      label: "Engagement & Partnership",           desc: "Screenshot kunjungan" },
  { icon: Star,           label: "NPS",                                desc: "Screenshot NPS score" },
  { icon: Image,          label: "Flyer",                              desc: "Screenshot daftar flyer" },
  { icon: MessageCircle,  label: "Customer Complain",                  desc: "Screenshot komplain" },
  { icon: AlertTriangle,  label: "Isu & Kendala",                      desc: "Screenshot isu" },
  { icon: StickyNote,     label: "Catatan Tambahan",                   desc: "Screenshot catatan" },
  { icon: null,           label: "Closing",                            desc: "Halaman penutup" },
];

export default function GeneratePPTXPage() {
  const { month, setMonth, year, setYear } = useGlobalFilter();
  const { startCapture, isCapturing } = usePptxCapture();

  const now = new Date();
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-blue-600">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Generate Laporan PowerPoint
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Screenshot otomatis setiap halaman modul → disusun menjadi file .pptx
          </p>
        </div>
      </div>

      {/* Selector + Button */}
      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Pilih Periode
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bulan</label>
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))} disabled={isCapturing}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.slice(1).map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tahun</label>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))} disabled={isCapturing}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => startCapture(month, year)}
            disabled={isCapturing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10"
          >
            {isCapturing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
            ) : (
              <><FileDown className="w-4 h-4 mr-2" />Generate &amp; Download</>
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Catatan:</strong> Screenshot diambil dari tampilan browser Anda saat ini.
            Pastikan filter bulan/tahun sudah diatur di setiap halaman sebelum generate.
            Proses membutuhkan waktu ~45–90 detik.
          </p>
        </div>
      </Card>

      {/* Slide list */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Isi Slide ({SLIDES.length} slide)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Setiap slide berisi screenshot langsung dari halaman aplikasi
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {SLIDES.map((slide, i) => {
            const isSpecial = i === 0 || i === SLIDES.length - 1;
            return (
              <div
                key={slide.label}
                className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                  isSpecial
                    ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  isSpecial ? "bg-blue-600" : "bg-gray-500"
                }`}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isSpecial ? "text-blue-800 dark:text-blue-200" : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {slide.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {slide.icon && <slide.icon className="inline w-3 h-3 mr-1" />}
                    {slide.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
