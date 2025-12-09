import React from "react";

interface TableRow {
  [key: string]: unknown;
}

interface DataTableProps {
  columns: string[];
  data: TableRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data }) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      return value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  };

  const getKeyFromColumn = (col: string): string => {
    const lowerCol = col.toLowerCase();
    const keyMap: Record<string, string[]> = {
      year: ["year"],
      "rainfall(mm)": ["rainfall (mm)", "rainfall(mm)", "rainfall"],
      "recharge(ham)": ["recharge (ham)", "recharge(ham)", "recharge"],
      "extractable(ham)": ["extractable (ham)", "extractable(ham)", "extractable"],
      "extraction(ham)": ["extraction (ham)", "extraction(ham)", "extraction"],
      "stage(%)": ["stage (%)", "stage(%)", "stage", "stageofextraction"],
      category: ["category"],
    };

    for (const [normalizedKey, variants] of Object.entries(keyMap)) {
      if (variants.some((v) => lowerCol === v)) {
        return normalizedKey;
      }
    }
    return col.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  return (
    <div className="ig-overflow-x-auto ig-rounded-lg">
      <table className="ig-w-full ig-text-sm">
        <thead>
          <tr className="ig-bg-zinc-800">
            {columns.map((col) => (
              <th key={col} className="ig-text-left ig-px-3 ig-py-2 ig-font-semibold ig-text-zinc-300 ig-text-xs">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const isTotal = row.source === "Total" || row.name === "Total";
            return (
              <tr key={idx} className={`ig-border-t ig-border-zinc-700 ${isTotal ? "ig-font-semibold ig-bg-zinc-800/50" : ""}`}>
                {columns.map((col) => {
                  const normalizedKey = getKeyFromColumn(col);
                  const value = row[normalizedKey] || row[col] || row[col.toLowerCase()];
                  return (
                    <td key={col} className="ig-px-3 ig-py-2 ig-text-zinc-200 ig-text-xs">
                      {formatValue(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
