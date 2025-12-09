import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Visualization, ChartDataItem, TableRow, SummaryData } from "../../types";
import { BarChartComponent, PieChartComponent, LineChartComponent, StatsChart, DataTable } from "../charts";

interface DataAccordionProps {
  title: string;
  subtitle?: string;
  explanation?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const DataAccordion: React.FC<DataAccordionProps> = ({ title, subtitle, explanation, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="ig-bg-zinc-900 ig-rounded-xl ig-overflow-hidden ig-my-2">
      <button
        className="ig-w-full ig-flex ig-items-center ig-justify-between ig-p-3 ig-cursor-pointer hover:ig-bg-zinc-800/50 ig-transition-colors"
        onClick={() => setIsOpen(!isOpen)}>
        <div className="ig-text-left">
          <h4 className="ig-font-semibold ig-text-zinc-100 ig-text-sm">{title}</h4>
          {subtitle && <p className="ig-text-xs ig-text-zinc-400 ig-mt-0.5">{subtitle}</p>}
        </div>
        {isOpen ? <ChevronUp className="ig-w-4 ig-h-4 ig-text-zinc-400" /> : <ChevronDown className="ig-w-4 ig-h-4 ig-text-zinc-400" />}
      </button>
      {isOpen && (
        <div className="ig-p-3 ig-pt-0">
          {explanation && (
            <div className="ig-bg-zinc-800 ig-rounded-lg ig-px-3 ig-py-2 ig-pl-4 ig-relative ig-mb-3">
              <div className="ig-absolute ig-left-2 ig-top-2 ig-h-[80%] ig-w-1 ig-bg-blue-500 ig-rounded-full" />
              <p className="ig-text-xs ig-text-zinc-300 ig-leading-relaxed ig-flex ig-items-start ig-gap-1">
                <Lightbulb className="ig-w-3 ig-h-3 ig-text-blue-400 ig-mt-0.5 ig-flex-shrink-0" />
                <span>{explanation}</span>
              </p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

interface VisualizationRendererProps {
  visualizations: Visualization[];
}

export const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) return null;

  const flattenVisualizations = (vizList: Visualization[]): Visualization[] => {
    const flattened: Visualization[] = [];
    vizList.forEach((viz) => {
      if (viz.type === "data_container" && viz.visualizations) {
        flattened.push(...flattenVisualizations(viz.visualizations));
      } else {
        flattened.push(viz);
      }
    });
    return flattened;
  };

  const renderSingleVisualization = (viz: Visualization, index: number) => {
    // Stats/Summary Cards
    if (viz.type === "stats" || viz.type === "summary") {
      return (
        <DataAccordion key={index} title={viz.title} subtitle={viz.description} explanation={viz.explanation} defaultOpen={true}>
          <StatsChart title="" data={viz.data as SummaryData} />
        </DataAccordion>
      );
    }

    // Tables
    if (viz.type === "table" && viz.columns && viz.data) {
      return (
        <DataAccordion
          key={index}
          title={viz.title}
          subtitle={viz.headerValue ? `Total: ${viz.headerValue.toLocaleString("en-IN")} ham` : viz.description}
          explanation={viz.explanation}
          defaultOpen={true}>
          <DataTable columns={viz.columns} data={viz.data as TableRow[]} />
        </DataAccordion>
      );
    }

    // Charts
    if (viz.type === "chart" && viz.data) {
      if (viz.chartType === "bar" || viz.chartType === "grouped_bar") {
        return (
          <DataAccordion key={index} title={viz.title} subtitle={viz.description} explanation={viz.explanation} defaultOpen={true}>
            <BarChartComponent title="" data={viz.data as ChartDataItem[]} color={viz.color} colorByValue={viz.colorByValue} />
          </DataAccordion>
        );
      }

      if (viz.chartType === "pie") {
        return (
          <DataAccordion key={index} title={viz.title} subtitle={viz.description} explanation={viz.explanation} defaultOpen={true}>
            <PieChartComponent title="" data={viz.data as { name: string; value: number }[]} />
          </DataAccordion>
        );
      }

      if (viz.chartType === "line" || viz.chartType === "multi_line" || viz.chartType === "area") {
        return (
          <DataAccordion key={index} title={viz.title} subtitle={viz.description} explanation={viz.explanation} defaultOpen={true}>
            <LineChartComponent title="" data={viz.data as Record<string, unknown>[]} chartType={viz.chartType} />
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
          <div className="ig-space-y-2">{viz.visualizations.map((innerViz, idx) => renderSingleVisualization(innerViz, idx))}</div>
        </DataAccordion>
      );
    }

    // Collapsible with children
    if (viz.type === "collapsible" && viz.children) {
      return (
        <DataAccordion key={index} title={viz.title} subtitle={viz.subtitle} explanation={viz.explanation} defaultOpen={viz.defaultOpen}>
          <div className="ig-space-y-2">{viz.children.map((childViz, idx) => renderSingleVisualization(childViz, idx))}</div>
        </DataAccordion>
      );
    }

    return renderSingleVisualization(viz, index);
  };

  return <div className="ig-space-y-3 ig-mt-3">{visualizations.map((viz, index) => renderVisualization(viz, index))}</div>;
};
