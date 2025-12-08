import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/gw-db";
import { groundwaterData, locations } from "../db/gw-schema";
import {
  aggregateGroundwaterRecords,
  aggregateHistoricalRecords,
  groupRecordsByYear,
} from "../utils/aggregation";
import {
  getAvailableYears,
  getDistrictsOfState,
  getLocationById,
  getLocationsByNameAndType,
  getTaluksOfDistrict,
  searchDistrict,
  searchLocation,
  searchState,
  searchTaluk,
} from "./locationSearch";

export interface GroundwaterRecord {
  location: {
    id: string;
    name: string;
    type: string;
  };
  year: string;
  data: Record<string, unknown>;
}

const LATEST_YEAR = "2024-2025";

export async function getGroundwaterDataByLocationId(
  locationId: string,
  year: string = LATEST_YEAR
): Promise<GroundwaterRecord | null> {
  const result = await db
    .select()
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(and(eq(locations.id, locationId), eq(groundwaterData.year, year)));

  if (result.length === 0) return null;

  const records = result.map((row) => ({
    location: {
      id: row.locations.id,
      name: row.locations.name,
      type: row.locations.type,
    },
    year: row.groundwater_data.year,
    data: row.groundwater_data,
  }));

  return aggregateGroundwaterRecords(records);
}

export async function searchAndGetGroundwaterData(
  query: string,
  locationType?: "STATE" | "DISTRICT" | "TALUK",
  parentName?: string,
  year: string = LATEST_YEAR
): Promise<GroundwaterRecord | null> {
  const normalizedQuery = query.replace(/[_-]/g, " ").trim();
  const normalizedParent = parentName?.replace(/[_-]/g, " ").trim();

  let results: { location: { id: string }; score: number }[];
  if (locationType === "STATE") {
    results = searchState(normalizedQuery);
  } else if (locationType === "DISTRICT") {
    results = searchDistrict(normalizedQuery, normalizedParent);
  } else if (locationType === "TALUK") {
    results = searchTaluk(normalizedQuery, normalizedParent);
  } else {
    results = searchLocation(normalizedQuery, locationType);
  }

  if (results.length === 0) return null;

  const bestMatch = results[0];
  return getGroundwaterDataByLocationId(bestMatch.location.id, year);
}

export async function compareLocations(
  locationIds: string[],
  year: string = LATEST_YEAR
): Promise<GroundwaterRecord[]> {
  const results: GroundwaterRecord[] = [];

  for (const id of locationIds) {
    const data = await getGroundwaterDataByLocationId(id, year);
    if (data) results.push(data);
  }

  return results;
}

export async function getTopLocationsByField(
  field: string,
  locationType: "STATE" | "DISTRICT" | "TALUK",
  order: "asc" | "desc" = "desc",
  limit: number = 10,
  year: string = LATEST_YEAR
): Promise<GroundwaterRecord[]> {
  const columnName = fieldToColumn(field);
  if (!columnName) return [];

  const orderFn = order === "desc" ? desc : asc;

  const result = await db
    .select()
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(
      and(
        eq(locations.type, locationType),
        eq(groundwaterData.year, year),
        isNotNull(sql.raw(`groundwater_data.${columnName}`))
      )
    )
    .orderBy(orderFn(sql.raw(`groundwater_data.${columnName}`)))
    .limit(limit);

  return result.map((row) => ({
    location: {
      id: row.locations.id,
      name: row.locations.name,
      type: row.locations.type,
    },
    year: row.groundwater_data.year,
    data: row.groundwater_data,
  }));
}

export async function getLocationWithChildren(
  locationId: string,
  year: string = LATEST_YEAR
): Promise<{
  parent: GroundwaterRecord | null;
  children: GroundwaterRecord[];
}> {
  const parent = await getGroundwaterDataByLocationId(locationId, year);
  if (!parent) return { parent: null, children: [] };

  const location = await getLocationById(locationId);
  if (!location) return { parent, children: [] };

  let childLocations: { id: string }[] = [];
  if (location.type === "STATE") {
    childLocations = getDistrictsOfState(locationId);
  } else if (location.type === "DISTRICT") {
    childLocations = getTaluksOfDistrict(locationId);
  }

  const children: GroundwaterRecord[] = [];
  for (const child of childLocations.slice(0, 20)) {
    const data = await getGroundwaterDataByLocationId(child.id, year);
    if (data) children.push(data);
  }

  return { parent, children };
}

export async function getCategorySummary(
  locationType: "STATE" | "DISTRICT" | "TALUK",
  year: string = LATEST_YEAR
): Promise<Record<string, number>> {
  const result = await db
    .select({
      category: groundwaterData.categoryTotal,
      count: sql<number>`count(*)`,
    })
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(
      and(eq(locations.type, locationType), eq(groundwaterData.year, year))
    )
    .groupBy(groundwaterData.categoryTotal);

  const summary: Record<string, number> = {};
  for (const row of result) {
    if (row.category) {
      summary[row.category] = Number(row.count);
    }
  }
  return summary;
}

export async function getAggregateStats(
  locationType: "STATE" | "DISTRICT" | "TALUK",
  year: string = LATEST_YEAR
): Promise<Record<string, number>> {
  const result = await db
    .select({
      totalRecharge: sql<number>`sum(recharge_total_total)`,
      totalDraft: sql<number>`sum(draft_total_total)`,
      totalExtractable: sql<number>`sum(extractable_total)`,
      avgRainfall: sql<number>`avg(rainfall_total)`,
      avgStageOfExtraction: sql<number>`avg(stage_of_extraction_total)`,
      count: sql<number>`count(*)`,
    })
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(
      and(eq(locations.type, locationType), eq(groundwaterData.year, year))
    );

  const row = result[0];
  return {
    totalRecharge: Number(row.totalRecharge) || 0,
    totalDraft: Number(row.totalDraft) || 0,
    totalExtractable: Number(row.totalExtractable) || 0,
    avgRainfall: Number(row.avgRainfall) || 0,
    avgStageOfExtraction: Number(row.avgStageOfExtraction) || 0,
    locationCount: Number(row.count) || 0,
  };
}

function fieldToColumn(field: string): string | null {
  const fieldMap: Record<string, string> = {
    rainfall: "rainfall_total",
    recharge: "recharge_total_total",
    extraction: "draft_total_total",
    draft: "draft_total_total",
    extractable: "extractable_total",
    stage: "stage_of_extraction_total",
    stage_of_extraction: "stage_of_extraction_total",
    loss: "loss_total",
    availability: "availability_future_total",
  };
  return fieldMap[field.toLowerCase()] ?? null;
}

export interface HistoricalRecord {
  year: string;
  locationId: string;
  locationName: string;
  data: Record<string, unknown>;
}

export async function getHistoricalDataByLocationName(
  locationName: string,
  locationType: "STATE" | "DISTRICT" | "TALUK"
): Promise<HistoricalRecord[]> {
  const matchingLocations = getLocationsByNameAndType(
    locationName,
    locationType
  );

  if (matchingLocations.length === 0) return [];

  const locationIds = matchingLocations.map((l) => l.id);

  const result = await db
    .select()
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(inArray(locations.id, locationIds));

  const records = result.map((row) => ({
    year: row.groundwater_data.year,
    locationId: row.locations.id,
    locationName: row.locations.name,
    data: row.groundwater_data,
  }));

  const recordsByYear = groupRecordsByYear(records);
  return aggregateHistoricalRecords(recordsByYear);
}

export async function searchAndGetHistoricalData(
  query: string,
  locationType: "STATE" | "DISTRICT" | "TALUK"
): Promise<HistoricalRecord[]> {
  const normalizedQuery = query.replace(/[_-]/g, " ").trim();

  let results: { location: { id: string; name: string } }[];
  if (locationType === "STATE") {
    results = searchState(normalizedQuery);
  } else if (locationType === "DISTRICT") {
    results = searchDistrict(normalizedQuery);
  } else {
    results = searchTaluk(normalizedQuery);
  }

  if (results.length === 0) return [];

  const bestMatch = results[0];
  return getHistoricalDataByLocationName(bestMatch.location.name, locationType);
}

export async function getGroundwaterDataForYear(
  query: string,
  year: string,
  locationType?: "STATE" | "DISTRICT" | "TALUK"
): Promise<GroundwaterRecord | null> {
  return searchAndGetGroundwaterData(query, locationType, undefined, year);
}

export async function compareYears(
  locationName: string,
  locationType: "STATE" | "DISTRICT" | "TALUK",
  years: string[]
): Promise<HistoricalRecord[]> {
  const historicalData = await getHistoricalDataByLocationName(
    locationName,
    locationType
  );

  if (years.length === 0) return historicalData;

  return historicalData.filter((h) => years.includes(h.year));
}

export function formatGroundwaterDataForLLM(record: GroundwaterRecord): string {
  const data = record.data as Record<string, unknown>;
  const lines: string[] = [
    `Location: ${record.location.name} (${record.location.type})`,
    `Year: ${record.year}`,
    "",
  ];

  if (data.rainfallTotal) {
    lines.push(`Rainfall: ${formatNumber(data.rainfallTotal)} mm`);
  }

  if (data.categoryTotal) {
    lines.push(`Category: ${data.categoryTotal}`);
  }

  if (data.extractableTotal) {
    lines.push(
      `Annual Extractable Ground Water Resources: ${formatNumber(
        data.extractableTotal
      )} ham`
    );
  }

  if (data.draftTotalTotal) {
    lines.push(
      `Ground Water Extraction: ${formatNumber(data.draftTotalTotal)} ham`
    );
  }

  lines.push("");
  lines.push("Ground Water Recharge (ham):");
  const rechargeRows = [
    {
      name: "Rainfall Recharge",
      cmd: data.rechargeRainfallCommand,
      nonCmd: data.rechargeRainfallNonCommand,
      total: data.rechargeRainfallTotal,
    },
    {
      name: "Canal Recharge",
      cmd: data.rechargeCanalCommand,
      nonCmd: data.rechargeCanalNonCommand,
      total: data.rechargeCanalTotal,
    },
    {
      name: "Surface Water Irrigation",
      cmd: data.rechargeSurfaceIrrigationCommand,
      nonCmd: data.rechargeSurfaceIrrigationNonCommand,
      total: data.rechargeSurfaceIrrigationTotal,
    },
    {
      name: "Ground Water Irrigation",
      cmd: data.rechargeGwIrrigationCommand,
      nonCmd: data.rechargeGwIrrigationNonCommand,
      total: data.rechargeGwIrrigationTotal,
    },
    {
      name: "Water Conservation Structures",
      cmd: data.rechargeArtificialStructureCommand,
      nonCmd: data.rechargeArtificialStructureNonCommand,
      total: data.rechargeArtificialStructureTotal,
    },
    {
      name: "Tanks And Ponds",
      cmd: data.rechargeWaterBodyCommand,
      nonCmd: data.rechargeWaterBodyNonCommand,
      total: data.rechargeWaterBodyTotal,
    },
  ].filter((r) => r.total);

  for (const row of rechargeRows) {
    lines.push(
      `  - ${row.name}: ${formatNumber(row.total)} (Cmd: ${formatNumber(
        row.cmd
      )}, Non-Cmd: ${formatNumber(row.nonCmd)})`
    );
  }
  if (data.rechargeTotalTotal) {
    lines.push(
      `  Total: ${formatNumber(data.rechargeTotalTotal)} (Cmd: ${formatNumber(
        data.rechargeTotalCommand
      )}, Non-Cmd: ${formatNumber(data.rechargeTotalNonCommand)})`
    );
  }

  lines.push("");
  lines.push("Natural Discharges (ham):");
  const dischargeRows = [
    {
      name: "Baseflow",
      cmd: data.baseflowLateralCommand,
      nonCmd: data.baseflowLateralNonCommand,
      total: data.baseflowLateralTotal,
    },
    {
      name: "Evaporation",
      cmd: data.evaporationCommand,
      nonCmd: data.evaporationNonCommand,
      total: data.evaporationTotal,
    },
    {
      name: "Transpiration",
      cmd: data.transpirationCommand,
      nonCmd: data.transpirationNonCommand,
      total: data.transpirationTotal,
    },
    {
      name: "Vertical Flows",
      cmd: data.baseflowVerticalCommand,
      nonCmd: data.baseflowVerticalNonCommand,
      total: data.baseflowVerticalTotal,
    },
  ].filter((r) => r.total);

  for (const row of dischargeRows) {
    lines.push(
      `  - ${row.name}: ${formatNumber(row.total)} (Cmd: ${formatNumber(
        row.cmd
      )}, Non-Cmd: ${formatNumber(row.nonCmd)})`
    );
  }
  if (data.lossTotal) {
    lines.push(
      `  Total: ${formatNumber(data.lossTotal)} (Cmd: ${formatNumber(
        data.lossCommand
      )}, Non-Cmd: ${formatNumber(data.lossNonCommand)})`
    );
  }

  lines.push("");
  lines.push("Annual Extractable Ground Water Resources (ham):");
  lines.push(
    `  Command: ${formatNumber(
      data.extractableCommand
    )}, Non-Command: ${formatNumber(
      data.extractableNonCommand
    )}, Total: ${formatNumber(data.extractableTotal)}`
  );

  lines.push("");
  lines.push("Ground Water Extraction (ham):");
  const extractionRows = [
    {
      name: "Irrigation",
      cmd: data.draftAgricultureCommand,
      nonCmd: data.draftAgricultureNonCommand,
      total: data.draftAgricultureTotal,
    },
    {
      name: "Domestic",
      cmd: data.draftDomesticCommand,
      nonCmd: data.draftDomesticNonCommand,
      total: data.draftDomesticTotal,
    },
    {
      name: "Industry",
      cmd: data.draftIndustryCommand,
      nonCmd: data.draftIndustryNonCommand,
      total: data.draftIndustryTotal,
    },
  ].filter((r) => r.total);

  for (const row of extractionRows) {
    lines.push(
      `  - ${row.name}: ${formatNumber(row.total)} (Cmd: ${formatNumber(
        row.cmd
      )}, Non-Cmd: ${formatNumber(row.nonCmd)})`
    );
  }
  if (data.draftTotalTotal) {
    lines.push(
      `  Total: ${formatNumber(data.draftTotalTotal)} (Cmd: ${formatNumber(
        data.draftTotalCommand
      )}, Non-Cmd: ${formatNumber(data.draftTotalNonCommand)})`
    );
  }

  if (data.stageOfExtractionTotal) {
    lines.push("");
    lines.push(
      `Stage of Extraction: ${formatNumber(data.stageOfExtractionTotal)}%`
    );
  }

  return lines.join("\n");
}

