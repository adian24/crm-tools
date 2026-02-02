"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, LabelList, Tooltip, Legend, ResponsiveContainer } from "recharts"

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

export const description = "Trimming Value Multi-Chart"

const chartConfig = {
  trimmingValue: { label: "Trimming Value" },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-1">{data.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
            Trimming Value: Rp {entry.value.toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartCardTrProps {
  title: string
  data: any[]
  chartType?: string
}

function ChartCardTr({
  title,
  data,
  chartType = 'bar'
}: ChartCardTrProps) {
  // Generate colors for months - using blue theme
  const colors = [
    '#0369a1', '#0284c7', '#0369a1', '#0ea5e9', '#0284c7', '#0369a1',
    '#0ea5e9', '#0284c7', '#0369a1', '#0ea5e9', '#0284c7', '#0369a1'
  ];

  const getMonthColor = (index: number) => {
    return colors[index % colors.length];
  };

  // Process data for chart
  const getChartData = () => {
    if (!data || data.length === 0) return [];

    const monthMap: { [key: string]: number } = {};

    data.forEach(item => {
      const month = item.bulanExpDate;
      if (month) {
        monthMap[month] = (monthMap[month] || 0) + (item.trimmingValue || 0);
      }
    });

    // Initialize with all months from Januari to Desember
    const allMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return allMonths.map((month, index) => ({
      name: month,
      trimmingValue: monthMap[month] || 0,
      color: getMonthColor(index)
    }));
  };

  const chartData = getChartData();
  const hasData = data.length > 0;

  // Calculate total trimming value
  const totalTrimming = data.reduce((sum, item) => sum + (item.trimmingValue || 0), 0);

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 via-cyan-200/10 to-white/5"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-800/10 via-teal-100/5 to-transparent"></div>
      {/* Subtle mesh pattern overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.12) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-xs text-center font-semibold text-black/70 mt-1">
          Total: <span className="font-bold text-blue-600">Rp {totalTrimming.toLocaleString('id-ID')}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] sm:h-[280px] md:h-[320px] w-full"
            style={{ minWidth: `${chartData.length * 60}px` }}
          >
          {(() => {
            if (!hasData) {
              return (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">No data available</div>
                  </div>
                </div>
              );
            }

            switch (chartType) {
              case 'area':
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorTrimming" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      width={80}
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `Rp ${(value / 1000000000).toFixed(0)}M`;
                        } else if (value >= 1000000) {
                          return `Rp ${(value / 1000000).toFixed(0)}Jt`;
                        }
                        return `Rp ${value.toLocaleString('id-ID')}`;
                      }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="trimmingValue"
                      stroke="#0284c7"
                      strokeWidth={2}
                      fill="url(#colorTrimming)"
                    >
                      <LabelList
                        dataKey="trimmingValue"
                        position="top"
                        fontSize={14}
                        fontWeight="bold"
                        fill="#374151"
                        formatter={(value: number) => {
                          if (value >= 1000000000) {
                            return `Rp ${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `Rp ${(value / 1000000).toFixed(1)}jt`;
                          }
                          return `Rp ${value.toLocaleString('id-ID')}`;
                        }}
                      />
                    </Area>
                  </AreaChart>
                );

              case 'bar':
                return (
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      width={80}
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `Rp ${(value / 1000000000).toFixed(0)}M`;
                        } else if (value >= 1000000) {
                          return `Rp ${(value / 1000000).toFixed(0)}jt`;
                        }
                        return `Rp ${value.toLocaleString('id-ID')}`;
                      }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="trimmingValue" radius={[2, 2, 0, 0]} fill="#0284c7">
                      <LabelList
                        dataKey="trimmingValue"
                        position="top"
                        fontSize={14}
                        fontWeight="bold"
                        fill="#374151"
                        formatter={(value: number) => {
                          if (value >= 1000000000) {
                            return `Rp ${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `Rp ${(value / 1000000).toFixed(1)}jt`;
                          }
                          return `Rp ${value.toLocaleString('id-ID')}`;
                        }}
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      width={80}
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `Rp ${(value / 1000000000).toFixed(0)}M`;
                        } else if (value >= 1000000) {
                          return `Rp ${(value / 1000000).toFixed(0)}jt`;
                        }
                        return `Rp ${value.toLocaleString('id-ID')}`;
                      }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="trimmingValue"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ fill: "#0284c7", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="trimmingValue"
                        position="top"
                        fontSize={14}
                        fontWeight="bold"
                        fill="#374151"
                        formatter={(value: number) => {
                          if (value >= 1000000000) {
                            return `Rp ${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `Rp ${(value / 1000000).toFixed(1)}jt`;
                          }
                          return `Rp ${value.toLocaleString('id-ID')}`;
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              case 'pie':
                return (
                  <div className="flex flex-col items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie
                        data={chartData.filter(item => item.trimmingValue > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          const value = entry.trimmingValue;
                          if (value >= 1000000000) {
                            return `${entry.name}: Rp ${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${entry.name}: Rp ${(value / 1000000).toFixed(1)}jt`;
                          }
                          return `${entry.name}: Rp ${value.toLocaleString('id-ID')}`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="trimmingValue"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getMonthColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                <p className="font-semibold text-sm">{data.name}</p>
                                <p className="text-sm">Rp {data.trimmingValue.toLocaleString('id-ID')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </div>
                );

              default:
                return (
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      width={80}
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `Rp ${(value / 1000000000).toFixed(0)}M`;
                        } else if (value >= 1000000) {
                          return `Rp ${(value / 1000000).toFixed(0)}jt`;
                        }
                        return `Rp ${value.toLocaleString('id-ID')}`;
                      }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="trimmingValue" radius={[2, 2, 0, 0]} fill="#0284c7">
                      <LabelList
                        dataKey="trimmingValue"
                        position="top"
                        fontSize={14}
                        fontWeight="bold"
                        fill="#374151"
                        formatter={(value: number) => {
                          if (value >= 1000000000) {
                            return `Rp ${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `Rp ${(value / 1000000).toFixed(1)}jt`;
                          }
                          return `Rp ${value.toLocaleString('id-ID')}`;
                        }}
                      />
                    </Bar>
                  </BarChart>
                );
            }
          })()}
        </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCardTr };
