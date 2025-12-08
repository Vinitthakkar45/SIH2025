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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
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
                className={`border-b border-zinc-800 ${
                  isTotal ? "font-semibold bg-zinc-800/50" : ""
                }`}
              >
                {columns.map((col) => {
                  const key = col.toLowerCase().replace(/\s+/g, "");
                  const value = row[key] || row[col] || row[col.toLowerCase()];
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