function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function generateChartData(record: GroundwaterRecord): object[] {
  const data = record.data as Record<string, unknown>;
  const locationName = record.location.name;
  const visualizations: object[] = [];

  // 1. Summary Stats Card (Key Metrics)
  visualizations.push({
    type: "summary",
    title: `Area of Focus: ${locationName} (${record.location.type})`,
    year: record.year,
    data: {
      extractableTotal: data.extractableTotal,
      extractionTotal: data.draftTotalTotal,
      rainfall: data.rainfallTotal,
      rechargeTotal: data.rechargeTotalTotal,
      naturalDischarges: data.lossTotal,
      stageOfExtraction: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    },
  });

  // 2. Ground Water Recharge Table
  const rechargeTableData = [
    {
      source: "Rainfall Recharge",
      command: data.rechargeRainfallCommand,
      nonCommand: data.rechargeRainfallNonCommand,
      total: data.rechargeRainfallTotal,
    },
    { source: "Stream Channel Recharge", command: 0, nonCommand: 0, total: 0 },
    {
      source: "Canal Recharge",
      command: data.rechargeCanalCommand,
      nonCommand: data.rechargeCanalNonCommand,
      total: data.rechargeCanalTotal,
    },
    {
      source: "Surface Water Irrigation",
      command: data.rechargeSurfaceIrrigationCommand,
      nonCommand: data.rechargeSurfaceIrrigationNonCommand,
      total: data.rechargeSurfaceIrrigationTotal,
    },
    {
      source: "Ground Water Irrigation",
      command: data.rechargeGwIrrigationCommand,
      nonCommand: data.rechargeGwIrrigationNonCommand,
      total: data.rechargeGwIrrigationTotal,
    },
    {
      source: "Water Conservation Structures",
      command: data.rechargeArtificialStructureCommand,
      nonCommand: data.rechargeArtificialStructureNonCommand,
      total: data.rechargeArtificialStructureTotal,
    },
    {
      source: "Tanks And Ponds",
      command: data.rechargeWaterBodyCommand,
      nonCommand: data.rechargeWaterBodyNonCommand,
      total: data.rechargeWaterBodyTotal,
    },
  ].filter((r) => r.total);

  rechargeTableData.push({
    source: "Total",
    command: data.rechargeTotalCommand,
    nonCommand: data.rechargeTotalNonCommand,
    total: data.rechargeTotalTotal,
  });

  visualizations.push({
    type: "table",
    tableType: "recharge",
    title: `Ground Water Recharge (ham)`,
    headerValue: data.rechargeTotalTotal,
    columns: ["Source", "Command", "Non Command", "Total"],
    data: rechargeTableData,
  });

  // 3. Natural Discharges Table
  const dischargesTableData = [
    {
      source: "Baseflow",
      command: data.baseflowLateralCommand,
      nonCommand: data.baseflowLateralNonCommand,
      total: data.baseflowLateralTotal,
    },
    { source: "Evapo-Transpiration", command: 0, nonCommand: 0, total: 0 },
    {
      source: "Evaporation",
      command: data.evaporationCommand,
      nonCommand: data.evaporationNonCommand,
      total: data.evaporationTotal,
    },
    { source: "Lateral Flows", command: 0, nonCommand: 0, total: 0 },
    { source: "Stream Recharges", command: 0, nonCommand: 0, total: 0 },
    {
      source: "Transpiration",
      command: data.transpirationCommand,
      nonCommand: data.transpirationNonCommand,
      total: data.transpirationTotal,
    },
    {
      source: "Vertical Flows",
      command: data.baseflowVerticalCommand,
      nonCommand: data.baseflowVerticalNonCommand,
      total: data.baseflowVerticalTotal,
    },
  ].filter((r) => r.total || r.source === "Total");

  dischargesTableData.push({
    source: "Total",
    command: data.lossCommand,
    nonCommand: data.lossNonCommand,
    total: data.lossTotal,
  });

  visualizations.push({
    type: "table",
    tableType: "discharges",
    title: `Natural Discharges (ham)`,
    headerValue: data.lossTotal,
    columns: ["Source", "Command", "Non Command", "Total"],
    data: dischargesTableData,
  });

  // 4. Annual Extractable Ground Water Resources Table
  visualizations.push({
    type: "table",
    tableType: "extractable",
    title: `Annual Extractable Ground Water Resources (ham)`,
    headerValue: data.extractableTotal,
    columns: ["Command", "Non Command", "Total"],
    data: [
      {
        command: data.extractableCommand,
        nonCommand: data.extractableNonCommand,
        total: data.extractableTotal,
      },
    ],
  });

  // 5. Ground Water Extraction Table
  const extractionTableData = [
    {
      source: "Irrigation",
      command: data.draftAgricultureCommand,
      nonCommand: data.draftAgricultureNonCommand,
      total: data.draftAgricultureTotal,
    },
    {
      source: "Domestic",
      command: data.draftDomesticCommand,
      nonCommand: data.draftDomesticNonCommand,
      total: data.draftDomesticTotal,
    },
    {
      source: "Industry",
      command: data.draftIndustryCommand,
      nonCommand: data.draftIndustryNonCommand,
      total: data.draftIndustryTotal,
    },
  ].filter((r) => r.total);

  extractionTableData.push({
    source: "Total",
    command: data.draftTotalCommand,
    nonCommand: data.draftTotalNonCommand,
    total: data.draftTotalTotal,
  });

  visualizations.push({
    type: "table",
    tableType: "extraction",
    title: `Ground Water Extraction (ham)`,
    headerValue: data.draftTotalTotal,
    columns: ["Source", "Command", "Non Command", "Total"],
    data: extractionTableData,
  });

  // 6. Recharge Sources Bar Chart
  const rechargeChartData = [
    { name: "Rainfall", value: data.rechargeRainfallTotal },
    { name: "Canal", value: data.rechargeCanalTotal },
    { name: "Surface Irrigation", value: data.rechargeSurfaceIrrigationTotal },
    { name: "GW Irrigation", value: data.rechargeGwIrrigationTotal },
    {
      name: "Conservation Structures",
      value: data.rechargeArtificialStructureTotal,
    },
    { name: "Tanks & Ponds", value: data.rechargeWaterBodyTotal },
  ].filter((r) => r.value);

  if (rechargeChartData.length > 0) {
    visualizations.push({
      type: "chart",
      chartType: "bar",
      title: `Ground Water Recharge Sources - ${locationName}`,
      description: "Breakdown of ground water recharge by source (ham)",
      data: rechargeChartData,
    });
  }

  // 7. Extraction by Use Pie Chart
  const extractionPieData = [
    { name: "Irrigation", value: data.draftAgricultureTotal },
    { name: "Domestic", value: data.draftDomesticTotal },
    { name: "Industry", value: data.draftIndustryTotal },
  ].filter((e) => e.value);

  if (extractionPieData.length > 0) {
    visualizations.push({
      type: "chart",
      chartType: "pie",
      title: `Ground Water Extraction by Use - ${locationName}`,
      description: "Distribution of ground water extraction (ham)",
      data: extractionPieData,
    });
  }

  // 8. Command vs Non-Command Comparison
  const commandComparisonData = [
    {
      name: "Recharge",
      command: data.rechargeTotalCommand,
      nonCommand: data.rechargeTotalNonCommand,
    },
    {
      name: "Extraction",
      command: data.draftTotalCommand,
      nonCommand: data.draftTotalNonCommand,
    },
    {
      name: "Extractable",
      command: data.extractableCommand,
      nonCommand: data.extractableNonCommand,
    },
  ].filter((r) => r.command || r.nonCommand);

  if (commandComparisonData.length > 0) {
    visualizations.push({
      type: "chart",
      chartType: "grouped_bar",
      title: `Command vs Non-Command Areas - ${locationName}`,
      description: "Comparison between command and non-command areas (ham)",
      data: commandComparisonData,
    });
  }

  // 9. Water Balance Overview (Stacked/Comparison)
  visualizations.push({
    type: "chart",
    chartType: "waterBalance",
    title: `Water Balance Overview - ${locationName}`,
    description: "Overall groundwater balance",
    data: {
      recharge: data.rechargeTotalTotal,
      naturalDischarge: data.lossTotal,
      extractable: data.extractableTotal,
      extraction: data.draftTotalTotal,
      availabilityForFuture: data.availabilityFutureTotal,
    },
  });

  // 10. Stage of Extraction Category Status
  const stageOfExtraction = Number(data.stageOfExtractionTotal) || 0;
  const category = String(data.categoryTotal || "Unknown");
  visualizations.push({
    type: "stats",
    title: `Extraction Status & Category`,
    description: `Current stage: ${stageOfExtraction.toFixed(2)}%`,
    data: {
      stageOfExtraction,
      category,
      status:
        stageOfExtraction < 70
          ? "Safe"
          : stageOfExtraction < 90
          ? "Semi-Critical"
          : stageOfExtraction < 100
          ? "Critical"
          : "Over-Exploited",
      healthIndicator:
        stageOfExtraction < 70
          ? "Healthy"
          : stageOfExtraction < 90
          ? "Moderate Stress"
          : stageOfExtraction < 100
          ? "High Stress"
          : "Severe Stress",
    },
    threshold: {
      safe: 70,
      critical: 90,
      overExploited: 100,
    },
  });

  // 11. Recharge vs Extraction Comparison (Bar Chart)
  const rechargeVsExtraction = [
    { name: "Recharge", value: data.rechargeTotalTotal },
    { name: "Extraction", value: data.draftTotalTotal },
    { name: "Natural Discharge", value: data.lossTotal },
  ].filter((r) => r.value);

  if (rechargeVsExtraction.length > 0) {
    visualizations.push({
      type: "chart",
      chartType: "bar",
      title: `Recharge vs Extraction Analysis - ${locationName}`,
      description:
        "Comparison of recharge, extraction, and natural discharge (ham)",
      data: rechargeVsExtraction,
    });
  }

  // 12. Availability & Sustainability Metrics
  const availabilityData = {
    extractable: Number(data.extractableTotal) || 0,
    currentExtraction: Number(data.draftTotalTotal) || 0,
    futureAvailability: Number(data.availabilityFutureTotal) || 0,
    utilizationPercent: stageOfExtraction,
    remainingCapacity: Math.max(
      0,
      (Number(data.extractableTotal) || 0) - (Number(data.draftTotalTotal) || 0)
    ),
  };

  visualizations.push({
    type: "stats",
    title: `Availability & Sustainability Metrics`,
    description: `Future availability: ${formatNumber(
      availabilityData.futureAvailability
    )} ham`,
    data: availabilityData,
  });

  return visualizations;
}

