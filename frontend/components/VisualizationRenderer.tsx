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
import DataAccordion from "./DataAccordion";
import DataTable from "./DataTable";
import { ChartAverageIcon } from "./icons";

interface VisualizationRendererProps {
  visualizations: Visualization[];
}

export default function VisualizationRenderer({
  visualizations,
}: VisualizationRendererProps) {
  if (!visualizations || visualizations.length === 0) return null;

  const separateContent = (vizList: Visualization[]) => {
    const tabularContent: Visualization[] = [];
    const chartContent: Visualization[] = [];

    vizList.forEach((viz) => {
      if (
        viz.type === "table" ||
        viz.type === "stats" ||
        viz.type === "summary"
      ) {
        tabularContent.push(viz);
      } else if (viz.type === "chart") {
        chartContent.push(viz);
      } else if (viz.type === "data_container" || viz.type === "collapsible") {
        tabularContent.push(viz);
      }
    });

    return { tabularContent, chartContent };
  };

  const { tabularContent, chartContent } = separateContent(visualizations);

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
      {/* Tables & Stats - Visible by default, NO accordion wrapper */}
      {tabularContent.length > 0 && (
        <div className="space-y-3">
          {tabularContent.map((viz, idx) => renderVisualization(viz, idx))}
        </div>
      )}

      {/* Charts - Hidden in accordion at the bottom */}
      {chartContent.length > 0 && (
        <Accordion variant="shadow" isCompact>
          <AccordionItem
            key="charts"
            aria-label="View Charts & Visualizations"
            classNames={{
              trigger:
                "bg-zinc-900 cursor-pointer rounded-xl hover:bg-zinc-800 transition-colors",
            }}
            title={
              <div className="text-sm font-semibold flex items-center gap-2">
                <ChartAverageIcon width={18} height={18} />
                View Charts & Visualizations
              </div>
            }
            subtitle={`${chartContent.length} chart${
              chartContent.length !== 1 ? "s" : ""
            } available`}
          >
            <div className="space-y-3 pt-2">
              {chartContent.map((viz, idx) =>
                renderSingleVisualization(viz, idx, false)
              )}
            </div>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
