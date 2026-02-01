"use client"

import * as React from "react"
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Pareto Chart - Alasan Distribution"

const chartConfig = {
  count: { label: "Jumlah" },
  cumulative: { label: "Persentase Kumulatif" },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-1">{payload[0].payload.alasan}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartCardParetoAlasanProps {
  title: string
  data: any[]
}

function ChartCardParetoAlasan({
  title,
  data
}: ChartCardParetoAlasanProps) {
  const hasData = data.length > 0;

  // Calculate totals
  const totalRecords = data.reduce((sum, item) => sum + item.count, 0);

  // Calculate cumulative percentage
  const chartData = data.map((item, index) => {
    const cumulative = data.slice(0, index + 1).reduce((sum, d) => sum + d.count, 0);
    return {
      ...item,
      cumulative: ((cumulative / totalRecords) * 100).toFixed(1)
    };
  });

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Purple to White gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/15 via-purple-200/10 to-white/5"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/10 via-fuchsia-100/5 to-transparent"></div>
      {/* Subtle mesh pattern overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.12) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-xs text-center font-semibold text-black/70 mt-1">
          Total: <span className="font-bold text-purple-600">{totalRecords}</span> Alasan
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] sm:h-[400px] w-full"
            style={{ minWidth: `${chartData.length * 100}px` }}
          >
          {!hasData ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-muted-foreground text-sm">No data available</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 50, right: 30, left: 20, bottom: 80 }}>
                <defs>
                  <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="50%" stopColor="#1b0352" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="alasan"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  className="fill-muted-foreground"
                  angle={-45}
                  textAnchor="end"
                  height={10}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 9 }}
                  className="fill-muted-foreground"
                  width={50}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 9 }}
                  className="fill-muted-foreground"
                  domain={[0, 100]}
                  width={50}
                  label="%"
                />
                <Tooltip
                  cursor={true}
                  content={<CustomTooltip />}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ bottom: 0, paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="count" fill="url(#gradientPurple)" radius={[2, 2, 0, 0]} name="Jumlah">
                  <LabelList
                    dataKey="count"
                    position="top"
                    fontSize={17}
                    fontWeight="bold"
                    fill="#7a0658"
                  />
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", strokeWidth: 1, r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Persentase Kumulatif"
                >
                  <LabelList
                    dataKey="cumulative"
                    position="top"
                    offset={15}
                    fontSize={14}
                    fontWeight="bold"
                    fill="#EF4444"
                    formatter={(value: string) => `${value}%`}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCardParetoAlasan };
