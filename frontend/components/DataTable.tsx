"use client";

interface TableRow {
  [key: string]: unknown;
}

interface DataTableProps {
  columns: string[];
  data: TableRow[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      return value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  };

  // Create normalized key from column name
  const getKeyFromColumn = (col: string): string => {
    // Try exact match first
    const lowerCol = col.toLowerCase();

    // Common mappings
    const keyMap: Record<string, string[]> = {
      year: ["year"],
      "rainfall(mm)": ["rainfall (mm)", "rainfall(mm)", "rainfall"],
      "recharge(ham)": ["recharge (ham)", "recharge(ham)", "recharge"],
      "extractable(ham)": [
        "extractable (ham)",
        "extractable(ham)",
        "extractable",
      ],
      "extraction(ham)": ["extraction (ham)", "extraction(ham)", "extraction"],
      "stage(%)": ["stage (%)", "stage(%)", "stage", "stageofextraction"],
      category: ["category"],
    };

    // Find matching key
    for (const [normalizedKey, variants] of Object.entries(keyMap)) {
      if (variants.some((v) => lowerCol === v)) {
        return normalizedKey;
      }
    }

    // Fallback: remove spaces and special chars
    return col.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="">
            {columns.map((col) => (
              <th
                key={col}
                className="text-left px-3 py-2 font-semibold text-zinc-300"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const isTotal = row.source === "Total" || row.name === "Total";
            return (
              <tr
                key={idx}
                className={`${isTotal ? "font-semibold bg-zinc-800/50" : ""}`}
              >
                {columns.map((col) => {
                  const normalizedKey = getKeyFromColumn(col);
                  // Try multiple key variations
                  const value =
                    row[normalizedKey] || row[col] || row[col.toLowerCase()];
                  return (
                    <td key={col} className="px-3 py-2 text-zinc-200">
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
}
