"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Save, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const BULAN_LIST = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
] as const;
type Bulan = typeof BULAN_LIST[number];

const KATEGORI_LIST = ["ISO", "SUSTAIN"] as const;
type Kategori = typeof KATEGORI_LIST[number];

const TAHUN_LIST = [2024, 2025];

type Key = `${number}-${Bulan}-${Kategori}`;

const BULAN_NORM: Record<string, Bulan> = {
  januari:"Januari", februari:"Februari", maret:"Maret", april:"April",
  mei:"Mei", juni:"Juni", juli:"Juli", agustus:"Agustus",
  september:"September", oktober:"Oktober", november:"November", desember:"Desember",
};

function fmtNumber(val: string | number): string {
  const num = String(val).replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(Number(num));
}

function parseNumber(val: string): number {
  return Number(val.replace(/\./g, "").replace(/,/g, "")) || 0;
}

// ── Template download ──────────────────────────────────────────────────────────
function downloadTemplate(tahun: number) {
  const rows = [
    ["Bulan", "ISO", "SUSTAIN"],
    ...BULAN_LIST.map(b => [b, 0, 0]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${tahun}`);
  XLSX.writeFile(wb, `template_historis_${tahun}.xlsx`);
}

export default function MonthlyInputPage() {
  const [tahun, setTahun] = useState<number>(2025);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const data = useQuery(api.monthlySummary.getMonthlySummaryByTahun, { tahun });
  const upsert = useMutation(api.monthlySummary.upsertMonthlySummary);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const row of data) {
      const key: Key = `${row.tahun}-${row.bulan as Bulan}-${row.kategori_produk as Kategori}`;
      next[key] = fmtNumber(row.nilai_bersih);
    }
    setValues(next);
    setSaved({});
  }, [data, tahun]);

  const handleChange = (key: Key, raw: string) => {
    setValues(prev => ({ ...prev, [key]: fmtNumber(raw) }));
    setSaved(prev => ({ ...prev, [key]: false }));
  };

  // ── Import Excel ─────────────────────────────────────────────────────────────
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Cari header row (row yang mengandung "Bulan")
      let headerIdx = rows.findIndex(r =>
        r.some(c => String(c ?? "").toLowerCase().trim() === "bulan")
      );
      if (headerIdx === -1) headerIdx = 0;
      const headerRow = rows[headerIdx].map((c: any) => String(c ?? "").toUpperCase().trim());

      // Cari index kolom Bulan, ISO, SUSTAIN
      const colBulan    = headerRow.findIndex(h => h === "BULAN");
      const colISO      = headerRow.findIndex(h => h === "ISO");
      const colSUSTAIN  = headerRow.findIndex(h => h.includes("SUSTAIN"));

      if (colBulan === -1) {
        toast.error("Kolom 'Bulan' tidak ditemukan di file Excel");
        return;
      }

      const next: Record<string, string> = { ...values };
      let count = 0;

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every((c: any) => !c)) continue;

        const bulanRaw = String(row[colBulan] ?? "").toLowerCase().trim();
        const bulan = BULAN_NORM[bulanRaw];
        if (!bulan) continue;

        if (colISO !== -1) {
          const val = Number(row[colISO] ?? 0);
          next[`${tahun}-${bulan}-ISO` as Key] = fmtNumber(String(Math.round(val)));
          count++;
        }
        if (colSUSTAIN !== -1) {
          const val = Number(row[colSUSTAIN] ?? 0);
          next[`${tahun}-${bulan}-SUSTAIN` as Key] = fmtNumber(String(Math.round(val)));
          count++;
        }
      }

      setValues(next);
      setSaved({});
      toast.success(`Berhasil membaca ${count} data dari Excel. Klik "Simpan Semua" untuk menyimpan.`);
    } catch (err) {
      toast.error("Gagal membaca file Excel. Pastikan format sesuai template.");
    } finally {
      setImporting(false);
    }
  }, [tahun, values]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveRow = useCallback(async (bulan: Bulan) => {
    const rowKeys: Key[] = KATEGORI_LIST.map(k => `${tahun}-${bulan}-${k}` as Key);
    setSaving(prev => ({ ...prev, ...Object.fromEntries(rowKeys.map(k => [k, true])) }));
    try {
      await Promise.all(
        KATEGORI_LIST.map(k => {
          const key: Key = `${tahun}-${bulan}-${k}`;
          return upsert({ tahun, bulan, kategori_produk: k, nilai_bersih: parseNumber(values[key] ?? "0") });
        })
      );
      setSaved(prev => ({ ...prev, ...Object.fromEntries(rowKeys.map(k => [k, true])) }));
      toast.success(`${bulan} ${tahun} tersimpan`);
    } catch {
      toast.error(`Gagal simpan ${bulan}`);
    } finally {
      setSaving(prev => ({ ...prev, ...Object.fromEntries(rowKeys.map(k => [k, false])) }));
    }
  }, [tahun, values, upsert]);

  const saveAll = async () => {
    for (const bulan of BULAN_LIST) await saveRow(bulan);
    toast.success(`Semua data ${tahun} tersimpan`);
  };

  const isRowSaving = (bulan: Bulan) => KATEGORI_LIST.some(k => saving[`${tahun}-${bulan}-${k}`]);
  const isRowSaved  = (bulan: Bulan) => KATEGORI_LIST.every(k => saved[`${tahun}-${bulan}-${k}`]);

  return (
    <div className="py-4 lg:py-8 lg:px-6 pb-20 lg:pb-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Input Data Historis Penjualan</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Nilai bersih per bulan & kategori produk (dalam Rupiah)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle tahun */}
              <div className="flex rounded-md border overflow-hidden">
                {TAHUN_LIST.map(t => (
                  <button
                    key={t}
                    onClick={() => setTahun(t)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      tahun === t ? "bg-purple-700 text-white" : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Download template */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-green-600 text-green-700 hover:bg-green-50"
                onClick={() => downloadTemplate(tahun)}
              >
                <Download className="h-3.5 w-3.5" />
                Template
              </Button>

              {/* Import Excel */}
              <Button
                variant="outline"
                size="sm"
                disabled={importing}
                className="gap-1.5 text-xs border-blue-600 text-blue-700 hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {importing ? "Membaca..." : "Import Excel"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />

              {/* Simpan semua */}
              <Button onClick={saveAll} size="sm" className="gap-1.5 bg-purple-700 hover:bg-purple-800">
                <Save className="h-4 w-4" />
                Simpan Semua
              </Button>
            </div>
          </div>

          {/* Info format */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span>Format Excel: kolom <strong>Bulan</strong> (Januari–Desember), <strong>ISO</strong>, <strong>SUSTAIN</strong>. Download template untuk contoh.</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-36">Bulan</th>
                  {KATEGORI_LIST.map(k => (
                    <th key={k} className="text-right py-2.5 px-3 font-semibold text-gray-600 min-w-[200px]">
                      {k}
                    </th>
                  ))}
                  <th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {BULAN_LIST.map(bulan => {
                  const rowSaving = isRowSaving(bulan);
                  const rowSaved  = isRowSaved(bulan);
                  return (
                    <tr key={bulan} className="border-b hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-medium text-gray-700">{bulan}</td>
                      {KATEGORI_LIST.map(k => {
                        const key: Key = `${tahun}-${bulan}-${k}`;
                        return (
                          <td key={k} className="py-1.5 px-3">
                            <div className="relative">
                              <Input
                                value={values[key] ?? ""}
                                onChange={e => handleChange(key, e.target.value)}
                                placeholder="0"
                                className={`text-right pr-8 h-8 text-sm ${saved[key] ? "border-emerald-400" : ""}`}
                              />
                              {saved[key] && (
                                <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-1.5 px-2">
                        <Button
                          size="sm"
                          variant={rowSaved ? "outline" : "default"}
                          className={`h-8 text-xs gap-1 ${rowSaved ? "border-emerald-400 text-emerald-600" : "bg-purple-700 hover:bg-purple-800"}`}
                          onClick={() => saveRow(bulan)}
                          disabled={rowSaving}
                        >
                          {rowSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                           rowSaved  ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                       <Save className="h-3.5 w-3.5" />}
                          {rowSaving ? "..." : rowSaved ? "Tersimpan" : "Simpan"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
