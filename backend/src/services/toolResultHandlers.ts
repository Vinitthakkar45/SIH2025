import logger from "../utils/logger";
import {
  getGroundwaterDataByLocationId,
  generateChartData,
  generateTrendChartData,
  searchAndGetHistoricalData,
  generateComparisonChartData,
  generateHistoricalComparisonChartData,
} from "./groundwaterService";

type LocationType = "STATE" | "DISTRICT" | "TALUK";

interface ChartCallback {
  (chart: object): void;
}

interface ToolResult {
  found: boolean;
  [key: string]: unknown;
}

export async function handleSearchGroundwaterData(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  if (!result.found) return;

  // Historical data response
  if (result.isHistorical && result.locationId) {
    await handleHistoricalSearch(result, onChart);
    return;
  }

  // Single year response
  if (result.locationId) {
    await handleSingleYearSearch(result, onChart);
  }
}

async function handleHistoricalSearch(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  logger.debug(
    { locationId: result.locationId, yearsCount: result.dataPointCount },
    "Processing search_groundwater_data (historical)"
  );

  const historicalRecords = await searchAndGetHistoricalData(
    result.locationName as string,
    (result.locationType as string)?.toUpperCase() as LocationType
  );

  const yearsAvailable = result.yearsAvailable as string[];
  const filteredRecords = historicalRecords.filter((r) =>
    yearsAvailable.includes(r.year)
  );

  if (filteredRecords.length === 0) {
    logger.warn(
      { locationName: result.locationName },
      "No historical records found after filtering"
    );
    return;
  }

  const yearRange =
    yearsAvailable.length > 1
      ? `${yearsAvailable[0]} to ${yearsAvailable[yearsAvailable.length - 1]}`
      : yearsAvailable[0];

  const visualizations = generateTrendChartData(
    filteredRecords,
    result.locationName as string
  );

  onChart({
    type: "data_container",
    title: `Historical Trends - ${result.locationName}`,
    subtitle: `${result.dataPointCount} years of data: ${yearRange}`,
    locationId: result.locationId,
    locationName: result.locationName,
    visualizations,
  });
}

async function handleSingleYearSearch(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  logger.debug(
    { locationId: result.locationId, year: result.year },
    "Processing search_groundwater_data (single year)"
  );

  const fullRecord = await getGroundwaterDataByLocationId(
    result.locationId as string,
    result.year as string
  );

  if (!fullRecord) {
    logger.warn(
      { locationId: result.locationId },
      "Failed to fetch full record"
    );
    return;
  }

  const visualizations = generateChartData(fullRecord);

  logger.debug(
    { visualizationsCount: visualizations.length },
    "Generated visualizations for search tool"
  );

  onChart({
    type: "data_container",
    title: `Groundwater Data - ${result.locationName}`,
    subtitle: `${result.locationType} • Year: ${result.year || "2024-2025"}`,
    locationId: result.locationId,
    locationName: result.locationName,
    year: result.year || "2024-2025",
    visualizations,
  });
}

export async function handleCompareLocations(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  if (!result.found) return;

  // Multi-year historical comparison
  if (result.isHistoricalComparison && result.locationData) {
    await handleHistoricalComparison(result, onChart);
    return;
  }

  // Single year comparison
  if (result.locationIds) {
    await handleSingleYearComparison(result, onChart);
  }
}

