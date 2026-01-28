"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList, Rectangle, Tooltip } from "recharts"

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

export const description = "CRM Data Analytics Chart"

const chartConfig = {
  MRC: {
    label: "MRC",
  },
  DHA: {
    label: "DHA",
  },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-1">{label}</p>
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

interface ChartCardCrmDataProps {
  title: string
  data: any[]
  statusColor: string
  chartType?: string
  filterTahun?: string
  filterPicCrm?: string
  filterProvinsi?: string
  filterKota?: string
  isFullWidth?: boolean
}

function ChartCardCrmData({
  title,
  data,
  statusColor,
  chartType = 'area',
  filterTahun,
  filterPicCrm,
  filterProvinsi,
  filterKota,
  isFullWidth = false
}: ChartCardCrmDataProps) {
  // Month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get colors for MRC and DHA
  const mrcColor = 'hsl(280, 70%, 50%)'; // Purple
  const dhaColor = 'hsl(210, 80%, 50%)'; // Blue

  // Colors for pie chart
  const pieColors = [
    'hsl(280, 70%, 50%)',   // Purple
    'hsl(210, 80%, 50%)',   // Blue
    'hsl(140, 60%, 50%)',   // Green
    'hsl(30, 90%, 55%)',    // Orange
    'hsl(340, 80%, 55%)',   // Pink
    'hsl(180, 70%, 45%)',   // Cyan
    'hsl(260, 70%, 55%)',   // Violet
    'hsl(20, 85%, 60%)',    // Amber
    'hsl(160, 60%, 45%)',   // Teal
    'hsl(300, 70%, 55%)',   // Magenta
    'hsl(40, 90%, 55%)',    // Yellow
    'hsl(120, 60%, 45%)',   // Lime
  ];

  // Process data for chart - group by month and separate by PIC
  const getChartData = () => {
    if (!data || data.length === 0) {
      return monthNames.map(month => ({ month, MRC: 0, DHA: 0 }));
    }

    // Initialize data for all months
    const monthlyData: { [key: string]: { MRC: number; DHA: number } } = {};
    monthNames.forEach(month => {
      monthlyData[month] = { MRC: 0, DHA: 0 };
    });

    // Group by month and picCrm
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
      const picCrm = (item.picCrm || '').toUpperCase();

      // Add hargaKontrak to the corresponding month and PIC
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { MRC: 0, DHA: 0 };
      }

      if (picCrm === 'MRC') {
        monthlyData[monthName].MRC += item.hargaKontrak || 0;
      } else if (picCrm === 'DHA') {
        monthlyData[monthName].DHA += item.hargaKontrak || 0;
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

  // Determine background gradient
  const getBackgroundGradient = () => {
    return 'bg-gradient-to-br from-purple-500/20 via-blue-400/10 to-transparent';
  };

  const hasData = chartData.length > 0 && (chartData.some(item => item.MRC > 0) || chartData.some(item => item.DHA > 0));

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className={`absolute inset-0 ${getBackgroundGradient()} opacity-60`}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-sm text-center font-semibold text-black/70">
          Total: {data.length} data | MRC: Rp {chartData.reduce((sum, item) => sum + (item.MRC || 0), 0).toLocaleString('id-ID')} | DHA: Rp {chartData.reduce((sum, item) => sum + (item.DHA || 0), 0).toLocaleString('id-ID')}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] sm:h-[220px] md:h-[250px] w-full"
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
                    <Bar dataKey="MRC" fill={mrcColor} radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="MRC"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={mrcColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Bar>
                    <Bar dataKey="DHA" fill={dhaColor} radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="DHA"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={dhaColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
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
                    <Line
                      type="monotone"
                      dataKey="MRC"
                      stroke={mrcColor}
                      strokeWidth={2}
                      dot={{ fill: mrcColor, strokeWidth: 1.5, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="MRC"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={mrcColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="DHA"
                      stroke={dhaColor}
                      strokeWidth={2}
                      dot={{ fill: dhaColor, strokeWidth: 1.5, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="DHA"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={dhaColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              case 'pie':
                // Prepare pie data - total value per month
                const pieData = chartData
                  .map((item, index) => ({
                    name: item.month,
                    value: item.MRC + item.DHA,
                    color: pieColors[index % pieColors.length]
                  }))
                  .filter(item => item.value > 0);

                if (pieData.length === 0) {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-muted-foreground text-sm">No data available</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );

              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorMRC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={mrcColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={mrcColor} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorDHA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={dhaColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={dhaColor} stopOpacity={0.2}/>
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
                    <Area
                      type="monotone"
                      dataKey="MRC"
                      stroke={mrcColor}
                      strokeWidth={2}
                      fill="url(#colorMRC)"
                    >
                      <LabelList
                        dataKey="MRC"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={mrcColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="DHA"
                      stroke={dhaColor}
                      strokeWidth={2}
                      fill="url(#colorDHA)"
                    >
                      <LabelList
                        dataKey="DHA"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={dhaColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Area>
                  </AreaChart>
                );
            }
          })()}
        </ChartContainer>

        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-4 mt-3 p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: mrcColor }}></div>
            <span className="text-xs font-medium">MRC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: dhaColor }}></div>
            <span className="text-xs font-medium">DHA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCardCrmData };
