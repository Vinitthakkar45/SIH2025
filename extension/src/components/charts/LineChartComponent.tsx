import React from "react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";

interface LineChartComponentProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  chartType?: "line" | "multi_line" | "area";
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ title, description, data, chartType = "line" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="ig-bg-zinc-800 ig-rounded-lg ig-p-4 ig-my-2">
        <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-1">{title}</h4>
        {description && <p className="ig-text-sm ig-text-zinc-400 ig-mb-3">{description}</p>}
        <p className="ig-text-zinc-500 ig-text-center ig-py-8">No data available</p>
      </div>
    );
  }

  const firstItem = data[0];
  const xKey = Object.keys(firstItem).find((k) => k.toLowerCase() === "year") || "year";
  const dataKeys = Object.keys(firstItem).filter((k) => k !== xKey && typeof firstItem[k] === "number");

  const isArea = chartType === "area";
  const ChartComponent = isArea ? AreaChart : LineChart;

  return (
    <div className="ig-bg-zinc-800 ig-rounded-lg ig-p-4 ig-my-2">
      <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-1">{title}</h4>
      {description && <p className="ig-text-sm ig-text-zinc-400 ig-mb-3">{description}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <ChartComponent data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#52525b" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#52525b" axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#fafafa" }}
            itemStyle={{ color: "#a1a1aa" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
          {dataKeys.map((key, i) =>
            isArea ? (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[i % COLORS.length], strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
