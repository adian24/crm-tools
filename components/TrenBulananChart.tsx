"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, LabelList,
} from "recharts";

const BULAN_LIST = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const BULAN_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const BULAN_NORM: Record<string, string> = {
  januari:"Januari", februari:"Februari", maret:"Maret", april:"April",
  mei:"Mei", juni:"Juni", juli:"Juli", agustus:"Agustus",
  september:"September", oktober:"Oktober", november:"November", desember:"Desember",
};

const YEAR_COLORS = {
  y2024: "#c2410c",
  y2025: "#8b5cf6",
  y2026: "#10b981",
};

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number): string => {
  if (n === 0) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

const fmtAxis = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium">{fmtIDR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface TrenBulananChartProps {
  crmData: any[];          // filteredTargets dari parent (sudah difilter semua)
  kategoriProduk?: string; // undefined = semua, "ISO" | "SUSTAIN" untuk monthly_summary
}

export function TrenBulananChart({ crmData, kategoriProduk }: TrenBulananChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // 2024 & 2025 dari monthly_summary (data historis manual), difilter by kategori
  const historicalData = useQuery(api.monthlySummary.getMultiYearMonthlyStats, {
    kategori_produk: kategoriProduk,
  });

  // 2026 dihitung client-side dari filteredTargets (semua filter aktif)
  const y2026Stats = useMemo(() => {
    const acc = Object.fromEntries(BULAN_LIST.map(b => [b, 0]));
    for (const row of crmData) {
      if (row.tahun !== "2026") continue;
      if (row.status !== "DONE") continue;
      const bulan = BULAN_NORM[(row.bulanExpDate ?? "").toLowerCase().trim()];
      if (!bulan) continue;
      acc[bulan] += (row.hargaTerupdate ?? row.hargaKontrak ?? 0);
    }
    return acc;
  }, [crmData]);

  const chartData = useMemo(() => {
    if (!historicalData) return undefined;
    return historicalData.map((d, i) => ({
      bulan: d.bulan,
      bulanShort: BULAN_SHORT[i],
      y2024: d.y2024,
      y2025: d.y2025,
      y2026: y2026Stats[d.bulan] ?? 0,
    }));
  }, [historicalData, y2026Stats]);

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1 w-full bg-purple-500" />
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Tren Penjualan Bulanan</CardTitle>
            <CardDescription className="text-xs">
              Perbandingan nilai bersih per bulan — 2024 · 2025 · 2026
              {kategoriProduk && <span className="ml-1 font-medium text-indigo-600">· {kategoriProduk}</span>}
            </CardDescription>
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={chartType === "area" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none text-xs px-3"
              onClick={() => setChartType("area")}
            >Area</Button>
            <Button
              variant={chartType === "bar" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none text-xs px-3"
              onClick={() => setChartType("bar")}
            >Bar</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-4">
        {!chartData ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartType === "area" ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g2024" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={YEAR_COLORS.y2024} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={YEAR_COLORS.y2024} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2025" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={YEAR_COLORS.y2025} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={YEAR_COLORS.y2025} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2026" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={YEAR_COLORS.y2026} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={YEAR_COLORS.y2026} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulanShort" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="y2024" name="2024" stroke={YEAR_COLORS.y2024}
                strokeWidth={1.5} strokeDasharray="5 3" fill="url(#g2024)" dot={{ r: 2 }} activeDot={{ r: 4 }}>
                <LabelList dataKey="y2024" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2024, fontWeight: 700 }} />
              </Area>
              <Area type="monotone" dataKey="y2025" name="2025" stroke={YEAR_COLORS.y2025}
                strokeWidth={2} fill="url(#g2025)" dot={{ r: 2 }} activeDot={{ r: 4 }}>
                <LabelList dataKey="y2025" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2025, fontWeight: 700 }} />
              </Area>
              <Area type="monotone" dataKey="y2026" name="2026" stroke={YEAR_COLORS.y2026}
                strokeWidth={2.5} fill="url(#g2026)" dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="y2026" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2026, fontWeight: 700 }} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="20%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulanShort" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="y2024" name="2024" fill={YEAR_COLORS.y2024} fillOpacity={0.7} radius={[3,3,0,0]}>
                <LabelList dataKey="y2024" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2024, fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="y2025" name="2025" fill={YEAR_COLORS.y2025} fillOpacity={0.8} radius={[3,3,0,0]}>
                <LabelList dataKey="y2025" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2025, fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="y2026" name="2026" fill={YEAR_COLORS.y2026} fillOpacity={1} radius={[3,3,0,0]}>
                <LabelList dataKey="y2026" position="top" formatter={fmtCompact} style={{ fontSize: 15, fill: YEAR_COLORS.y2026, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary table */}
        {chartData && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-200">
                  <th className="text-left font-semibold text-purple-700 px-3 py-2 w-20 sticky left-0 bg-purple-50">Tahun</th>
                  {BULAN_SHORT.map(b => (
                    <th key={b} className="text-right font-semibold text-purple-700 px-3 py-2 min-w-[110px]">{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["y2024", "y2025", "y2026"] as const).map((key, rowIdx) => {
                  const year = key === "y2024" ? "2024" : key === "y2025" ? "2025" : "2026";
                  const color = YEAR_COLORS[key];
                  const isCurrentYear = key === "y2026";
                  return (
                    <tr key={key} className={`border-b border-gray-100 last:border-0 ${isCurrentYear ? "bg-emerald-50" : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <td className="font-bold px-3 py-2.5 sticky left-0 bg-inherit" style={{ color }}>{year}</td>
                      {chartData.map((d, i) => (
                        <td key={i} className="text-right px-3 py-2.5 tabular-nums font-bold" style={{ color }}>
                          {d[key] > 0 ? fmtIDR(d[key]) : <span className="text-gray-300 font-normal">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
