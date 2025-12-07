import { db } from "../db/gw-db";
import { groundwaterData, locations } from "../db/gw-schema";
import { eq, desc, asc, sql, and, isNotNull } from "drizzle-orm";
import {
  searchLocation,
  searchState,
  searchDistrict,
  searchTaluk,
  getLocationById,
  getLocationHierarchy,
  getDistrictsOfState,
  getTaluksOfDistrict,
  getAllStates,
} from "./locationSearch";

export interface GroundwaterRecord {
  location: {
    id: string;
    name: string;
    type: string;
    year: string;
  };
  data: Record<string, unknown>;
}

export async function getGroundwaterDataByLocationId(
  locationId: string
): Promise<GroundwaterRecord | null> {
  const result = await db
    .select()
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(eq(locations.id, locationId))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  return {
    location: {
      id: row.locations.id,
      name: row.locations.name,
      type: row.locations.type,
      year: row.locations.year,
    },
    data: row.groundwater_data,
  };
}

export async function searchAndGetGroundwaterData(
  query: string,
  locationType?: "STATE" | "DISTRICT" | "TALUK"
): Promise<GroundwaterRecord | null> {
  let searchFn = searchLocation;
  if (locationType === "STATE") searchFn = searchState;
  else if (locationType === "DISTRICT") searchFn = searchDistrict;
  else if (locationType === "TALUK") searchFn = searchTaluk;

  const results = searchFn(query, locationType);
  if (results.length === 0) return null;

  const bestMatch = results[0];
  return getGroundwaterDataByLocationId(bestMatch.location.id);
}

export async function compareLocations(
  locationIds: string[]
): Promise<GroundwaterRecord[]> {
  const results: GroundwaterRecord[] = [];

  for (const id of locationIds) {
    const data = await getGroundwaterDataByLocationId(id);
    if (data) results.push(data);
  }

  return results;
}

export async function getTopLocationsByField(
  field: string,
  locationType: "STATE" | "DISTRICT" | "TALUK",
  order: "asc" | "desc" = "desc",
  limit: number = 10
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
      year: row.locations.year,
    },
    data: row.groundwater_data,
  }));
}

export async function getLocationWithChildren(
  locationId: string
): Promise<{
  parent: GroundwaterRecord | null;
  children: GroundwaterRecord[];
}> {
  const parent = await getGroundwaterDataByLocationId(locationId);
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
    const data = await getGroundwaterDataByLocationId(child.id);
    if (data) children.push(data);
  }

  return { parent, children };
}

