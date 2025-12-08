import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  formatGroundwaterDataForLLM,
  formatHistoricalDataForLLM,
  getAggregateStats,
  getCategorySummary,
  getLocationWithChildren,
  getTopLocationsByField,
  searchAndGetGroundwaterData,
  searchAndGetHistoricalData,
} from "./groundwaterService";
import {
  getAllStates,
  getAvailableYears,
  getDistrictsOfState,
  getTaluksOfDistrict,
  searchLocation,
} from "./locationSearch";
import {
  filterRecordsByYear,
  getFilteredYears,
  calculatePercentChange,
} from "../utils/yearFiltering";
import {
  metricToField,
  metricToLabel,
  metricToUnit,
  VALID_METRICS,
} from "../utils/metricHelpers";

type LocationType = "STATE" | "DISTRICT" | "TALUK";

const yearFilterSchema = {
  year: z
    .string()
    .optional()
    .describe("Year (format: YYYY-YYYY). Defaults to 2024-2025."),
  fromYear: z
    .string()
    .optional()
    .describe("Start year for range filter (format: YYYY-YYYY)."),
  toYear: z
    .string()
    .optional()
    .describe("End year for range filter (format: YYYY-YYYY)."),
  specificYears: z
    .array(z.string())
    .optional()
    .describe("Array of specific years."),
};

export const searchGroundwaterDataTool = tool(
  async ({
    locationName,
    locationType,
    stateName,
    districtName,
    ...yearParams
  }) => {
    const type = locationType?.toUpperCase() as LocationType | undefined;
    const parentName =
      type === "DISTRICT"
        ? stateName
        : type === "TALUK"
          ? districtName
          : undefined;

    if (yearParams.fromYear || yearParams.toYear || yearParams.specificYears) {
      let records = await searchAndGetHistoricalData(locationName, type!);
      if (records.length === 0) {
        return JSON.stringify({
          found: false,
          message: `No historical data found for "${locationName}"`,
        });
      }
      records = filterRecordsByYear(records, yearParams);
      if (records.length === 0) {
        return JSON.stringify({
          found: false,
          message: `No data found for "${locationName}" in specified year range`,
        });
      }
      return JSON.stringify({
        found: true,
        isHistorical: true,
        locationName: records[0].locationName,
        locationId: records[0].locationId,
        locationType: type,
        yearsAvailable: records.map((r) => r.year),
        dataPointCount: records.length,
        textSummary: formatHistoricalDataForLLM(records),
      });
    }

    const record = await searchAndGetGroundwaterData(
      locationName,
      type,
      parentName,
      yearParams.year
    );
    if (!record) {
      return JSON.stringify({
        found: false,
        message: `No groundwater data found for "${locationName}"${parentName ? ` in ${parentName}` : ""
          }`,
      });
    }
    return JSON.stringify({
      found: true,
      locationId: record.location.id,
      locationName: record.location.name,
      locationType: record.location.type,
      year: record.year,
      textSummary: formatGroundwaterDataForLLM(record),
    });
  },
  {
    name: "search_groundwater_data",
    description: `Search location and get groundwater data. Years: 2016-2017 to 2024-2025 (default: 2024-2025). Use year filters for trends.`,
    schema: z.object({
      locationName: z
        .string()
        .describe("Location name (state, district, or taluk)."),
      locationType: z.enum(["state", "district", "taluk"]).optional(),
      stateName: z.string().optional().describe("Parent state for districts."),
      districtName: z
        .string()
        .optional()
        .describe("Parent district for taluks."),
      ...yearFilterSchema,
    }),
  }
);

