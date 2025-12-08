interface StatsChartProps {
  title: string;
  data: Record<string, unknown>;
  explanation?: string;
}

export default function StatsChart({
  title,
  data,
  explanation,
}: StatsChartProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-zinc-100 mb-3">{title}</h4>
      {explanation && (
        <div className="bg-zinc-900/50 rounded-md px-3 py-2 mb-3 border-l-2 border-blue-500">
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="text-blue-400 font-medium">
              💡 What this means:{" "}
            </span>
            {explanation}
          </p>
        </div>
      )}
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