export function generateComparisonChartData(
  records: GroundwaterRecord[]
): object[] {
  const visualizations: object[] = [];

  // 1. Locations Table (like the state-wise table in screenshot)
  const locationsTableData = records.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      name: r.location.name,
      type: r.location.type,
      rainfall: data.rainfallTotal,
      extractable: data.extractableTotal,
      extraction: data.draftTotalTotal,
      recharge: data.rechargeTotalTotal,
      stageOfExtraction: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    };
  });

  visualizations.push({
    type: "table",
    tableType: "locations",
    title: "Location Comparison",
    columns: [
      "Name",
      "Rainfall (mm)",
      "Extractable (ham)",
      "Extraction (ham)",
      "Stage (%)",
    ],
    data: locationsTableData,
  });

  // 2. Key Metrics Comparison Bar Chart
  const comparisonData = records.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      name: r.location.name,
      recharge: data.rechargeTotalTotal,
      extraction: data.draftTotalTotal,
      extractable: data.extractableTotal,
    };
  });

  visualizations.push({
    type: "chart",
    chartType: "grouped_bar",
    title: "Groundwater Metrics Comparison",
    description:
      "Comparison of recharge, extraction, and extractable resources (ham)",
    data: comparisonData,
  });

  // 3. Rainfall Comparison
  const rainfallData = records.map((r) => ({
    name: r.location.name,
    value: (r.data as Record<string, unknown>).rainfallTotal,
  }));

  visualizations.push({
    type: "chart",
    chartType: "bar",
    title: "Rainfall Comparison",
    description: "Annual rainfall across locations (mm)",
    data: rainfallData,
  });

  // 4. Stage of Extraction Comparison
  const stageData = records.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      name: r.location.name,
      value: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    };
  });

  visualizations.push({
    type: "chart",
    chartType: "bar",
    title: "Stage of Extraction Comparison",
    description: "Extraction as percentage of extractable resources (%)",
    data: stageData,
    threshold: { safe: 70, critical: 90, overExploited: 100 },
  });

  // 5. Category Distribution
  const categoryCount: Record<string, number> = {};
  for (const r of records) {
    const cat = String(
      (r.data as Record<string, unknown>).categoryTotal || "Unknown"
    );
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  visualizations.push({
    type: "chart",
    chartType: "pie",
    title: "Category Distribution",
    description: "Distribution of locations by groundwater category",
    data: Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    })),
  });

  return visualizations;
}