export const compareLocationsTool = tool(
  async ({ locationNames, locationType, ...yearParams }) => {
    const type = locationType?.toUpperCase() as LocationType | undefined;

    if (yearParams.fromYear || yearParams.toYear || yearParams.specificYears) {
      const allLocationRecords: Array<{
        locationName: string;
        locationId: string;
        records: any[];
      }> = [];
      for (const name of locationNames) {
        let records = await searchAndGetHistoricalData(name, type!);
        if (records.length === 0) continue;
        records = filterRecordsByYear(records, yearParams);
        if (records.length > 0) {
          allLocationRecords.push({
            locationName: records[0].locationName,
            locationId: records[0].locationId,
            records,
          });
        }
      }
      if (allLocationRecords.length === 0) {
        return JSON.stringify({
          found: false,
          message: "No historical data found for specified locations",
        });
      }
      return JSON.stringify({
        found: true,
        isHistoricalComparison: true,
        count: allLocationRecords.length,
        locationType: type || "STATE",
        locationsCompared: allLocationRecords.map((l) => l.locationName),
        yearsAvailable: allLocationRecords[0].records.map((r) => r.year),
        dataPointCount: allLocationRecords[0].records.length,
        locationData: allLocationRecords.map((l) => ({
          locationName: l.locationName,
          locationId: l.locationId,
          locationType: type,
          years: l.records.map((r) => r.year),
        })),
        textSummary: allLocationRecords
          .map(
            (loc) =>
              `${loc.locationName}:\n${formatHistoricalDataForLLM(loc.records)}`
          )
          .join("\n\n---\n\n"),
      });
    }

    const targetYear = yearParams.year || "2024-2025";
    const records = [];
    for (const name of locationNames) {
      const record = await searchAndGetGroundwaterData(
        name,
        type,
        undefined,
        targetYear
      );
      if (record) records.push(record);
    }
    if (records.length === 0) {
      return JSON.stringify({
        found: false,
        message: "No groundwater data found for specified locations",
      });
    }
    return JSON.stringify({
      found: true,
      count: records.length,
      year: targetYear,
      locationsCompared: locationNames,
      locationIds: records.map((r) => r.location.id),
      textSummary: records
        .map((r) => formatGroundwaterDataForLLM(r))
        .join("\n\n---\n\n"),
      locations: records.map((r) => ({
        id: r.location.id,
        name: r.location.name,
        type: r.location.type,
      })),
    });
  },
  {
    name: "compare_locations",
    description: `Compare 2-10 locations side-by-side. Use year filters for multi-year comparison.`,
    schema: z.object({
      locationNames: z.array(z.string()).min(2).max(10),
      locationType: z.enum(["state", "district", "taluk"]).optional(),
      ...yearFilterSchema,
    }),
  }
);

export const getHistoricalDataTool = tool(
  async ({ locationName, locationType, ...yearParams }) => {
    const type = locationType.toUpperCase() as LocationType;
    let records = await searchAndGetHistoricalData(locationName, type);
    if (records.length === 0) {
      return JSON.stringify({
        found: false,
        message: `No historical data found for "${locationName}"`,
        availableYears: await getAvailableYears(),
      });
    }
    records = filterRecordsByYear(records, yearParams);
    if (records.length === 0) {
      return JSON.stringify({
        found: false,
        message: `No data found for "${locationName}" in specified year range`,
      });
    }
    return JSON.stringify({
      found: true,
      locationName: records[0].locationName,
      locationId: records[0].locationId,
      locationType,
      yearsAvailable: records.map((r) => r.year),
      dataPointCount: records.length,
      textSummary: formatHistoricalDataForLLM(records),
    });
  },
  {
    name: "get_historical_data",
    description: `Get multi-year historical trends for a location.`,
    schema: z.object({
      locationName: z.string(),
      locationType: z.enum(["state", "district", "taluk"]),
      fromYear: z.string().optional(),
      toYear: z.string().optional(),
      specificYears: z.array(z.string()).optional(),
    }),
  }
);

