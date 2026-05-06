"use client"

import * as React from "react"
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  CartesianGrid, XAxis, YAxis, Legend, LabelList, Rectangle,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"

export const description = "Trimming / Loss / Cashback / Nilai Bersih per Bulan"

const chartConfig = {
  trimmingValue:  { label: "Trimming",     color: "#0ea5e9" },
  lossValue:      { label: "Loss",         color: "#ef4444" },
  cashbackValue:  { label: "Cashback",     color: "#f97316" },
  nilaiBersih:    { label: "Nilai Bersih", color: "#22c55e" },
} satisfies ChartConfig

const ALL_MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
]

const MONTH_ABBR: Record<string, string> = {
  Januari:"Jan", Februari:"Feb", Maret:"Mar", April:"Apr",
  Mei:"Mei",     Juni:"Jun",     Juli:"Jul",  Agustus:"Ags",
  September:"Sep", Oktober:"Okt", November:"Nov", Desember:"Des",
}

const fmt = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}Jt`;
  return v.toLocaleString("id-ID");
};

const MIN_CB_H = 28;

// Hitung geometry yang disesuaikan: cashback diperluas ke bawah, loss dipotong dari atas
function adjustedStackGeometry(
  lossY: number, lossH: number, lossValue: number, cashbackValue: number
) {
  if (!lossValue || !cashbackValue || lossH <= 0) return null;
  const ppu    = lossH / lossValue;
  const cbNatH = cashbackValue * ppu;
  if (cbNatH >= MIN_CB_H) return null;
  const totalH   = (lossValue + cashbackValue) * ppu;
  const cbAdjH   = MIN_CB_H;
  const lossAdjH = Math.max(0, totalH - cbAdjH);
  const yZero    = lossY + lossH;
  const yCb      = yZero - totalH;
  const yLossNew = yCb + cbAdjH;
  return { yCb, cbAdjH, yLossNew, lossAdjH };
}

// Shape loss: dipotong dari atas untuk memberi ruang ke cashback
const LossBarShape = (props: any) => {
  const { x, y, width, height, lossValue, cashbackValue, fill } = props;
  if (!height || height <= 0) return null;
  if (!cashbackValue) {
    return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[2,2,0,0]} />;
  }
  const adj = adjustedStackGeometry(y, height, lossValue, cashbackValue);
  if (!adj) return <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[0,0,0,0]} />;
  return <Rectangle x={x} y={adj.yLossNew} width={width} height={adj.lossAdjH} fill={fill} radius={[0,0,0,0]} />;
};

// Shape cashback: diperluas ke bawah jika terlalu tipis, tapi tidak boleh melebihi total stack
const CashbackBarShape = (props: any) => {
  const { x, y, width, height, lossValue, cashbackValue, fill } = props;
  if (!cashbackValue) return null;
  const h          = height ?? 0;
  const lossNatH   = h > 0 ? (lossValue / cashbackValue) * h : 0;
  const totalNatH  = h + lossNatH;                              // total stack = batas bawah (zero line)
  const cbH        = Math.min(Math.max(h, MIN_CB_H), totalNatH);
  if (cbH <= 0) return null;
  return <Rectangle x={x} y={y} width={width} height={cbH} fill={fill} radius={[2,2,0,0]} />;
};

// Label loss — tengah bar, font kecil
const InnerLabelLoss = ({ x, y, width, height, value }: any) => {
  if (!value) return null;
  const h = height ?? 0;
  if (h < 14) return null;
  return (
    <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) + h / 2}
      textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight="bold" fill="#fff">
      {fmt(value)}
    </text>
  );
};

// Label cashback — selalu pakai max(h, MIN_CB_H) agar vertical center sesuai visual bar
const InnerLabelCashback = ({ x, y, width, height, value }: any) => {
  if (!value) return null;
  const cbH = Math.max(height ?? 0, MIN_CB_H);
  return (
    <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) + cbH / 2}
      textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight="bold" fill="#fff">
      {fmt(value)}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-2.5 text-xs space-y-1">
      <p className="font-semibold text-sm mb-1">{d.name}</p>
      <p style={{ color: "#0ea5e9" }}>Trimming      : {fmt(d.trimmingValue)}</p>
      <p style={{ color: "#ef4444" }}>Loss          : {fmt(d.lossValue)}</p>
      <p style={{ color: "#f97316" }}>Cashback      : {fmt(d.cashbackValue)}</p>
      <p style={{ color: "#b45309" }}>Loss+Cashback : {fmt(d.lossAndCashback)}</p>
      <p style={{ color: "#22c55e" }}>Nilai Bersih  : {fmt(d.nilaiBersih)}</p>
    </div>
  );
};

interface ChartCardTrProps {
  title: string;
  data: any[];
  chartType?: string;
}

function ChartCardTr({ title, data, chartType = "bar" }: ChartCardTrProps) {
  const chartData = React.useMemo(() => {
    const trimMap:     Record<string, number> = {};
    const lossMap:     Record<string, number> = {};
    const cashbackMap: Record<string, number> = {};

    (data || []).forEach(item => {
      const m = item.bulanExpDate;
      if (!m) return;
      trimMap[m]     = (trimMap[m]     || 0) + (item.trimmingValue || 0);
      lossMap[m]     = (lossMap[m]     || 0) + (item.lossValue     || 0);
      cashbackMap[m] = (cashbackMap[m] || 0) + (item.cashback      || 0);
    });

    const presentMonths = ALL_MONTHS.filter(
      m => trimMap[m] !== undefined || lossMap[m] !== undefined || cashbackMap[m] !== undefined
    );
    return presentMonths.map(month => {
      const t = trimMap[month]     || 0;
      const l = lossMap[month]     || 0;
      const c = cashbackMap[month] || 0;
      return {
        name: month,
        trimmingValue:   t,
        lossValue:       l,
        cashbackValue:   c,
        lossAndCashback: l + c,
        nilaiBersih:     t - l - c,
      };
    });
  }, [data]);


  const hasData = data.length > 0;

  // Batas bawah Y-axis: nilai negatif maksimal 25% dari range positif
  const yDomain = React.useMemo((): [number, number] => {
    const maxPos = chartData.reduce((m, d) => Math.max(m, d.trimmingValue, d.lossAndCashback), 0);
    const minNeg = chartData.reduce((m, d) => Math.min(m, d.nilaiBersih), 0);
    const floor  = minNeg < 0 ? Math.max(minNeg, -(maxPos * 0.08)) : 0;
    return [floor, maxPos * 1.05];
  }, [chartData]);

  const xAxis = (
    <XAxis
      dataKey="name" tickLine={false} axisLine={false}
      tick={{ fontSize: 13, fontWeight: 700, fill: "#6b21a8" }}
      tickFormatter={(v) => MONTH_ABBR[v] ?? v}
      angle={-35} textAnchor="end" height={36} interval={0}
    />
  );
  const yAxis = (
    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#7e22ce" }} width={80} tickFormatter={fmt} domain={yDomain} />
  );
  const legendEl = (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 pb-3 text-xs text-purple-800 dark:text-purple-300">
      {(["trimmingValue","lossValue","cashbackValue","nilaiBersih"] as const).map(key => (
        <span key={key} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm shadow-sm" style={{ background: chartConfig[key].color }} />
          {chartConfig[key].label}
        </span>
      ))}
    </div>
  );

  const renderChart = () => {
    if (!hasData) return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Tidak ada data
      </div>
    );

    const margin = { top: 65, right: 20, left: 10, bottom: 10 };

    if (chartType === "area") return (
      <AreaChart data={chartData} margin={margin}>
        <defs>
          {(["trimmingValue","lossValue","cashbackValue","nilaiBersih"] as const).map(key => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={chartConfig[key].color} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartConfig[key].color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.15)" />
        {xAxis}{yAxis}
        <ChartTooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="trimmingValue" stroke="#0ea5e9" fill="url(#grad-trimmingValue)" strokeWidth={2}>
          <LabelList dataKey="trimmingValue" position="top" fontSize={11} fontWeight="bold" fill="#0369a1" formatter={fmt} />
        </Area>
        <Area type="monotone" dataKey="lossValue" stroke="#ef4444" fill="url(#grad-lossValue)" strokeWidth={2}>
          <LabelList dataKey="lossValue" position="top" fontSize={11} fontWeight="bold" fill="#b91c1c" formatter={fmt} />
        </Area>
        <Area type="monotone" dataKey="cashbackValue" stroke="#f97316" fill="url(#grad-cashbackValue)" strokeWidth={2}>
          <LabelList dataKey="cashbackValue" position="top" fontSize={11} fontWeight="bold" fill="#c2410c" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Area>
        <Area type="monotone" dataKey="nilaiBersih" stroke="#22c55e" fill="url(#grad-nilaiBersih)" strokeWidth={2}>
          <LabelList dataKey="nilaiBersih" position="top" fontSize={11} fontWeight="bold" fill="#15803d" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Area>
      </AreaChart>
    );

    if (chartType === "line") return (
      <LineChart data={chartData} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.15)" />
        {xAxis}{yAxis}
        <ChartTooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="trimmingValue" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
          <LabelList dataKey="trimmingValue" position="top" fontSize={11} fontWeight="bold" fill="#0369a1" formatter={fmt} />
        </Line>
        <Line type="monotone" dataKey="lossValue" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
          <LabelList dataKey="lossValue" position="top" fontSize={11} fontWeight="bold" fill="#b91c1c" formatter={fmt} />
        </Line>
        <Line type="monotone" dataKey="cashbackValue" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
          <LabelList dataKey="cashbackValue" position="top" fontSize={11} fontWeight="bold" fill="#c2410c" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Line>
        <Line type="monotone" dataKey="nilaiBersih" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
          <LabelList dataKey="nilaiBersih" position="top" fontSize={11} fontWeight="bold" fill="#15803d" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Line>
      </LineChart>
    );

    // default: bar — Loss (merah, bawah) + Cashback (oranye, atas) di-stack, proporsi akurat
    return (
      <BarChart data={chartData} margin={margin} barCategoryGap="12%" barGap={1}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.15)" />
        {xAxis}{yAxis}
        <ChartTooltip content={<CustomTooltip />} />
        <Bar dataKey="trimmingValue" name="Trimming" fill="#0ea5e9" radius={[2,2,0,0]}>
          <LabelList dataKey="trimmingValue" position="top" fontSize={13} fontWeight="bold" fill="#0369a1" formatter={fmt} />
        </Bar>
        {/* Loss (bawah): shape menyusut jika cashback butuh ruang */}
        <Bar dataKey="lossValue" name="Loss" fill="#ef4444" stackId="deduction" shape={<LossBarShape />}>
          <LabelList dataKey="lossValue" content={<InnerLabelLoss />} />
        </Bar>
        {/* Cashback (atas): shape melebar ke bawah jika terlalu tipis */}
        <Bar dataKey="cashbackValue" name="Cashback" fill="#f97316" stackId="deduction" shape={<CashbackBarShape />}>
          <LabelList dataKey="cashbackValue" content={<InnerLabelCashback />} />
          <LabelList dataKey="lossAndCashback" position="top" fontSize={13} fontWeight="bold" fill="#9a3412" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Bar>
        <Bar dataKey="nilaiBersih" name="Nilai Bersih" fill="#22c55e" radius={[2,2,0,0]}>
          <LabelList dataKey="nilaiBersih" position="top" fontSize={13} fontWeight="bold" fill="#15803d" formatter={(v: number) => v !== 0 ? fmt(v) : ""} />
        </Bar>
      </BarChart>
    );
  };

  return (
    <Card className="@container/card relative overflow-hidden border-0 shadow-xl">
      {/* Base: ungu muda transparan */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200/70 via-violet-200/60 to-fuchsia-100/70 dark:from-purple-900/50 dark:via-violet-900/40 dark:to-fuchsia-900/40" />
      {/* Blobs ungu */}
      <div className="absolute -top-16 -left-8 w-64 h-64 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-16 -right-8 w-64 h-64 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(192,132,252,0.20) 0%, transparent 70%)" }} />
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.25) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }} />
      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />

      <CardHeader className="relative z-10 pb-1 pt-4">
        <CardTitle className="text-base font-bold text-center text-purple-900 dark:text-purple-100 tracking-wide">{title}</CardTitle>
      </CardHeader>

      <CardContent className="px-2 pt-2 pb-0 relative z-10">
        <div className="overflow-x-auto overflow-y-hidden">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[420px] sm:h-[500px] w-full"
            style={{ minWidth: `${Math.max(chartData.length, 3) * 100}px` }}
          >
            {renderChart()}
          </ChartContainer>
        </div>
        {legendEl}
      </CardContent>
    </Card>
  );
}

export { ChartCardTr };
