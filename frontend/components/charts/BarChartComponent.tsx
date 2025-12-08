"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BarChartComponentProps {
  title: string | React.ReactElement;
  description?: string | React.ReactElement;
  data: Record<string, unknown>[];
  color?: string;
  colorByValue?: boolean;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(4, 90%, 58%)",
  "hsl(258, 90%, 66%)",
  "hsl(330, 81%, 60%)",
];

export default function BarChartComponent({
  title,
  description,
  data,
  color,
  colorByValue,
}: BarChartComponentProps) {
  // Build chart config dynamically
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

  // Find the key used for names (could be "name", "Name", "Source", etc.)
  const firstItem = data[0];
  const nameKey =
    Object.keys(firstItem).find(
      (k) =>
        k.toLowerCase() === "name" ||
        k.toLowerCase() === "source" ||
        k === "category"
    ) || "name";

  const dataKeys = Object.keys(firstItem).filter(
    (k) => k !== nameKey && typeof firstItem[k] === "number"
  );

  dataKeys.forEach((key, i) => {
    chartConfig[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: color || COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="bg-zinc-800 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-zinc-100 mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-zinc-400 mb-3">{description}</p>
      )}
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="0" stroke="#3f3f46" strokeWidth={0} />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            stroke="#52525b"
            strokeWidth={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            stroke="#52525b"
            strokeWidth={0}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
            cursor={false}
          />
          {dataKeys.length > 1 && (
            <Legend wrapperStyle={{ color: "#a1a1aa" }} iconType="circle" />
          )}
          {dataKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color || COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
            >
              {colorByValue &&
                data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      (entry.fill as string) ||
                      color ||
                      COLORS[i % COLORS.length]
                    }
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
