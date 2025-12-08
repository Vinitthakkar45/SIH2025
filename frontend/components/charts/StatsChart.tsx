interface StatsChartProps {
  title: string;
  data: Record<string, unknown>;
}

export default function StatsChart({ title, data }: StatsChartProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-zinc-100 mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-zinc-900 p-3 rounded-lg">
            <p className="text-xs text-zinc-400 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className="text-lg font-semibold text-zinc-100">
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
}