export const getTopLocationsTool = tool(
  async ({ metric, locationType, order, limit, ...yearParams }) => {
    const type = locationType.toUpperCase() as LocationType;
    const metricLabel = metricToLabel(metric);
    const metricUnit = metricToUnit(metric);
    const { isHistorical, yearsToQuery, targetYear } = await getFilteredYears(
      yearParams
    );

    if (isHistorical && yearsToQuery.length > 1) {
      const locationAggregates: Record<
        string,
        { name: string; values: number[] }
      > = {};
      const yearlyRankings: Record<string, any[]> = {};

      for (const y of yearsToQuery) {
        const records = await getTopLocationsByField(
          metric,
          type,
          order,
          limit * 2,
          y
        );
        yearlyRankings[y] = records.map((r, i) => {
          const d = r.data as Record<string, unknown>;
          const value = d[metricToField(metric)] ?? null;
          const name = r.location.name;
          if (!locationAggregates[name])
            locationAggregates[name] = { name, values: [] };
          if (value !== null)
            locationAggregates[name].values.push(Number(value));
          return { rank: i + 1, name, value, category: d.categoryTotal };
        });
      }

      const aggregatedData = Object.values(locationAggregates)
        .map((loc) => ({
          name: loc.name,
          avgValue: loc.values.length
            ? loc.values.reduce((a, b) => a + b, 0) / loc.values.length
            : 0,
          minValue: loc.values.length ? Math.min(...loc.values) : 0,
          maxValue: loc.values.length ? Math.max(...loc.values) : 0,
        }))
        .sort((a, b) =>
          order === "desc" ? b.avgValue - a.avgValue : a.avgValue - b.avgValue
        )
        .slice(0, limit);

      const trendData = yearsToQuery.map((y) => {
        const point: Record<string, unknown> = { year: y };
        for (const loc of aggregatedData.slice(0, 5)) {
          point[loc.name] =
            yearlyRankings[y]?.find((r) => r.name === loc.name)?.value ?? null;
        }
        return point;
      });

      return JSON.stringify({
        found: true,
        isHistorical: true,
        metric,
        metricLabel,
        metricUnit,
        order,
        limit,
        locationType: type,
        yearsAnalyzed: yearsToQuery,
        data: aggregatedData,
        trendData,
        textSummary: `Top ${limit} ${type}s by ${metricLabel}:\n${aggregatedData
          .map(
            (d, i) =>
              `${i + 1}. ${d.name}: ${d.avgValue.toFixed(2)} ${metricUnit} (range: ${d.minValue.toFixed(2)} - ${d.maxValue.toFixed(2)})`
          )
          .join("\n")}`,
      });
    }

    const records = await getTopLocationsByField(
      metric,
      type,
      order,
      limit,
      targetYear
    );
    if (records.length === 0)
      return JSON.stringify({ found: false, message: "No data found" });

    const data = records.map((r, i) => {
      const d = r.data as Record<string, unknown>;
      return {
        rank: i + 1,
        name: r.location.name,
        value: d[metricToField(metric)],
        category: d.categoryTotal,
        stageOfExtraction: d.stageOfExtractionTotal,
        rainfall: d.rainfallTotal,
        recharge: d.rechargeTotalTotal,
        extraction: d.draftTotalTotal,
      };
    });

    return JSON.stringify({
      found: true,
      metric,
      metricLabel,
      metricUnit,
      order,
      limit,
      locationType: type,
      year: targetYear,
      data,
      textSummary: `Top ${limit} ${type}s by ${metricLabel}:\n${data
        .map(
          (d) =>
            `${d.rank}. ${d.name}: ${Number(d.value).toFixed(2)} ${metricUnit} (Category: ${d.category})`
        )
        .join("\n")}`,
    });
  },
  {
    name: "get_top_locations",
    description: `Get ranked locations by metric. Metrics: ${VALID_METRICS.join(
      ", "
    )}`,
    schema: z.object({
      metric: z.enum(VALID_METRICS as [string, ...string[]]),
      locationType: z.enum(["state", "district", "taluk"]),
      order: z.enum(["asc", "desc"]).default("desc"),
      limit: z.number().min(1).max(20).default(10),
      ...yearFilterSchema,
    }),
  }
);

