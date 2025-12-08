"use client";

import type { ChartDataItem, TableRow, Visualization } from "@/types/visualizations";
import { isNullish } from "@/types/visualizations";
import { Accordion, AccordionItem } from "@heroui/react";
import BarChartComponent from "./charts/BarChartComponent";
import LineChartComponent from "./charts/LineChartComponent";
import PieChartComponent from "./charts/PieChartComponent";
import StatsChart from "./charts/StatsChart";
import ViewChartTitle from "./charts/ViewChartsTitle";
import DataAccordion from "./DataAccordion";
import DataTable from "./DataTable";

interface VisualizationRendererProps {
  visualizations: Visualization[];
}

/**
 * Filter out chart data items with null/undefined values
 */
function filterValidChartData(data: ChartDataItem[] | undefined): ChartDataItem[] {
  if (!data) return [];
  return data.filter((item) => {
    // Keep item if it has at least name and one non-null numeric value
    if (!item.name) return false;
    return !isNullish(item.value) || !isNullish(item.command) || !isNullish(item.nonCommand);
  });
}

/**
 * Filter out table rows with all null values
 */
function filterValidTableData(data: TableRow[] | undefined): TableRow[] {
  if (!data) return [];
  return data.filter((row) => {
    // Keep row if at least one value is non-null
    return Object.values(row).some((val) => !isNullish(val) && val !== "N/A" && val !== "");
  });
}

export default function VisualizationRenderer({ visualizations }: VisualizationRendererProps) {
  if (!visualizations || visualizations.length === 0) return null;

  // Flatten data_container visualizations first
  const flattenVisualizations = (vizList: Visualization[]): Visualization[] => {
    const flattened: Visualization[] = [];

    vizList.forEach((viz) => {
      if (viz.type === "data_container" && viz.visualizations) {
        // Recursively flatten nested visualizations
        flattened.push(...flattenVisualizations(viz.visualizations));
      } else {
        flattened.push(viz);
      }
    });

    return flattened;
  };

  const separateContent = (vizList: Visualization[]) => {
    const tabularContent: Visualization[] = [];
    const chartContent: Visualization[] = [];

    // First flatten any data_containers
    const flatViz = flattenVisualizations(vizList);

    flatViz.forEach((viz) => {
      if (viz.type === "table" || viz.type === "stats" || viz.type === "summary") {
        tabularContent.push(viz);
      } else if (viz.type === "chart") {
        chartContent.push(viz);
      } else if (viz.type === "collapsible" && viz.children) {
        // For collapsible, separate its children
        viz.children.forEach((child) => {
          if (child.type === "chart") {
            chartContent.push(child);
          } else {
            tabularContent.push(child);
          }
        });
      }
    });

    return { tabularContent, chartContent };
  };

  const { chartContent } = separateContent(visualizations);

  const renderSingleVisualization = (viz: Visualization, index: number, isNested: boolean = false) => {
    // Stats/Summary Cards - Now collapsible
    if (viz.type === "stats" || viz.type === "summary") {
      // Skip if no data
      if (!viz.data) return null;

      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.description}
          explanation={viz.explanation}
          defaultOpen={true}
          variant={isNested ? "light" : "shadow"}>
          <StatsChart title="" data={viz.data as Record<string, unknown>} explanation="" />
        </DataAccordion>
      );
    }

    // Tables
    if (viz.type === "table" && viz.columns && viz.data) {
      // Filter out rows with all null values
      const filteredData = filterValidTableData(viz.data as TableRow[]);

      // Skip rendering if no valid data
      if (filteredData.length === 0) return null;

      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.headerValue ? `Total: ${viz.headerValue.toLocaleString("en-IN")} ham` : viz.description}
          explanation={viz.explanation}
          defaultOpen={true}
          variant={isNested ? "light" : "shadow"}>
          <DataTable columns={viz.columns} data={filteredData} />
        </DataAccordion>
      );
    }

    // Charts
    if (viz.type === "chart" && viz.data) {
      if (viz.chartType === "bar" || viz.chartType === "grouped_bar") {
        // Filter out items with null values
        const filteredData = filterValidChartData(viz.data as ChartDataItem[]);

        // Skip rendering if no valid data
        if (filteredData.length === 0) return null;

        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}>
            <BarChartComponent title="" data={filteredData} color={viz.color} colorByValue={viz.colorByValue} />
          </DataAccordion>
        );
      }

      if (viz.chartType === "pie") {
        // Filter out pie data with null values
        const pieData = (viz.data as { name: string; value: number }[]).filter((item) => !isNullish(item.value) && item.value > 0);

        // Skip if no valid pie data
        if (pieData.length === 0) return null;

        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}>
            <PieChartComponent title="" data={pieData} />
          </DataAccordion>
        );
      }

      if (viz.chartType === "line" || viz.chartType === "multi_line" || viz.chartType === "area") {
        // Filter line data - keep rows that have at least one non-null numeric value
        const lineData = (viz.data as Record<string, unknown>[]).filter((row) => {
          return Object.entries(row).some(([key, val]) => {
            if (key === "year" || key === "name" || key === "date") return false;
            return typeof val === "number" && !isNaN(val);
          });
        });

        // Skip if no valid data
        if (lineData.length === 0) return null;

        return (
          <DataAccordion
            key={index}
            title={viz.title}
            subtitle={viz.description}
            explanation={viz.explanation}
            defaultOpen={true}
            variant={isNested ? "light" : "shadow"}>
            <LineChartComponent title="" data={lineData} chartType={viz.chartType} />
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
        <DataAccordion key={index} title={viz.title} subtitle={viz.subtitle} explanation={viz.explanation} defaultOpen={false}>
          <div className="space-y-3">
            {viz.visualizations.map((innerViz, idx) =>
              innerViz.type === "collapsible" || innerViz.type === "data_container"
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
        <DataAccordion key={index} title={viz.title} subtitle={viz.subtitle} explanation={viz.explanation} defaultOpen={viz.defaultOpen !== false}>
          <div className="space-y-3">{viz.children.map((child: Visualization, idx: number) => renderSingleVisualization(child, idx, true))}</div>
        </DataAccordion>
      );
    }

    // Fallback for non-container visualizations
    return renderSingleVisualization(viz, index);
  };

  return (
    <>
      {chartContent.length > 0 && (
        <div className="flex justify-center border-t-zinc-800 border-t-1 pt-6 mt-10">
          <Accordion variant="light" className="px-0 " isCompact>
            <AccordionItem
              key={"charts"}
              aria-label={"Visualizations"}
              classNames={{
                trigger: "hover:text-white cursor-pointer hover:bg-zinc-900 px-3 transition-colors rounded-lg group mb-2",
              }}
              title={<ViewChartTitle />}>
              <div className="space-y-3">{chartContent.map((viz, idx) => renderSingleVisualization(viz, idx, false))}</div>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </>
  );
}