export async function getCategorySummary(
  locationType: "STATE" | "DISTRICT" | "TALUK"
): Promise<Record<string, number>> {
  const result = await db
    .select({
      category: groundwaterData.categoryTotal,
      count: sql<number>`count(*)`,
    })
    .from(groundwaterData)
    .innerJoin(locations, eq(groundwaterData.locationId, locations.id))
    .where(eq(locations.type, locationType))
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
  locationType: "STATE" | "DISTRICT" | "TALUK"
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
    .where(eq(locations.type, locationType));

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

export function formatGroundwaterDataForLLM(record: GroundwaterRecord): string {
  const data = record.data as Record<string, unknown>;
  const lines: string[] = [
    `Location: ${record.location.name} (${record.location.type})`,
    `Year: ${record.location.year}`,
    "",
  ];

  if (data.rainfallTotal) {
    lines.push(`Rainfall: ${Number(data.rainfallTotal).toFixed(2)} mm`);
  }

  if (data.categoryTotal) {
    lines.push(`Category: ${data.categoryTotal}`);
  }

  lines.push("");
  lines.push("Ground Water Recharge (ham):");
  if (data.rechargeRainfallTotal)
    lines.push(
      `  - Rainfall: ${Number(data.rechargeRainfallTotal).toFixed(2)}`
    );
  if (data.rechargeCanalTotal)
    lines.push(`  - Canal: ${Number(data.rechargeCanalTotal).toFixed(2)}`);
  if (data.rechargeSurfaceIrrigationTotal)
    lines.push(
      `  - Surface Irrigation: ${Number(
        data.rechargeSurfaceIrrigationTotal
      ).toFixed(2)}`
    );
  if (data.rechargeGwIrrigationTotal)
    lines.push(
      `  - GW Irrigation: ${Number(data.rechargeGwIrrigationTotal).toFixed(2)}`
    );
  if (data.rechargeWaterBodyTotal)
    lines.push(
      `  - Tanks & Ponds: ${Number(data.rechargeWaterBodyTotal).toFixed(2)}`
    );
  if (data.rechargeArtificialStructureTotal)
    lines.push(
      `  - Artificial Structures: ${Number(
        data.rechargeArtificialStructureTotal
      ).toFixed(2)}`
    );
  if (data.rechargeTotalTotal)
    lines.push(
      `  Total Recharge: ${Number(data.rechargeTotalTotal).toFixed(2)}`
    );

  lines.push("");
  lines.push("Natural Discharges (ham):");
  if (data.lossTotal)
    lines.push(`  Total Loss: ${Number(data.lossTotal).toFixed(2)}`);
  if (data.baseflowLateralTotal)
    lines.push(
      `  - Lateral Flows: ${Number(data.baseflowLateralTotal).toFixed(2)}`
    );
  if (data.baseflowVerticalTotal)
    lines.push(
      `  - Vertical Flows: ${Number(data.baseflowVerticalTotal).toFixed(2)}`
    );

  lines.push("");
  if (data.extractableTotal) {
    lines.push(
      `Annual Extractable GW Resources: ${Number(data.extractableTotal).toFixed(
        2
      )} ham`
    );
  }

  lines.push("");
  lines.push("Ground Water Extraction (ham):");
  if (data.draftAgricultureTotal)
    lines.push(
      `  - Irrigation: ${Number(data.draftAgricultureTotal).toFixed(2)}`
    );
  if (data.draftDomesticTotal)
    lines.push(`  - Domestic: ${Number(data.draftDomesticTotal).toFixed(2)}`);
  if (data.draftIndustryTotal)
    lines.push(`  - Industry: ${Number(data.draftIndustryTotal).toFixed(2)}`);
  if (data.draftTotalTotal)
    lines.push(
      `  Total Extraction: ${Number(data.draftTotalTotal).toFixed(2)}`
    );

  if (data.stageOfExtractionTotal) {
    lines.push("");
    lines.push(
      `Stage of Extraction: ${Number(data.stageOfExtractionTotal).toFixed(2)}%`
    );
  }

  return lines.join("\n");
}

export function generateChartData(record: GroundwaterRecord): object[] {
  const data = record.data as Record<string, unknown>;
  const charts: object[] = [];

  // Recharge breakdown chart
  const rechargeData = [
    {
      source: "Rainfall",
      command: data.rechargeRainfallCommand,
      nonCommand: data.rechargeRainfallNonCommand,
      total: data.rechargeRainfallTotal,
    },
    {
      source: "Canal",
      command: data.rechargeCanalCommand,
      nonCommand: data.rechargeCanalNonCommand,
      total: data.rechargeCanalTotal,
    },
    {
      source: "Surface Irrigation",
      command: data.rechargeSurfaceIrrigationCommand,
      nonCommand: data.rechargeSurfaceIrrigationNonCommand,
      total: data.rechargeSurfaceIrrigationTotal,
    },
    {
      source: "GW Irrigation",
      command: data.rechargeGwIrrigationCommand,
      nonCommand: data.rechargeGwIrrigationNonCommand,
      total: data.rechargeGwIrrigationTotal,
    },
    {
      source: "Tanks & Ponds",
      command: data.rechargeWaterBodyCommand,
      nonCommand: data.rechargeWaterBodyNonCommand,
      total: data.rechargeWaterBodyTotal,
    },
    {
      source: "Artificial Structures",
      command: data.rechargeArtificialStructureCommand,
      nonCommand: data.rechargeArtificialStructureNonCommand,
      total: data.rechargeArtificialStructureTotal,
    },
  ].filter((r) => r.total);

  if (rechargeData.length > 0) {
    charts.push({
      type: "chart",
      chartType: "bar",
      title: `Ground Water Recharge - ${record.location.name}`,
      description: "Breakdown of ground water recharge by source (ham)",
      data: rechargeData,
    });
  }

  // Extraction breakdown pie chart
  const extractionData = [
    { name: "Irrigation", value: data.draftAgricultureTotal },
    { name: "Domestic", value: data.draftDomesticTotal },
    { name: "Industry", value: data.draftIndustryTotal },
  ].filter((e) => e.value);

  if (extractionData.length > 0) {
    charts.push({
      type: "chart",
      chartType: "pie",
      title: `Ground Water Extraction - ${record.location.name}`,
      description: "Distribution of ground water extraction by use (ham)",
      data: extractionData,
    });
  }

  // Summary stats card
  charts.push({
    type: "stats",
    title: `Key Metrics - ${record.location.name}`,
    data: {
      rainfall: data.rainfallTotal,
      totalRecharge: data.rechargeTotalTotal,
      totalExtraction: data.draftTotalTotal,
      extractableResources: data.extractableTotal,
      stageOfExtraction: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    },
  });

  return charts;
}

export function generateComparisonChartData(
  records: GroundwaterRecord[]
): object[] {
  const charts: object[] = [];

  // Comparison bar chart
  const comparisonData = records.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      name: r.location.name,
      recharge: data.rechargeTotalTotal,
      extraction: data.draftTotalTotal,
      extractable: data.extractableTotal,
      rainfall: data.rainfallTotal,
    };
  });

  charts.push({
    type: "chart",
    chartType: "bar",
    title: "Location Comparison",
    description: "Comparison of key groundwater metrics",
    data: comparisonData,
  });

  // Stage of extraction comparison
  const stageData = records.map((r) => {
    const data = r.data as Record<string, unknown>;
    return {
      name: r.location.name,
      value: data.stageOfExtractionTotal,
      category: data.categoryTotal,
    };
  });

  charts.push({
    type: "chart",
    chartType: "bar",
    title: "Stage of Extraction Comparison",
    description: "Comparison of extraction rates (%)",
    data: stageData,
  });

  return charts;
}
