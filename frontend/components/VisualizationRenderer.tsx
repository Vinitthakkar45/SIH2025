"use client";

import BarChartComponent from "./charts/BarChartComponent";
import PieChartComponent from "./charts/PieChartComponent";
import LineChartComponent from "./charts/LineChartComponent";
import StatsChart from "./charts/StatsChart";
import DataTable from "./DataTable";
import CollapsibleDataBlock from "./CollapsibleDataBlock";
import type {
  Visualization,
  TableRow,
  ChartDataItem,
} from "@/types/visualizations";

interface VisualizationRendererProps {
  visualizations: Visualization[];
}

export default function VisualizationRenderer({ visualizations }: VisualizationRendererProps) {
  if (!visualizations || visualizations.length === 0) return null;

  const renderSingleVisualization = (viz: Visualization, index: number) => {
    // Stats/Summary Cards - Always open, not collapsible
    if (viz.type === "stats" || viz.type === "summary") {
      return (
        <div key={index}>
          <StatsChart
            title={viz.title}
            data={viz.data as Record<string, unknown>}
          />
        </div>
      );
    }

    // Tables
    if (viz.type === "table" && viz.columns && viz.data) {
      return (
        <CollapsibleDataBlock
          key={index}
          title={viz.title}
          subtitle={
            viz.headerValue
              ? `Total: ${viz.headerValue.toLocaleString("en-IN")} ham`
              : viz.description
          }
          defaultOpen={true}
        >
          <DataTable columns={viz.columns} data={viz.data as TableRow[]} />
        </CollapsibleDataBlock>
      );
    }

    // Charts
    if (viz.type === "chart" && viz.data) {
      if (viz.chartType === "bar" || viz.chartType === "grouped_bar") {
        return (
          <CollapsibleDataBlock
            key={index}
            title={viz.title}
            subtitle={viz.description}
            defaultOpen={true}
          >
            <BarChartComponent
              title=""
              data={viz.data as ChartDataItem[]}
              color={viz.color}
              colorByValue={viz.colorByValue}
            />
          </CollapsibleDataBlock>
        );
      }

      if (viz.chartType === "pie") {
        return (
          <CollapsibleDataBlock
            key={index}
            title={viz.title}
            subtitle={viz.description}
            defaultOpen={true}
          >
            <PieChartComponent
              title=""
              data={viz.data as { name: string; value: number }[]}
            />
          </CollapsibleDataBlock>
        );
      }

      if (
        viz.chartType === "line" ||
        viz.chartType === "multi_line" ||
        viz.chartType === "area"
      ) {
        return (
          <CollapsibleDataBlock
            key={index}
            title={viz.title}
            subtitle={viz.description}
            defaultOpen={true}
          >
            <LineChartComponent
              title=""
              data={viz.data as Record<string, unknown>[]}
              chartType={viz.chartType}
            />
          </CollapsibleDataBlock>
        );
      }
    }

    return null;
  };

  const renderVisualization = (viz: Visualization, index: number) => {
    // Data container - outer collapsible that contains all visualizations
    if (viz.type === "data_container" && viz.visualizations) {
      return (
        <CollapsibleDataBlock
          key={index}
          title={viz.title}
          subtitle={viz.subtitle}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {viz.visualizations.map((innerViz, idx) =>
              renderSingleVisualization(innerViz, idx)
            )}
          </div>
        </CollapsibleDataBlock>
      );
    }

    // Fallback for non-container visualizations
    return renderSingleVisualization(viz, index);
  };

  return (
    <div className="space-y-3">
      {visualizations.map((viz, idx) => renderVisualization(viz, idx))}
    </div>
  );
}
