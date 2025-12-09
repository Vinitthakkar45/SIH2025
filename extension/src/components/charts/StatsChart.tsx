import React from "react";

interface StatsChartProps {
  title?: string;
  data: Record<string, unknown>;
  explanation?: string;
}

export const StatsChart: React.FC<StatsChartProps> = ({ title, data }) => {
  return (
    <div className="ig-bg-transparent">
      {title && <h4 className="ig-font-semibold ig-text-zinc-100 ig-mb-3">{title}</h4>}
      <div className="ig-grid ig-grid-cols-2 ig-gap-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="ig-bg-zinc-900 ig-p-3 ig-rounded-lg">
            <p className="ig-text-xs ig-text-zinc-400 ig-capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
            <p className="ig-text-base ig-font-semibold ig-text-zinc-100">
              {typeof value === "number"
                ? value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })
                : String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
