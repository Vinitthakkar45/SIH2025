"use client";

import { Cell, Legend, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PieChartComponentProps {
  title: string | React.ReactElement;
  description?: string | React.ReactElement;
  data: { name: string; value: number }[];
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(4, 90%, 58%)",
  "hsl(258, 90%, 66%)",
  "hsl(330, 81%, 60%)",
];

const CATEGORY_COLORS: Record<string, string> = {
  safe: "hsl(142, 71%, 45%)",
  semi_critical: "hsl(217, 91%, 60%)",
  critical: "hsl(38, 92%, 50%)",
  over_exploited: "hsl(4, 90%, 58%)",
  salinity: "hsl(258, 90%, 66%)",
  hilly_area: "hsl(0, 0%, 42%)",
  no_data: "hsl(0, 0%, 64%)",
};

export default function PieChartComponent({
  title,
  description,
  data,
}: PieChartComponentProps) {
  // Build chart config dynamically
  const chartConfig: ChartConfig = {};
  data.forEach((entry, index) => {
    chartConfig[entry.name] = {
      label: entry.name,
      color: CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length],
    };
  });

  return (
    <div className="bg-zinc-800 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-zinc-100 mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-zinc-400 mb-3">{description}</p>
      )}
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            stroke="none"
            label={({ name, percent }) =>
              `${name} (${((percent || 0) * 100).toFixed(0)}%)`
            }
            labelLine={{ stroke: "#71717a", strokeWidth: 1 }}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]
                }
                stroke="none"
              />
            ))}
          </Pie>
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" hideLabel />}
          />
          <Legend wrapperStyle={{ color: "#a1a1aa" }} iconType="circle" />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
