"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, Cell,
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
  crmData: any[];
  kategoriProduk?: string;
  bulanTtdEnabled?: boolean;
  bulanTtdFrom?: string;
  bulanTtdTo?: string;
}

export function TrenBulananChart({ crmData, kategoriProduk, bulanTtdEnabled, bulanTtdFrom, bulanTtdTo }: TrenBulananChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // 2024 & 2025 dari monthly_summary (data historis manual), difilter by kategori
  const historicalData = useQuery(api.monthlySummary.getMultiYearMonthlyStats, {
    kategori_produk: kategoriProduk,
  });

  // 2026 dihitung client-side dari filteredTargets (semua filter aktif)
  // Basis: status DONE, bulan & tahun dari bulanTtdNotif, nilai dari hargaTerupdate
  const y2026Stats = useMemo(() => {
    const acc = Object.fromEntries(BULAN_LIST.map(b => [b, 0]));
    for (const row of crmData) {
      if (row.status !== "DONE") continue;
      if (!row.bulanTtdNotif) continue;
      const ttdDate = new Date(row.bulanTtdNotif);
      if (isNaN(ttdDate.getTime())) continue;
      if (ttdDate.getFullYear() !== 2026) continue;
      const bulan = BULAN_LIST[ttdDate.getMonth()];
      acc[bulan] += (row.hargaTerupdate ?? 0);
    }
    return acc;
  }, [crmData]);

  const chartData = useMemo(() => {
    if (!historicalData) return undefined;
    const fromMonth = bulanTtdEnabled ? (parseInt(bulanTtdFrom ?? '1') || 1) : 1;
    const toMonth   = bulanTtdEnabled ? (parseInt(bulanTtdTo   ?? '12') || 12) : 12;
    return historicalData.map((d, i) => {
      const inRange = (i + 1) >= fromMonth && (i + 1) <= toMonth;
      return {
        bulan: d.bulan,
        bulanShort: BULAN_SHORT[i],
        y2024: inRange ? d.y2024 : 0,
        y2025: inRange ? d.y2025 : 0,
        y2026: y2026Stats[d.bulan] ?? 0,
      };
    });
  }, [historicalData, y2026Stats, bulanTtdEnabled, bulanTtdFrom, bulanTtdTo]);

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1 w-full bg-purple-500" />
      <CardHeader className="pb-2">
        {(() => {
          const from = parseInt(bulanTtdFrom ?? '1') || 1;
          const to   = parseInt(bulanTtdTo   ?? '12') || 12;
          const isFullYear = from === 1 && to === 12;
          const fromLabel = BULAN_SHORT[from - 1];
          const toLabel   = BULAN_SHORT[to - 1];
          return (
            <div className="grid grid-cols-3 items-center gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Tren Penjualan Bulanan</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Perbandingan nilai bersih per bulan — 2024 · 2025 · 2026
                  {kategoriProduk && <span className="ml-1 font-medium text-indigo-600">· {kategoriProduk}</span>}
                </CardDescription>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-100 text-purple-700 text-base font-extrabold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  {isFullYear ? "YTD: Jan – Des" : `YTD: ${fromLabel} – ${toLabel}`}
                  {!isFullYear && <span className="font-normal text-purple-500 text-sm">({to - from + 1} bln)</span>}
                </span>
              </div>
              <div className="flex justify-end">
                <div className="flex rounded-md border overflow-hidden">
                  <Button variant={chartType === "area" ? "default" : "ghost"} size="sm" className="h-8 rounded-none text-xs px-3" onClick={() => setChartType("area")}>Area</Button>
                  <Button variant={chartType === "bar" ? "default" : "ghost"} size="sm" className="h-8 rounded-none text-xs px-3" onClick={() => setChartType("bar")}>Bar</Button>
                </div>
              </div>
            </div>
          );
        })()}
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

        {/* Total per Year chart */}
        {chartData && (() => {
          const totals = [
            { tahun: "2024", nilai: chartData.reduce((s, d) => s + d.y2024, 0), color: YEAR_COLORS.y2024 },
            { tahun: "2025", nilai: chartData.reduce((s, d) => s + d.y2025, 0), color: YEAR_COLORS.y2025 },
            { tahun: "2026", nilai: chartData.reduce((s, d) => s + d.y2026, 0), color: YEAR_COLORS.y2026 },
          ];
          const maxNilai = Math.max(...totals.map(t => t.nilai));

          const growthPct = (prev: number, curr: number) =>
            prev === 0 ? null : (((curr - prev) / prev) * 100);
          const g2025 = growthPct(totals[0].nilai, totals[1].nilai);
          const g2026 = growthPct(totals[1].nilai, totals[2].nilai);

          const GrowthBadge = ({ pct }: { pct: number | null }) => {
            if (pct === null) return null;
            const up = pct >= 0;
            return (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}>
                {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
              </span>
            );
          };

          return (
            <div className="mt-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-700">Total per Tahun</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-600">2024→2025</span>
                    <GrowthBadge pct={g2025} />
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-600">2025→2026</span>
                    <GrowthBadge pct={g2026} />
                  </span>
                </div>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {totals.map((t, i) => {
                  const prev = i > 0 ? totals[i - 1].nilai : null;
                  const pct = prev !== null ? growthPct(prev, t.nilai) : null;
                  return (
                    <div key={t.tahun} className={`relative rounded-xl p-3 flex items-center justify-between gap-2 ${
                      t.tahun === "2024" ? "bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200"
                    : t.tahun === "2025" ? "bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200"
                    :                      "bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200"
                    }`}>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: t.color }}>{t.tahun}</p>
                        <p className="text-sm font-extrabold leading-snug" style={{ color: t.color }}>
                          {t.nilai > 0 ? fmtIDR(t.nilai) : <span className="text-gray-300 font-normal">—</span>}
                        </p>
                        {pct !== null && (
                          <p className="text-[10px] text-gray-400 mt-0.5">vs {totals[i-1].tahun}</p>
                        )}
                      </div>
                      {pct !== null && (
                        <span className={`shrink-0 inline-flex flex-col items-center justify-center w-14 h-14 rounded-xl text-lg font-extrabold ${
                          pct >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                        }`}>
                          <span className="text-base leading-none">{pct >= 0 ? "▲" : "▼"}</span>
                          <span className="text-sm leading-tight">{Math.abs(pct).toFixed(1)}%</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={totals} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="tahun" tick={{ fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} width={52} axisLine={false} tickLine={false} domain={[0, maxNilai * 1.2]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="nilai" name="Total" radius={[8, 8, 0, 0]}>
                    {totals.map((t, i) => (
                      <Cell key={i} fill={t.color} />
                    ))}
                    <LabelList
                      dataKey="nilai"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        if (!value) return null;
                        const t = totals[index];
                        const prev = index > 0 ? totals[index - 1].nilai : null;
                        const pct = prev !== null ? growthPct(prev, value) : null;
                        return (
                          <g>
                            <text x={x + width / 2} y={y - 18} textAnchor="middle" fontSize={12} fontWeight="700" fill={t.color}>
                              {fmtIDR(value)}
                            </text>
                            {pct !== null && (
                              <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={11} fontWeight="700"
                                fill={pct >= 0 ? "#059669" : "#dc2626"}>
                                {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
