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

export const description = "Associate Analytics Monthly Multi-Series Chart"

const chartConfig = {
  Direct: { label: "Direct" },
  Associate: { label: "Associate" },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">Rp {entry.value.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartCardAssociateMonthlyProps {
  title: string
  data: any[]
  chartType?: string
}

function ChartCardAssociateMonthly({
  title,
  data,
  chartType = 'area'
}: ChartCardAssociateMonthlyProps) {
  // Month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Associate colors
  const associateColors = {
    Direct: '#3B82F6', // Blue
    Associate: '#10B981', // Green
  };

  // Process data for chart - create multi-series data
  const getChartData = () => {
    if (!data || data.length === 0) {
      return monthNames.map(month => ({
        month,
        Direct: 0,
        Associate: 0
      }));
    }

    // Initialize data for all months
    const monthlyData: { [key: string]: { Direct: number; Associate: number } } = {};
    monthNames.forEach(month => {
      monthlyData[month] = { Direct: 0, Associate: 0 };
    });

    // Group by month and associate type
    data.forEach(item => {
      // Extract month from bulanExpDate
      let monthIndex = 0;
      const bulanExp = item.bulanExpDate || '';

      // Try to parse as number first (1-12)
      const bulanNum = parseInt(bulanExp);
      if (!isNaN(bulanNum) && bulanNum >= 1 && bulanNum <= 12) {
        monthIndex = bulanNum - 1;
      } else {
        // Try to parse as month name
        const monthMap: { [key: string]: number } = {
          'januari': 0, 'jan': 0, 'februari': 1, 'feb': 1, 'maret': 2, 'mar': 2,
          'april': 3, 'apr': 3, 'mei': 4, 'may': 4, 'juni': 5, 'jun': 5,
          'juli': 6, 'jul': 6, 'agustus': 7, 'aug': 7, 'september': 8, 'sep': 8,
          'oktober': 9, 'oct': 9, 'november': 10, 'nov': 10, 'desember': 11, 'dec': 11
        };
        monthIndex = monthMap[bulanExp.toLowerCase()] || 0;
      }

      const monthName = monthNames[monthIndex];
      const associateType = item.directOrAssociate || 'Direct'; // Use directOrAssociate field

      // Add hargaKontrak to the corresponding month and associate type
      if (monthlyData[monthName] && associateType in monthlyData[monthName]) {
        monthlyData[monthName][associateType as keyof typeof monthlyData[typeof monthName]] += item.hargaKontrak || 0;
      }
    });

    // Convert to array
    const chartData = monthNames.map(month => ({
      month,
      ...monthlyData[month]
    }));

    return chartData;
  };

  const chartData = getChartData();

  const hasData = chartData.length > 0 && chartData.some(item =>
    item.Direct > 0 || item.Associate > 0
  );

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-400/10 to-transparent opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 via-transparent to-blue-500/5"></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-sm text-center font-semibold text-black/70">
          Total: {data.length} data
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] sm:h-[280px] md:h-[320px] w-full"
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
              case 'bar':
                return (
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="Direct" fill={associateColors.Direct} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="Direct"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={associateColors.Direct}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Bar>
                    <Bar dataKey="Associate" fill={associateColors.Associate} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="Associate"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={associateColors.Associate}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Direct"
                      stroke={associateColors.Direct}
                      strokeWidth={2}
                      dot={{ fill: associateColors.Direct, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="Direct"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={associateColors.Direct}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="Associate"
                      stroke={associateColors.Associate}
                      strokeWidth={2}
                      dot={{ fill: associateColors.Associate, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="Associate"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={associateColors.Associate}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              case 'pie':
                // Calculate totals per associate type for pie chart
                const associateTotals = chartData.reduce((acc, month) => {
                  return {
                    Direct: acc.Direct + month.Direct,
                    Associate: acc.Associate + month.Associate,
                  };
                }, { Direct: 0, Associate: 0 });

                const pieData = [
                  { name: 'Direct', value: associateTotals.Direct, color: associateColors.Direct },
                  { name: 'Associate', value: associateTotals.Associate, color: associateColors.Associate },
                ].filter(item => item.value > 0);

                return (
                  <div className="flex flex-col items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          const value = entry.value;
                          let label = '';
                          if (value >= 1000000000) {
                            label = (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            label = (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            label = (value / 1000).toFixed(0) + 'rb';
                          }
                          return `${entry.name}: ${label}`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                <p className="font-semibold text-sm">{payload[0].name}</p>
                                <p className="text-sm">Rp {(payload[0].value || 0).toLocaleString('id-ID')}</p>
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

              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={associateColors.Direct} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={associateColors.Direct} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorAssociate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={associateColors.Associate} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={associateColors.Associate} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Direct"
                      stroke={associateColors.Direct}
                      strokeWidth={2}
                      fill="url(#colorDirect)"
                    >
                      <LabelList
                        dataKey="Direct"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={associateColors.Direct}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="Associate"
                      stroke={associateColors.Associate}
                      strokeWidth={2}
                      fill="url(#colorAssociate)"
                    >
                      <LabelList
                        dataKey="Associate"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={associateColors.Associate}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                  </AreaChart>
                );
            }
          })()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export { ChartCardAssociateMonthly };
