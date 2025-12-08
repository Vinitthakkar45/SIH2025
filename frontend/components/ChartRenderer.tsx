"use client";
"use i18n";

import BarChartComponent from "./charts/BarChartComponent";
import PieChartComponent from "./charts/PieChartComponent";
import StatsChart from "./charts/StatsChart";

interface ChartData {
  type: "chart" | "stats";
  chartType?: "bar" | "pie";
  title: string | React.ReactElement;
  description?: string | React.ReactElement;
  data: Record<string, unknown>[] | Record<string, unknown>;
}

export default function ChartRenderer({ chart }: { chart: ChartData }) {
  if (chart.type === "stats") {
    return (
      <StatsChart
        title={chart.title}
        data={chart.data as Record<string, unknown>}
      />
    );
  }

  if (chart.chartType === "bar") {
    return (
      <BarChartComponent
        title={chart.title}
        description={chart.description}
        data={chart.data as Record<string, unknown>[]}
      />
    );
  }

  if (chart.chartType === "pie") {
    return (
      <PieChartComponent
        title={chart.title}
        description={chart.description}
        data={chart.data as { name: string; value: number }[]}
      />
    );
  }

  return null;
}
