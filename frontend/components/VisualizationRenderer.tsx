"use client";

import BarChartComponent from "./charts/BarChartComponent";
import PieChartComponent from "./charts/PieChartComponent";
import LineChartComponent from "./charts/LineChartComponent";
import StatsChart from "./charts/StatsChart";
import DataTable from "./DataTable";
import DataAccordion from "./DataAccordion";
import type {
  Visualization,
  TableRow,
  ChartDataItem,
} from "@/types/visualizations";

interface VisualizationRendererProps {
  visualizations: Visualization[];
}

export default function VisualizationRenderer({
  visualizations,
}: VisualizationRendererProps) {
  if (!visualizations || visualizations.length === 0) return null;

  const renderSingleVisualization = (
    viz: Visualization,
    index: number,
    isNested: boolean = false
  ) => {
    // Stats/Summary Cards - Now collapsible
    if (viz.type === "stats" || viz.type === "summary") {
      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.description}
          explanation={viz.explanation}
          defaultOpen={true}
          variant={isNested ? "light" : "shadow"}
        >
          <StatsChart
            title=""
            data={viz.data as Record<string, unknown>}
            explanation=""
          />
        </DataAccordion>
      );
    }

    // Tables
    if (viz.type === "table" && viz.columns && viz.data) {
      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={
            viz.headerValue
              ? `Total: ${viz.headerValue.toLocaleString("en-IN")} ham`
              : viz.description
          }
          explanation={viz.explanation}
          defaultOpen={true}
          variant={isNested ? "light" : "shadow"}
        >
          <DataTable columns={viz.columns} data={viz.data as TableRow[]} />
        </DataAccordion>
      );
    }

    // Charts
    if (viz.type === "chart" && viz.data) {
      if (viz.chartType === "bar" || viz.chartType === "grouped_bar") {
        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}
          >
            <BarChartComponent
              title=""
              data={viz.data as ChartDataItem[]}
              color={viz.color}
              colorByValue={viz.colorByValue}
            />
          </DataAccordion>
        );
      }

      if (viz.chartType === "pie") {
        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}
          >
            <PieChartComponent
              title=""
              data={viz.data as { name: string; value: number }[]}
            />
          </DataAccordion>
        );
      }

      if (
        viz.chartType === "line" ||
        viz.chartType === "multi_line" ||
        viz.chartType === "area"
      ) {
        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}
          >
            <LineChartComponent
              title=""
              data={viz.data as Record<string, unknown>[]}
              chartType={viz.chartType}
            />
          </DataAccordion>
        );
      }
    }

    return null;
  };

  const renderVisualization = (viz: Visualization, index: number) => {
    // Data container - outer collapsible that contains all visualizations
    if (viz.type === "data_container" && viz.visualizations) {
      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.subtitle}
          explanation={viz.explanation}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {viz.visualizations.map((innerViz, idx) =>
              innerViz.type === "collapsible" ||
              innerViz.type === "data_container"
                ? renderVisualization(innerViz, idx)
                : renderSingleVisualization(innerViz, idx, true)
            )}
          </div>
        </DataAccordion>
      );
    }

    // Collapsible type - nested visualizations in a collapsible block
    if (viz.type === "collapsible" && viz.children) {
      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.subtitle}
          explanation={viz.explanation}
          defaultOpen={viz.defaultOpen !== false}
        >
          <div className="space-y-3">
            {viz.children.map((child: Visualization, idx: number) =>
              renderSingleVisualization(child, idx, true)
            )}
          </div>
        </DataAccordion>
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
