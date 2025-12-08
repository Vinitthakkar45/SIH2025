"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LineChartComponentProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  chartType?: "line" | "multi_line" | "area";
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(4, 90%, 58%)",
  "hsl(258, 90%, 66%)",
  "hsl(330, 81%, 60%)",
];

export default function LineChartComponent({
  title,
  description,
  data,
  chartType = "line",
}: LineChartComponentProps) {
  const chartConfig: ChartConfig = {};

  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 my-2">
        <h4 className="font-semibold text-zinc-100 mb-1">{title}</h4>
        {description && (
          <p className="text-sm text-zinc-400 mb-3">{description}</p>
        )}
        <p className="text-zinc-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const firstItem = data[0];
  const xKey =
    Object.keys(firstItem).find((k) => k.toLowerCase() === "year") || "year";
  const dataKeys = Object.keys(firstItem).filter(
    (k) => k !== xKey && typeof firstItem[k] === "number"
  );

  dataKeys.forEach((key, i) => {
    chartConfig[key] = {
      label:
        key.charAt(0).toUpperCase() +
        key
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
      color: COLORS[i % COLORS.length],
    };
  });

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;
  const DataComponent = chartType === "area" ? Area : Line;

  return (
    <div className="bg-zinc-800 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-zinc-100 mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-zinc-400 mb-3">{description}</p>
      )}
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            stroke="#52525b"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            stroke="#52525b"
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {dataKeys.length > 1 && (
            <Legend wrapperStyle={{ color: "#a1a1aa" }} iconType="line" />
          )}
          {dataKeys.map((key, i) => (
            <DataComponent
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              fill={
                chartType === "area" ? COLORS[i % COLORS.length] : undefined
              }
              fillOpacity={chartType === "area" ? 0.3 : undefined}
              strokeWidth={2}
              dot={dataKeys.length === 1 ? { r: 4 } : false}
            />
          ))}
        </ChartComponent>
      </ChartContainer>
    </div>
  );
}