async function handleHistoricalComparison(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  logger.debug(
    { locationsCount: result.count, yearsCount: result.dataPointCount },
    "Processing compare_locations (historical)"
  );

  const locationData = result.locationData as Array<{
    locationName: string;
    locationId: string;
    locationType?: LocationType;
    years: string[];
  }>;

  const defaultLocationType = (result.locationType as LocationType) || "STATE";
  const yearsAvailable = result.yearsAvailable as string[];
  const yearRange =
    yearsAvailable.length > 1
      ? `${yearsAvailable[0]} to ${yearsAvailable[yearsAvailable.length - 1]}`
      : yearsAvailable[0];

  const locationsWithRecords: Array<{
    locationName: string;
    records: Awaited<ReturnType<typeof searchAndGetHistoricalData>>;
  }> = [];

  for (const locData of locationData) {
    const locType = locData.locationType || defaultLocationType;

    const historicalRecords = await searchAndGetHistoricalData(
      locData.locationName,
      locType
    );

    const filteredRecords = historicalRecords.filter((r) =>
      locData.years.includes(r.year)
    );

    if (filteredRecords.length > 0) {
      locationsWithRecords.push({
        locationName: locData.locationName,
        records: filteredRecords,
      });
    }
  }

  if (locationsWithRecords.length === 0) {
    logger.warn("No records found for historical comparison");
    return;
  }

  const visualizations =
    generateHistoricalComparisonChartData(locationsWithRecords);
  const locationsCompared = result.locationsCompared as string[];

  logger.debug(
    {
      locationsCount: locationsWithRecords.length,
      visualizationsCount: visualizations.length,
    },
    "Generated historical comparison visualizations"
  );

  onChart({
    type: "data_container",
    title: `Historical Comparison - ${locationsCompared.join(", ")}`,
    subtitle: `${locationsWithRecords.length} locations • ${yearsAvailable.length} years: ${yearRange}`,
    visualizations,
  });
}

async function handleSingleYearComparison(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  logger.debug(
    { locationsCount: result.count, year: result.year },
    "Processing compare_locations (single year)"
  );

  const locationIds = result.locationIds as string[];
  const records = [];

  for (const locationId of locationIds) {
    const record = await getGroundwaterDataByLocationId(
      locationId,
      result.year as string
    );
    if (record) records.push(record);
  }

  if (records.length === 0) {
    logger.warn("No records found for comparison");
    return;
  }

  const visualizations = generateComparisonChartData(records);

  logger.debug(
    { visualizationsCount: visualizations.length },
    "Generated visualizations for comparison"
  );

  const locationsCompared = result.locationsCompared as string[];

  onChart({
    type: "data_container",
    title: `Location Comparison - ${locationsCompared.join(", ")}`,
    subtitle: `${result.count} locations • Year: ${result.year}`,
    visualizations,
  });
}

export async function handleGetHistoricalData(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  if (!result.found || !result.locationId) return;

  logger.debug(
    { locationId: result.locationId, locationType: result.locationType },
    "Processing get_historical_data"
  );

  const historicalRecords = await searchAndGetHistoricalData(
    result.locationName as string,
    (result.locationType as string)?.toUpperCase() as LocationType
  );

  const yearsAvailable = result.yearsAvailable as string[];
  const filteredRecords = historicalRecords.filter((r) =>
    yearsAvailable.includes(r.year)
  );

  if (filteredRecords.length === 0) {
    logger.warn(
      { locationName: result.locationName },
      "No historical records found after filtering"
    );
    return;
  }

  const yearRange =
    yearsAvailable.length > 1
      ? `${yearsAvailable[0]} to ${yearsAvailable[yearsAvailable.length - 1]}`
      : yearsAvailable[0];

  const visualizations = generateTrendChartData(
    filteredRecords,
    result.locationName as string
  );

  logger.debug(
    { visualizationsCount: visualizations.length },
    "Generated visualizations for historical data"
  );

  onChart({
    type: "data_container",
    title: `Historical Trends - ${result.locationName}`,
    subtitle: `${result.dataPointCount} years of data: ${yearRange}`,
    locationId: result.locationId,
    locationName: result.locationName,
    visualizations,
  });
}

export async function handleLegacyCharts(
  result: ToolResult,
  onChart: ChartCallback
): Promise<void> {
  if (!result.charts) return;

  const charts = result.charts as object[];
  for (const chart of charts) {
    onChart(chart);
  }
}

export async function processToolResult(
  toolName: string,
  resultJson: string,
  onChart: ChartCallback
): Promise<void> {
  try {
    const result = JSON.parse(resultJson) as ToolResult;

    switch (toolName) {
      case "search_groundwater_data":
        await handleSearchGroundwaterData(result, onChart);
        break;

      case "compare_locations":
        await handleCompareLocations(result, onChart);
        break;

      case "get_historical_data":
        await handleGetHistoricalData(result, onChart);
        break;

      default:
        // Handle legacy charts in tool result
        await handleLegacyCharts(result, onChart);
    }
  } catch (error) {
    logger.debug({ error, toolName }, "Failed to parse tool result");
  }
}
