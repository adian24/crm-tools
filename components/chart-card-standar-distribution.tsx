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

export const description = "Standar Distribution Multi-Chart"

const chartConfig = {
  count: { label: "Jumlah Sertifikat" },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-1">{data.std}</p>
        <p className="text-xs text-muted-foreground mb-1">{data.companyCount} Perusahaan</p>
        <p className="text-sm font-bold">{data.count} Sertifikat</p>
      </div>
    );
  }
  return null;
};

interface ChartCardStandarDistributionProps {
  title: string
  data: any[]
  chartType?: string
}

function ChartCardStandarDistribution({
  title,
  data,
  chartType = 'bar'
}: ChartCardStandarDistributionProps) {
  // Generate 15 different colors for standar
  const colors = [
    '#640654'
  ];

  const getStandarColor = (index: number) => {
    return colors[index % colors.length];
  };

  // Process data for chart
  const getChartData = () => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      std: item.std,
      count: item.count,
      companyCount: item.companyCount
    }));
  };

  const chartData = getChartData();

  const hasData = chartData.length > 0;

  // Calculate totals for summary
  const totalStandars = chartData.length;
  const totalSertifikat = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-400/10 to-transparent opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5"></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-xs text-center font-semibold text-black/70 mt-1">
          Total: <span className="font-bold text-indigo-600">{totalStandars}</span> Standar |
          <span className="ml-2 font-bold text-indigo-600">{totalSertifikat}</span> Sertifikat
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] sm:h-[280px] md:h-[320px] w-full"
            style={{ minWidth: `${chartData.length * 80}px` }}
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
                      {chartData.map((_, index) => (
                        <linearGradient key={`gradient-${index}`} id={`colorStandar${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getStandarColor(index)} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={getStandarColor(index)} stopOpacity={0.1}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="std"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={getStandarColor(0)}
                      strokeWidth={2}
                      fill="url(#colorStandar0)"
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        fontSize={13}
                        fontWeight="bold"
                        fill="#374151"
                      />
                    </Area>
                  </AreaChart>
                );

              case 'bar':
                return (
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="std"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((standar, index) => (
                        <Cell key={`cell-${index}`} fill={getStandarColor(index)} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        fontSize={13}
                        fontWeight="bold"
                        fill="#374151"
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="std"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={getStandarColor(0)}
                      strokeWidth={2}
                      dot={{ fill: getStandarColor(0), strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        fontSize={13}
                        fontWeight="bold"
                        fill="#374151"
                      />
                    </Line>
                  </LineChart>
                );

              case 'pie':
                return (
                  <div className="flex flex-col items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          return `${entry.std}: ${entry.count}`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStandarColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                <p className="font-semibold text-sm">{data.std}</p>
                                <p className="text-xs text-muted-foreground">{data.companyCount} Perusahaan</p>
                                <p className="text-sm">{data.count} Sertifikat</p>
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
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="std"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15, fontWeight: 600 }}
                      className="fill-muted-foreground"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((standar, index) => (
                        <Cell key={`cell-${index}`} fill={getStandarColor(index)} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        fontSize={13}
                        fontWeight="bold"
                        fill="#374151"
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

export { ChartCardStandarDistribution };
