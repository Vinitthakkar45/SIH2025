/**
 * Deterministic Summary Generator
 *
 * Generates text summaries from structured data WITHOUT using LLM.
 * These summaries are for UI display alongside visualizations.
 */

import type {
  KeyMetric,
  TextSummary,
  Visualization,
  SearchGroundwaterDataResult,
  CompareLocationsResult,
  GetTopLocationsResult,
  GetHistoricalDataResult,
  ListLocationsResult,
} from "../types/responses";

/**
 * Get status from stage of extraction value
 */
function getStageStatus(stage: number | null | undefined): "safe" | "semi-critical" | "critical" | "over-exploited" | null {
  if (stage == null) return null;
  if (stage >= 100) return "over-exploited";
  if (stage >= 90) return "critical";
  if (stage >= 70) return "semi-critical";
  return "safe";
}

/**
 * Format a number with appropriate precision
 */
function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return "N/A";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Extract key metrics from the textSummary field returned by tools
 */
function parseTextSummary(textSummary: string | undefined): { metrics: KeyMetric[]; insights: string[] } {
  const metrics: KeyMetric[] = [];
  const insights: string[] = [];

  if (!textSummary) return { metrics, insights };

  const lines = textSummary.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse common patterns like "**Stage of Extraction:** 45.67%"
    const metricMatch = trimmed.match(/\*\*([^*]+)\*\*[:\s]+([0-9,.]+)\s*(%|MCM|ham|mm)?/);
    if (metricMatch) {
      const [, label, valueStr, unit] = metricMatch;
      const value = parseFloat(valueStr.replace(/,/g, ""));
      if (!isNaN(value)) {
        metrics.push({
          label: label.trim(),
          value,
          unit: unit || undefined,
          status: label.toLowerCase().includes("stage") || label.toLowerCase().includes("extraction") ? getStageStatus(value) : null,
        });
      }
    }

    // Parse category lines
    if (trimmed.toLowerCase().includes("category:")) {
      const catMatch = trimmed.match(/category[:\s]+(\w+[\w\s-]*)/i);
      if (catMatch) {
        metrics.push({
          label: "Category",
          value: catMatch[1].trim(),
        });
      }
    }
  }

  return { metrics, insights };
}

/**
 * Generate summary for search_groundwater_data results
 */
export function generateSearchSummary(result: SearchGroundwaterDataResult): TextSummary | undefined {
  if (!result.found) return undefined;

  const { metrics } = parseTextSummary(result.textSummary);

  if (result.isHistorical) {
    return {
      title: `Historical Data for ${result.locationName}`,
      subtitle: `${result.dataPointCount} years of groundwater data (${result.yearsAvailable?.[0]} to ${
        result.yearsAvailable?.[result.yearsAvailable.length - 1]
      })`,
      keyMetrics: metrics.length > 0 ? metrics : undefined,
      insights: [`Analyzed ${result.dataPointCount} years of groundwater data`, `Location type: ${result.locationType}`],
    };
  }

  return {
    title: `Groundwater Data for ${result.locationName}`,
    subtitle: `${result.locationType} • Year: ${result.year || "2024-2025"}`,
    keyMetrics: metrics.length > 0 ? metrics : undefined,
  };
}

/**
 * Generate summary for compare_locations results
 */
export function generateComparisonSummary(result: CompareLocationsResult): TextSummary | undefined {
  if (!result.found) return undefined;

  const locations = result.locationsCompared || [];

  if (result.isHistoricalComparison) {
    return {
      title: `Historical Comparison`,
      subtitle: `Comparing ${locations.length} locations over ${result.dataPointCount} years`,
      insights: [`Locations: ${locations.join(", ")}`, `Years analyzed: ${result.yearsAvailable?.join(", ")}`],
    };
  }

  return {
    title: `Location Comparison`,
    subtitle: `${locations.length} ${result.locationType?.toLowerCase() || "locations"}s • Year: ${result.year}`,
    insights: [`Comparing: ${locations.join(", ")}`],
  };
}

/**
 * Generate summary for get_top_locations results
 */
export function generateTopLocationsSummary(result: GetTopLocationsResult): TextSummary | undefined {
  if (!result.found) return undefined;

  const data = result.data as Array<{ name: string; value?: number; avgValue?: number }>;
  if (!data || data.length === 0) return undefined;

  const topItem = data[0];
  const metricValue = topItem.value ?? (topItem as any).avgValue;

  if (result.isHistorical) {
    return {
      title: `Top ${result.limit} ${result.locationType}s by ${result.metricLabel}`,
      subtitle: `Historical analysis: ${result.yearsAnalyzed?.[0]} to ${result.yearsAnalyzed?.[result.yearsAnalyzed.length - 1]}`,
      keyMetrics: [
        {
          label: `#1 ${result.metricLabel}`,
          value: `${topItem.name}: ${formatNumber(metricValue)}`,
          unit: result.metricUnit,
        },
      ],
      insights: [`Analyzed ${result.yearsAnalyzed?.length} years of data`, `Ranked by average ${result.metricLabel?.toLowerCase()}`],
    };
  }

  return {
    title: `Top ${result.limit} ${result.locationType}s by ${result.metricLabel}`,
    subtitle: `Year: ${result.year}`,
    keyMetrics: [
      {
        label: `#1 ${result.metricLabel}`,
        value: `${topItem.name}: ${formatNumber(metricValue)}`,
        unit: result.metricUnit,
      },
    ],
    insights: [`Showing ${result.order === "desc" ? "highest" : "lowest"} ${result.limit} ${result.locationType?.toLowerCase()}s`],
  };
}

/**
 * Generate summary for get_historical_data results
 */
export function generateHistoricalSummary(result: GetHistoricalDataResult): TextSummary | undefined {
  if (!result.found) return undefined;

  return {
    title: `Historical Trends for ${result.locationName}`,
    subtitle: `${result.dataPointCount} years of data`,
    insights: [
      `Data from ${result.yearsAvailable?.[0]} to ${result.yearsAvailable?.[result.yearsAvailable.length - 1]}`,
      `Location type: ${result.locationType}`,
    ],
  };
}

/**
 * Generate summary for list_locations results
 */
export function generateListLocationsSummary(result: ListLocationsResult): TextSummary | undefined {
  if (!result.found) return undefined;

  const locations = result.locations || [];
  const sampleNames = locations.slice(0, 5).map((l) => l.name);

  return {
    title: `Found ${result.count} Locations`,
    subtitle: locations[0]?.type ? `${locations[0].type.charAt(0).toUpperCase() + locations[0].type.slice(1).toLowerCase()}s` : undefined,
    insights: sampleNames.length > 0 ? [`Including: ${sampleNames.join(", ")}${locations.length > 5 ? "..." : ""}`] : undefined,
  };
}

/**
 * Generate summary based on tool name and result
 */
export function generateSummaryFromToolResult(toolName: string, result: Record<string, unknown>): TextSummary | undefined {
  switch (toolName) {
    case "search_groundwater_data":
      return generateSearchSummary(result as unknown as SearchGroundwaterDataResult);
    case "compare_locations":
      return generateComparisonSummary(result as unknown as CompareLocationsResult);
    case "get_top_locations":
      return generateTopLocationsSummary(result as unknown as GetTopLocationsResult);
    case "get_historical_data":
      return generateHistoricalSummary(result as unknown as GetHistoricalDataResult);
    case "list_locations":
      return generateListLocationsSummary(result as unknown as ListLocationsResult);
    default:
      return undefined;
  }
}
