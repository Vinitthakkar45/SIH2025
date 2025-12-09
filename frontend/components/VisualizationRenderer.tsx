"use client";

import type {
  ChartDataItem,
  TableRow,
  Visualization,
} from "@/types/visualizations";
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

export default function VisualizationRenderer({
  visualizations,
}: VisualizationRendererProps) {
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
      if (
        viz.type === "table" ||
        viz.type === "stats" ||
        viz.type === "summary"
      ) {
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

  const renderSingleVisualization = (
    viz: Visualization,
    index: number,
    isNested: boolean = false
  ) => {
    // Stats/Summary Cards - Now collapsible
    if (viz.type === "stats" || viz.type === "summary") {
      return (
        <div key={index} data-chart-title={viz.title}>
          <DataAccordion
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
        </div>
      );
    }

    // Tables
    if (viz.type === "table" && viz.columns && viz.data) {
      return (
        <div key={index} data-chart-title={viz.title}>
          <DataAccordion
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
        </div>
      );
    }

    // Charts
    if (viz.type === "chart" && viz.data) {
      if (viz.chartType === "bar" || viz.chartType === "grouped_bar") {
        return (
          <div key={index} data-chart-title={viz.title}>
            <DataAccordion
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
          </div>
        );
      }

      if (viz.chartType === "pie") {
        return (
          <div key={index} data-chart-title={viz.title}>
            <DataAccordion
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
          </div>
        );
      }

      if (
        viz.chartType === "line" ||
        viz.chartType === "multi_line" ||
        viz.chartType === "area"
      ) {
        return (
          <div key={index} data-chart-title={viz.title}>
            <DataAccordion
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
          </div>
        );
      }
    }

    return null;
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
                trigger:
                  "hover:text-white cursor-pointer hover:bg-zinc-900 px-3 transition-colors rounded-lg group mb-2",
              }}
              title={<ViewChartTitle />}
            >
              <div className="space-y-3">
                {chartContent.map((viz, idx) =>
                  renderSingleVisualization(viz, idx, false)
                )}
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </>
  );
}