export const getCategorySummaryTool = tool(
  async ({ locationType, ...yearParams }) => {
    const type = locationType.toUpperCase() as LocationType;
    const { isHistorical, yearsToQuery, targetYear } = await getFilteredYears(
      yearParams
    );

    if (isHistorical && yearsToQuery.length > 1) {
      const yearlyData = await Promise.all(
        yearsToQuery.map(async (y) => ({
          year: y,
          categoryCounts: await getCategorySummary(type, y),
          stats: await getAggregateStats(type, y),
        }))
      );
      const categoryTrendData = yearlyData.map((d) => ({
        year: d.year,
        safe: d.categoryCounts["Safe"] || 0,
        semiCritical: d.categoryCounts["Semi-Critical"] || 0,
        critical: d.categoryCounts["Critical"] || 0,
        overExploited: d.categoryCounts["Over-Exploited"] || 0,
      }));
      const latestData = yearlyData[yearlyData.length - 1];

      return JSON.stringify({
        found: true,
        isHistorical: true,
        locationType,
        yearsAnalyzed: yearsToQuery,
        latestCategoryCounts: latestData.categoryCounts,
        categoryTrendData,
        yearlyStats: yearlyData,
        textSummary: `Category Summary (${yearsToQuery[0]} to ${yearsToQuery[yearsToQuery.length - 1]
          }):\nCurrent: ${Object.entries(latestData.categoryCounts)
            .map(([cat, count]) => `${cat}: ${count}`)
            .join(", ")}`,
      });
    }

    const summary = await getCategorySummary(type, targetYear);
    const stats = await getAggregateStats(type, targetYear);
    const total = Object.values(summary).reduce((sum: number, count: number) => sum + count, 0);

    return JSON.stringify({
      found: true,
      locationType,
      year: targetYear,
      categoryCounts: summary,
      aggregateStats: stats,
      textSummary: `Category Summary for ${type}s (${targetYear}):\n${Object.entries(
        summary
      )
        .map(
          ([cat, count]) =>
            `${cat}: ${count} (${total ? Math.round((count / total) * 1000) / 10 : 0}%)`
        )
        .join("\n")}`,
    });
  },
  {
    name: "get_category_summary",
    description: `Get national-level category summary and aggregate statistics.`,
    schema: z.object({
      locationType: z.enum(["state", "district", "taluk"]),
      ...yearFilterSchema,
    }),
  }
);

export const listLocationsTool = tool(
  async ({ locationType, parentName }) => {
    let locations;
    if (locationType === "state") {
      locations = getAllStates();
    } else if (locationType === "district" && parentName) {
      const stateResults = searchLocation(
        parentName.replace(/[_-]/g, " "),
        "STATE"
      );
      if (stateResults.length === 0)
        return JSON.stringify({
          found: false,
          message: `State "${parentName}" not found`,
        });
      locations = getDistrictsOfState(stateResults[0].location.id);
    } else if (locationType === "taluk" && parentName) {
      const districtResults = searchLocation(
        parentName.replace(/[_-]/g, " "),
        "DISTRICT"
      );
      if (districtResults.length === 0)
        return JSON.stringify({
          found: false,
          message: `District "${parentName}" not found`,
        });
      locations = getTaluksOfDistrict(districtResults[0].location.id);
    } else {
      return JSON.stringify({
        found: false,
        message: "For districts/taluks, provide parent name.",
      });
    }
    return JSON.stringify({
      found: true,
      count: locations.length,
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
      })),
    });
  },
  {
    name: "list_locations",
    description: `List all child locations under a parent. Hierarchy: India → States → Districts → Taluks`,
    schema: z.object({
      locationType: z.enum(["state", "district", "taluk"]),
      parentName: z.string().optional(),
    }),
  }
);

