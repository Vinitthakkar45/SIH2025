import React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartComponentProps {
  title: string;
  description?: string;
  data: { name: string; value: number }[];
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CATEGORY_COLORS: Record<string, string> = {
  safe: "#22c55e",
  semi_critical: "#3b82f6",
  critical: "#f59e0b",
  over_exploited: "#ef4444",
  salinity: "#8b5cf6",
  hilly_area: "#6b7280",
  no_data: "#9ca3af",
};

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ title, description, data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="ig-bg-zinc-800 ig-rounded-lg ig-p-4 ig-my-2">
        <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-1">{title}</h4>
        {description && <p className="ig-text-sm ig-text-zinc-400 ig-mb-3">{description}</p>}
        <p className="ig-text-zinc-500 ig-text-center ig-py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="ig-bg-zinc-800 ig-rounded-lg ig-p-4 ig-my-2">
      <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-1">{title}</h4>
      {description && <p className="ig-text-sm ig-text-zinc-400 ig-mb-3">{description}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            stroke="none"
            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
            labelLine={{ stroke: "#71717a", strokeWidth: 1 }}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
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
          <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