export function generateTrendChartData(
  records: HistoricalRecord[],
  locationName: string
): object[] {
  const visualizations: object[] = [];

  if (records.length === 0) return visualizations;

  const sortedRecords = [...records].sort((a, b) =>
    a.year.localeCompare(b.year)
  );

  visualizations.push({
    type: "trend_summary",
    title: `Historical Trend: ${locationName}`,
    years: sortedRecords.map((r) => r.year),
    latestYear: sortedRecords[sortedRecords.length - 1].year,
    earliestYear: sortedRecords[0].year,
    dataPoints: sortedRecords.length,
  });

  const trendData = sortedRecords.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      year: r.year,
      recharge: data.rechargeTotalTotal,
      extraction: data.draftTotalTotal,
      extractable: data.extractableTotal,
      rainfall: data.rainfallTotal,
      stageOfExtraction: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    };
  });

  visualizations.push({
    type: "table",
    tableType: "trend",
    title: `Year-wise Groundwater Data - ${locationName}`,
    columns: [
      "Year",
      "Rainfall (mm)",
      "Recharge (ham)",
      "Extractable (ham)",
      "Extraction (ham)",
      "Stage (%)",
      "Category",
    ],
    data: trendData,
  });

  visualizations.push({
    type: "chart",
    chartType: "line",
    title: `Groundwater Extraction Trend - ${locationName}`,
    description: "Historical trend of groundwater extraction (ham)",
    data: trendData.map((t) => ({
      year: t.year,
      value: t.extraction,
    })),
  });

  visualizations.push({
    type: "chart",
    chartType: "line",
    title: `Stage of Extraction Trend - ${locationName}`,
    description: "Historical trend of extraction stage (%)",
    data: trendData.map((t) => ({
      year: t.year,
      value: t.stageOfExtraction,
    })),
    threshold: { safe: 70, critical: 90, overExploited: 100 },
  });

  visualizations.push({
    type: "chart",
    chartType: "multi_line",
    title: `Recharge vs Extraction Trend - ${locationName}`,
    description: "Comparison of recharge and extraction over years (ham)",
    data: trendData.map((t) => ({
      year: t.year,
      recharge: t.recharge,
      extraction: t.extraction,
    })),
  });

  visualizations.push({
    type: "chart",
    chartType: "area",
    title: `Extractable Resources Trend - ${locationName}`,
    description: "Available extractable groundwater resources over years (ham)",
    data: trendData.map((t) => ({
      year: t.year,
      value: t.extractable,
    })),
  });

  visualizations.push({
    type: "chart",
    chartType: "bar",
    title: `Rainfall Trend - ${locationName}`,
    description: "Annual rainfall over years (mm)",
    data: trendData.map((t) => ({
      name: t.year,
      value: t.rainfall,
    })),
  });

  const categoryChanges: { year: string; category: string }[] = [];
  for (let i = 0; i < trendData.length; i++) {
    if (i === 0 || trendData[i].category !== trendData[i - 1].category) {
      categoryChanges.push({
        year: trendData[i].year,
        category: String(trendData[i].category || "Unknown"),
      });
    }
  }

  if (categoryChanges.length > 1) {
    visualizations.push({
      type: "stats",
      title: `Category Changes - ${locationName}`,
      data: {
        totalChanges: categoryChanges.length - 1,
        history: categoryChanges,
        currentCategory: trendData[trendData.length - 1].category || "Unknown",
        initialCategory: trendData[0].category || "Unknown",
      },
    });
  }

  return visualizations;
}