export const getLocationDetailsTool = tool(
  async ({ locationName, locationType, includeChildren, ...yearParams }) => {
    const type = locationType?.toUpperCase() as LocationType | undefined;
    const { isHistorical, targetYear } = await getFilteredYears(yearParams);

    if (
      isHistorical &&
      (yearParams.fromYear || yearParams.toYear || yearParams.specificYears)
    ) {
      let records = await searchAndGetHistoricalData(
        locationName.replace(/[_-]/g, " "),
        type || "STATE"
      );
      if (records.length === 0)
        return JSON.stringify({
          found: false,
          message: `No historical data found for "${locationName}"`,
        });
      records = filterRecordsByYear(records, yearParams);
      if (records.length === 0)
        return JSON.stringify({
          found: false,
          message: `No data found in specified year range`,
        });

      const sortedRecords = [...records].sort((a, b) =>
        a.year.localeCompare(b.year)
      );
      const latestRecord = sortedRecords[sortedRecords.length - 1];
      const earliestRecord = sortedRecords[0];
      const latestData = latestRecord.data as Record<string, unknown>;
      const earliestData = earliestRecord.data as Record<string, unknown>;

      const trendData = sortedRecords.map((r) => {
        const d = r.data as Record<string, unknown>;
        return {
          year: r.year,
          rainfall: d.rainfallTotal,
          recharge: d.rechargeTotalTotal,
          extraction: d.draftTotalTotal,
          stageOfExtraction: d.stageOfExtractionTotal,
          category: d.categoryTotal,
          netBalance:
            (Number(d.rechargeTotalTotal) || 0) -
            (Number(d.draftTotalTotal) || 0),
        };
      });

      return JSON.stringify({
        found: true,
        isHistorical: true,
        locationName: latestRecord.locationName,
        locationId: latestRecord.locationId,
        locationType: type,
        yearsAvailable: sortedRecords.map((r) => r.year),
        trendData,
        changeAnalysis: {
          extractionChange: calculatePercentChange(
            earliestData.draftTotalTotal,
            latestData.draftTotalTotal
          ),
          rechargeChange: calculatePercentChange(
            earliestData.rechargeTotalTotal,
            latestData.rechargeTotalTotal
          ),
          overallTrend:
            Number(latestData.stageOfExtractionTotal) >
              Number(earliestData.stageOfExtractionTotal)
              ? "Worsening"
              : "Improving",
        },
        textSummary: formatHistoricalDataForLLM(sortedRecords),
      });
    }

    const record = await searchAndGetGroundwaterData(
      locationName.replace(/[_-]/g, " "),
      type,
      undefined,
      targetYear
    );
    if (!record)
      return JSON.stringify({
        found: false,
        message: `Location "${locationName}" not found`,
      });

    if (includeChildren) {
      const { parent, children } = await getLocationWithChildren(
        record.location.id,
        targetYear
      );
      if (!parent)
        return JSON.stringify({ found: false, message: "Location not found" });

      const childrenData = children.map((c) => {
        const d = c.data as Record<string, unknown>;
        return {
          name: c.location.name,
          category: d.categoryTotal,
          extractable: d.extractableTotal,
          extraction: d.draftTotalTotal,
          stageOfExtraction: d.stageOfExtractionTotal,
        };
      });

      return JSON.stringify({
        found: true,
        year: targetYear,
        locationId: parent.location.id,
        locationName: parent.location.name,
        parent: {
          locationName: parent.location.name,
          locationId: parent.location.id,
          textSummary: formatGroundwaterDataForLLM(parent),
        },
        childrenCount: children.length,
        childrenData,
        textSummary: `${parent.location.name} (${targetYear}):\n${formatGroundwaterDataForLLM(
          parent
        )}\n\nChild Locations: ${children.length}`,
      });
    }

    return JSON.stringify({
      found: true,
      year: targetYear,
      locationId: record.location.id,
      locationName: record.location.name,
      textSummary: formatGroundwaterDataForLLM(record),
    });
  },
  {
    name: "get_location_details",
    description: `Get detailed groundwater data for a location with optional children breakdown.`,
    schema: z.object({
      locationName: z.string(),
      locationType: z.enum(["state", "district", "taluk"]).optional(),
      includeChildren: z.boolean().default(false),
      ...yearFilterSchema,
    }),
  }
);

export const getAvailableYearsTool = tool(
  async () => {
    const years = await getAvailableYears();
    return JSON.stringify({
      found: true,
      years,
      earliest: years[0],
      latest: years[years.length - 1],
      count: years.length,
    });
  },
  {
    name: "get_available_years",
    description: `Get available years for groundwater data.`,
    schema: z.object({}),
  }
);

export const allTools = [
  searchGroundwaterDataTool,
  compareLocationsTool,
  getTopLocationsTool,
  getCategorySummaryTool,
  listLocationsTool,
  getLocationDetailsTool,
  getHistoricalDataTool,
  getAvailableYearsTool,
];
