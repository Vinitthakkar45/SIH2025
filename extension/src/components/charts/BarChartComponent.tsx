import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BarChartComponentProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  color?: string;
  colorByValue?: boolean;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ title, description, data, color, colorByValue }) => {
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
  const nameKey = Object.keys(firstItem).find((k) => k.toLowerCase() === "name" || k.toLowerCase() === "source" || k === "category") || "name";

  const dataKeys = Object.keys(firstItem).filter((k) => k !== nameKey && typeof firstItem[k] === "number");

  return (
    <div className="ig-bg-zinc-800 ig-rounded-lg ig-p-4 ig-my-2">
      <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-1">{title}</h4>
      {description && <p className="ig-text-sm ig-text-zinc-400 ig-mb-3">{description}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="0" stroke="#3f3f46" strokeWidth={0} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#52525b" strokeWidth={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#52525b" strokeWidth={0} axisLine={false} tickLine={false} />
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
          {dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]}>
              {colorByValue && data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