export function formatHistoricalDataForLLM(
  records: HistoricalRecord[]
): string {
  if (records.length === 0) return "No historical data available.";

  const sortedRecords = [...records].sort((a, b) =>
    a.year.localeCompare(b.year)
  );

  const locationName = sortedRecords[0].locationName;
  const lines: string[] = [
    `Historical Groundwater Data for ${locationName}`,
    `Available Years: ${sortedRecords.map((r) => r.year).join(", ")}`,
    "",
  ];

  for (const record of sortedRecords) {
    const data = record.data as Record<string, unknown>;
    lines.push(`--- ${record.year} ---`);
    lines.push(`  Category: ${data.categoryTotal || "N/A"}`);
    lines.push(`  Rainfall: ${formatNumber(data.rainfallTotal)} mm`);
    lines.push(`  Recharge: ${formatNumber(data.rechargeTotalTotal)} ham`);
    lines.push(`  Extractable: ${formatNumber(data.extractableTotal)} ham`);
    lines.push(`  Extraction: ${formatNumber(data.draftTotalTotal)} ham`);
    lines.push(
      `  Stage of Extraction: ${formatNumber(data.stageOfExtractionTotal)}%`
    );
    lines.push("");
  }

  if (sortedRecords.length >= 2) {
    const first = sortedRecords[0].data as Record<string, unknown>;
    const last = sortedRecords[sortedRecords.length - 1].data as Record<
      string,
      unknown
    >;

    lines.push("--- Trend Analysis ---");

    const extractionChange = calculateChange(
      first.draftTotalTotal,
      last.draftTotalTotal
    );
    const stageChange = calculateChange(
      first.stageOfExtractionTotal,
      last.stageOfExtractionTotal
    );
    const extractableChange = calculateChange(
      first.extractableTotal,
      last.extractableTotal
    );

    lines.push(
      `  Extraction Change (${sortedRecords[0].year} to ${
        sortedRecords[sortedRecords.length - 1].year
      }): ${extractionChange}`
    );
    lines.push(`  Stage of Extraction Change: ${stageChange}`);
    lines.push(`  Extractable Resources Change: ${extractableChange}`);
  }

  return lines.join("\n");
}

function calculateChange(oldVal: unknown, newVal: unknown): string {
  const oldNum = Number(oldVal);
  const newNum = Number(newVal);

  if (isNaN(oldNum) || isNaN(newNum) || oldNum === 0) return "N/A";

  const change = ((newNum - oldNum) / oldNum) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
