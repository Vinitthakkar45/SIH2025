import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  formatGroundwaterDataForLLM,
  formatHistoricalDataForLLM,
  generateChartData,
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

export const searchGroundwaterDataTool = tool(
  async ({
    locationName,
    locationType,
    stateName,
    districtName,
    year,
    fromYear,
    toYear,
    specificYears,
  }) => {
    const type = locationType?.toUpperCase() as
      | "STATE"
      | "DISTRICT"
      | "TALUK"
      | undefined;

    const parentName =
      type === "DISTRICT"
        ? stateName
        : type === "TALUK"
        ? districtName
        : undefined;

    // If year range or specific years requested, use historical data
    if (fromYear || toYear || specificYears) {
      let records = await searchAndGetHistoricalData(locationName, type!);

      if (records.length === 0) {
        return JSON.stringify({
          found: false,
          message: `No historical data found for "${locationName}"`,
        });
      }

      // Filter by year range or specific years
      if (specificYears && specificYears.length > 0) {
        records = records.filter((r) => specificYears.includes(r.year));
      } else if (fromYear || toYear) {
        records = records.filter((r) => {
          if (fromYear && toYear) {
            return r.year >= fromYear && r.year <= toYear;
          } else if (fromYear) {
            return r.year >= fromYear;
          } else if (toYear) {
            return r.year <= toYear;
          }
          return true;
        });
      }

      if (records.length === 0) {
        return JSON.stringify({
          found: false,
          message: `No data found for "${locationName}" in the specified year range`,
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

    // Single year query
    const record = await searchAndGetGroundwaterData(
      locationName,
      type,
      parentName,
      year
    );

    if (!record) {
      return JSON.stringify({
        found: false,
        message: `No groundwater data found for "${locationName}"${
          parentName ? ` in ${parentName}` : ""
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
    description: `Search location and get groundwater data for SINGLE YEAR or MULTIPLE YEARS (with trends).

DATA: States (aggregated), Districts (aggregated), Taluks (individual) • Years: 2016-2017 to 2024-2025 (default: 2024-2025)

USE FOR: "Gujarat data", "Maharashtra in 2021-2022", "Tamil Nadu from 2019 to 2023", "Karnataka since 2020"

YEAR FILTERING:
- 'year': "2023-2024" → Single year snapshot (12+ visualizations)
- 'fromYear' + 'toYear': "2019-2020" to "2023-2024" → Year range trends (14+ visualizations)
- 'fromYear' only: "2020-2021" → From year onwards ("since 2020")
- 'toYear' only: "2022-2023" → Until year ("until 2022")
- 'specificYears': ["2019-2020", "2022-2023"] → Non-consecutive years ("for 2019 and 2022")
- Omit all → Defaults to 2024-2025

RETURNS: Single year → summary, tables, charts | Multi-year → trends, YoY changes, sustainability metrics`,
    schema: z.object({
      locationName: z
        .string()
        .describe(
          "Name of the location (state, district, or taluk). Handles underscores, hyphens, and spacing variations."
        ),
      locationType: z
        .enum(["state", "district", "taluk"])
        .optional()
        .describe(
          "Type of location. Use 'state' for state-level aggregated data, 'district' for district-level aggregated data, 'taluk' for taluk-level data."
        ),
      stateName: z
        .string()
        .optional()
        .describe(
          "Parent state name when searching for a district. Helps disambiguate districts with same name in different states."
        ),
      districtName: z
        .string()
        .optional()
        .describe(
          "Parent district name when searching for a taluk. Helps disambiguate taluks with same name in different districts."
        ),
      year: z
        .string()
        .optional()
        .describe(
          "Year in format YYYY-YYYY (e.g., '2024-2025'). Parse natural language years: '2021' → '2021-2022', '2023-24' → '2023-2024'. Defaults to latest year (2024-2025) if not specified. Available years: 2016-2017, 2019-2020, 2021-2022, 2022-2023, 2023-2024, 2024-2025. NOTE: Use fromYear/toYear or specificYears for multi-year queries."
        ),
      fromYear: z
        .string()
        .optional()
        .describe(
          "Start year for range filter (format: YYYY-YYYY, e.g., '2019-2020'). Use with toYear or alone for 'since X' queries. When provided, returns historical trend data."
        ),
      toYear: z
        .string()
        .optional()
        .describe(
          "End year for range filter (format: YYYY-YYYY, e.g., '2023-2024'). Use with fromYear or alone for 'until X' queries. When provided, returns historical trend data."
        ),
      specificYears: z
        .array(z.string())
        .optional()
        .describe(
          "Array of specific years (format: ['2019-2020', '2022-2023']). Use when user wants data for specific non-consecutive years. When provided, returns historical trend data."
        ),
    }),
  }
);

export const compareLocationsTool = tool(
  async ({
    locationNames,
    locationType,
    year,
    fromYear,
    toYear,
    specificYears,
  }) => {
    const type = locationType?.toUpperCase() as
      | "STATE"
      | "DISTRICT"
      | "TALUK"
      | undefined;

    // Multi-year comparison across locations
    if (fromYear || toYear || specificYears) {
      const allLocationRecords: Array<{
        locationName: string;
        locationId: string;
        records: any[];
      }> = [];

      for (const name of locationNames) {
        let records = await searchAndGetHistoricalData(name, type!);

        if (records.length === 0) continue;

        // Filter by year range or specific years
        if (specificYears && specificYears.length > 0) {
          records = records.filter((r) => specificYears.includes(r.year));
        } else if (fromYear || toYear) {
          records = records.filter((r) => {
            if (fromYear && toYear) {
              return r.year >= fromYear && r.year <= toYear;
            } else if (fromYear) {
              return r.year >= fromYear;
            } else if (toYear) {
              return r.year <= toYear;
            }
            return true;
          });
        }

        if (records.length > 0) {
          allLocationRecords.push({
            locationName: records[0].locationName,
            locationId: records[0].locationId,
            records: records,
          });
        }
      }

      if (allLocationRecords.length === 0) {
        return JSON.stringify({
          found: false,
          message:
            "No historical data found for the specified locations in the given year range",
        });
      }

      const yearsAvailable = allLocationRecords[0].records.map((r) => r.year);
      const textSummaries = allLocationRecords
        .map(
          (loc) =>
            `${loc.locationName}:\n${formatHistoricalDataForLLM(loc.records)}`
        )
        .join("\n\n---\n\n");

      return JSON.stringify({
        found: true,
        isHistoricalComparison: true,
        count: allLocationRecords.length,
        locationType: type || "STATE",
        locationsCompared: allLocationRecords.map((l) => l.locationName),
        yearsAvailable: yearsAvailable,
        dataPointCount: yearsAvailable.length,
        locationData: allLocationRecords.map((loc) => ({
          locationName: loc.locationName,
          locationId: loc.locationId,
          locationType: type || "STATE",
          years: loc.records.map((r) => r.year),
        })),
        textSummary: textSummaries,
      });
    }

    // Single year comparison
    const targetYear = year || "2024-2025";
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
        message: "No groundwater data found for the specified locations",
      });
    }

    const textSummaries = records
      .map((r) => formatGroundwaterDataForLLM(r))
      .join("\n\n---\n\n");

    return JSON.stringify({
      found: true,
      count: records.length,
      year: targetYear,
      locationsCompared: locationNames,
      textSummary: textSummaries,
      locationIds: records.map((r) => r.location.id),
      locations: records.map((r) => ({
        id: r.location.id,
        name: r.location.name,
        type: r.location.type,
      })),
    });
  },
  {
    name: "compare_locations",
    description: `Compare 2-10 locations side-by-side for SINGLE YEAR or MULTIPLE YEARS (with trends).

USE FOR: "Compare Gujarat and Maharashtra", "Compare top 5 states from 2019 to 2023", "Which state has improved since 2020?"

YEAR FILTERING:
- 'year': "2023-2024" → Single year comparison (8+ charts: table, metrics, rainfall, stage, recharge, extraction, balance, etc.)
- 'fromYear' + 'toYear': "2019-2020" to "2023-2024" → Multi-year comparison trends for all locations
- 'fromYear' only: "2020-2021" → From year onwards ("since 2020")
- 'toYear' only: "2022-2023" → Until year ("until 2022")
- 'specificYears': ["2019-2020", "2022-2023"] → Non-consecutive years
- Omit all → Defaults to 2024-2025

RETURNS: Single year → comparison charts | Multi-year → historical trends for each location side-by-side`,
    schema: z.object({
      locationNames: z
        .array(z.string())
        .min(2)
        .max(10)
        .describe("Array of 2-10 location names to compare."),
      locationType: z
        .enum(["state", "district", "taluk"])
        .optional()
        .describe("Type of locations being compared (state/district/taluk)."),
      year: z
        .string()
        .optional()
        .describe(
          "Year for single-year comparison (format: YYYY-YYYY, e.g., '2023-2024'). Defaults to 2024-2025. NOTE: Use fromYear/toYear or specificYears for multi-year comparison."
        ),
      fromYear: z
        .string()
        .optional()
        .describe(
          "Start year for range filter (format: YYYY-YYYY, e.g., '2019-2020'). Use with toYear or alone for 'since X' queries. Returns historical comparison trends."
        ),
      toYear: z
        .string()
        .optional()
        .describe(
          "End year for range filter (format: YYYY-YYYY, e.g., '2023-2024'). Use with fromYear or alone for 'until X' queries. Returns historical comparison trends."
        ),
      specificYears: z
        .array(z.string())
        .optional()
        .describe(
          "Array of specific years (format: ['2019-2020', '2022-2023']). Use for non-consecutive years comparison."
        ),
    }),
  }
);

export const getHistoricalDataTool = tool(
  async ({ locationName, locationType, fromYear, toYear, specificYears }) => {
    const type = locationType.toUpperCase() as "STATE" | "DISTRICT" | "TALUK";
    let records = await searchAndGetHistoricalData(locationName, type);

    if (records.length === 0) {
      const availableYears = await getAvailableYears();
      return JSON.stringify({
        found: false,
        message: `No historical data found for "${locationName}"`,
        availableYears,
      });
    }

    // Filter by year range or specific years
    if (specificYears && specificYears.length > 0) {
      records = records.filter((r) => specificYears.includes(r.year));
    } else if (fromYear || toYear) {
      records = records.filter((r) => {
        if (fromYear && toYear) {
          return r.year >= fromYear && r.year <= toYear;
        } else if (fromYear) {
          return r.year >= fromYear;
        } else if (toYear) {
          return r.year <= toYear;
        }
        return true;
      });
    }

    if (records.length === 0) {
      return JSON.stringify({
        found: false,
        message: `No data found for "${locationName}" in the specified year range`,
      });
    }

    return JSON.stringify({
      found: true,
      locationName: records[0].locationName,
      locationId: records[0].locationId,
      locationType: locationType,
      yearsAvailable: records.map((r) => r.year),
      dataPointCount: records.length,
      textSummary: formatHistoricalDataForLLM(records),
    });
  },
  {
    name: "get_historical_data",
    description: `Get multi-year historical trends for a location. Similar to search_groundwater_data with year filters.

USE FOR: "Gujarat trends", "Maharashtra over the years", "Tamil Nadu from 2019 to 2023", "Karnataka changes since 2020"
NOTE: search_groundwater_data can also handle historical queries - use either tool.

YEAR FILTERING:
- 'fromYear' + 'toYear': "2019-2020" to "2023-2024" → Year range ("from 2019 to 2023")
- 'fromYear' only: "2020-2021" → From year onwards ("since 2020")
- 'toYear' only: "2022-2023" → Until year ("until 2022")
- 'specificYears': ["2019-2020", "2022-2023"] → Specific years ("for 2019 and 2022")
- Omit all → Returns all available years (2016-2017 to 2024-2025)

RETURNS: 14+ visualizations - year-wise table, trend lines, YoY changes, sustainability metrics, category evolution`,
    schema: z.object({
      locationName: z
        .string()
        .describe("Name of the location (state, district, or taluk)"),
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe("Type of location"),
      fromYear: z
        .string()
        .optional()
        .describe(
          "Start year for range filter (format: YYYY-YYYY, e.g., '2019-2020'). Use for queries like 'since 2020' or 'from 2019 to 2023'."
        ),
      toYear: z
        .string()
        .optional()
        .describe(
          "End year for range filter (format: YYYY-YYYY, e.g., '2023-2024'). Use for queries like 'until 2023' or 'from 2019 to 2023'."
        ),
      specificYears: z
        .array(z.string())
        .optional()
        .describe(
          "Array of specific years to include (format: ['2019-2020', '2022-2023']). Use when user mentions specific years like 'for 2019, 2021, and 2023'."
        ),
    }),
  }
);

export const getTopLocationsTool = tool(
  async ({ metric, locationType, order, limit }) => {
    const type = locationType.toUpperCase() as "STATE" | "DISTRICT" | "TALUK";
    const records = await getTopLocationsByField(metric, type, order, limit);

    if (records.length === 0) {
      return JSON.stringify({ found: false, message: "No data found" });
    }

    const data = records.map((r, i) => {
      const d = r.data as Record<string, unknown>;
      return {
        rank: i + 1,
        name: r.location.name,
        type: r.location.type,
        value: d[metricToField(metric)] ?? null,
        category: d.categoryTotal,
      };
    });

    return JSON.stringify({
      found: true,
      metric,
      order,
      data,
      charts: [
        {
          type: "chart",
          chartType: "bar",
          title: `Top ${limit} ${locationType}s by ${metric}`,
          description: `${
            order === "desc" ? "Highest" : "Lowest"
          } ${metric} values`,
          data: data.map((d) => ({ name: d.name, value: d.value })),
        },
      ],
    });
  },
  {
    name: "get_top_locations",
    description: `Get ranked list of locations by a specific groundwater metric.

METRICS AVAILABLE:
- rainfall: Annual rainfall in mm
- recharge: Total groundwater recharge (ham)
- extraction: Total groundwater extraction/draft (ham)
- extractable: Annual extractable groundwater resources (ham)
- stage_of_extraction: Extraction as % of extractable resources (critical indicator)
- loss: Natural discharge/loss (ham)

WHEN TO USE:
- User asks "which states have highest extraction"
- User wants to find "most water-stressed districts"
- User asks for "top 5 taluks with best recharge"
- User wants rankings or leaderboards

NOTE: For state-level, data is aggregated sum of all districts. For district-level, aggregated sum of all taluks.`,
    schema: z.object({
      metric: z
        .enum([
          "rainfall",
          "recharge",
          "extraction",
          "extractable",
          "stage_of_extraction",
          "loss",
        ])
        .describe("The metric to rank locations by"),
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe(
          "Type of locations to rank. 'state' gives aggregated state data, 'district' gives aggregated district data."
        ),
      order: z
        .enum(["asc", "desc"])
        .default("desc")
        .describe(
          "Sort order - 'desc' for highest first (e.g., most extraction), 'asc' for lowest first (e.g., least rainfall)"
        ),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Number of results to return (1-20)"),
    }),
  }
);

export const getCategorySummaryTool = tool(
  async ({ locationType }) => {
    const type = locationType.toUpperCase() as "STATE" | "DISTRICT" | "TALUK";
    const summary = await getCategorySummary(type);
    const stats = await getAggregateStats(type);

    const categoryData = Object.entries(summary).map(([category, count]) => ({
      name: category,
      value: count,
    }));

    return JSON.stringify({
      found: true,
      locationType,
      categoryCounts: summary,
      aggregateStats: stats,
      charts: [
        {
          type: "chart",
          chartType: "pie",
          title: `${locationType} Category Distribution`,
          description: "Distribution of locations by groundwater category",
          data: categoryData,
        },
      ],
    });
  },
  {
    name: "get_category_summary",
    description: `Get national-level summary of groundwater categories and aggregate statistics.

CATEGORIES:
- Safe: Stage of extraction < 70%
- Semi-Critical: 70-90%
- Critical: 90-100%
- Over-Exploited: > 100%
- Saline: Saline groundwater

WHEN TO USE:
- User asks "how many states are over-exploited"
- User wants overall groundwater health status
- User asks for national statistics or summary
- User wants to understand the distribution of water stress

AGGREGATE STATS RETURNED:
- Total recharge, draft, extractable resources
- Average rainfall and stage of extraction
- Count of locations in each category`,
    schema: z.object({
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe(
          "Level of aggregation. 'state' counts states by category, 'district' counts districts, 'taluk' counts taluks."
        ),
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
      if (stateResults.length === 0) {
        return JSON.stringify({
          found: false,
          message: `State "${parentName}" not found`,
        });
      }
      locations = getDistrictsOfState(stateResults[0].location.id);
    } else if (locationType === "taluk" && parentName) {
      const districtResults = searchLocation(
        parentName.replace(/[_-]/g, " "),
        "DISTRICT"
      );
      if (districtResults.length === 0) {
        return JSON.stringify({
          found: false,
          message: `District "${parentName}" not found`,
        });
      }
      locations = getTaluksOfDistrict(districtResults[0].location.id);
    } else {
      return JSON.stringify({
        found: false,
        message:
          "For districts, provide the state name. For taluks, provide the district name.",
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
    description: `List all child locations under a parent. Handles fuzzy name matching.

WHEN TO USE:
- User asks "list all states" or "show me all states"
- User asks "what districts are in Maharashtra"
- User asks "show taluks in Lucknow district"
- User wants to explore the location hierarchy

HIERARCHY:
India → States → Districts → Taluks`,
    schema: z.object({
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe("Type of locations to list"),
      parentName: z
        .string()
        .optional()
        .describe(
          "Parent location name. Required for districts (state name) and taluks (district name). Not needed for states."
        ),
    }),
  }
);

export const getLocationDetailsTool = tool(
  async ({ locationName, locationType, includeChildren }) => {
    const type = locationType?.toUpperCase() as
      | "STATE"
      | "DISTRICT"
      | "TALUK"
      | undefined;
    const record = await searchAndGetGroundwaterData(
      locationName.replace(/[_-]/g, " "),
      type
    );

    if (!record) {
      return JSON.stringify({
        found: false,
        message: `Location "${locationName}" not found`,
      });
    }

    if (includeChildren) {
      const { parent, children } = await getLocationWithChildren(
        record.location.id
      );
      if (!parent) {
        return JSON.stringify({ found: false, message: "Location not found" });
      }

      return JSON.stringify({
        found: true,
        parent: {
          textSummary: formatGroundwaterDataForLLM(parent),
          charts: generateChartData(parent),
        },
        children: children.map((c) => ({
          id: c.location.id,
          name: c.location.name,
          type: c.location.type,
          category: (c.data as Record<string, unknown>).categoryTotal,
          extractable: (c.data as Record<string, unknown>).extractableTotal,
          extraction: (c.data as Record<string, unknown>).draftTotalTotal,
        })),
        childrenCount: children.length,
      });
    }

    return JSON.stringify({
      found: true,
      textSummary: formatGroundwaterDataForLLM(record),
      charts: generateChartData(record),
    });
  },
  {
    name: "get_location_details",
    description: `Get detailed groundwater data for a location with optional breakdown by children.

WHEN TO USE:
- User asks for detailed groundwater info about a specific place
- User wants to see a state's data with all its districts listed
- User wants district data with all taluks listed
- User asks "show me Maharashtra with all its districts"

PARENT DATA: Aggregated data for the location
CHILDREN DATA: Summary of each child location (districts for state, taluks for district)`,
    schema: z.object({
      locationName: z
        .string()
        .describe("Name of the location. Handles fuzzy matching."),
      locationType: z
        .enum(["state", "district", "taluk"])
        .optional()
        .describe("Type of location for disambiguation"),
      includeChildren: z
        .boolean()
        .default(false)
        .describe(
          "Include child locations (districts for state, taluks for district)"
        ),
    }),
  }
);

function metricToField(metric: string): string {
  const map: Record<string, string> = {
    rainfall: "rainfallTotal",
    recharge: "rechargeTotalTotal",
    extraction: "draftTotalTotal",
    extractable: "extractableTotal",
    stage_of_extraction: "stageOfExtractionTotal",
    loss: "lossTotal",
  };
  return map[metric] ?? metric;
}


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
    description: `Get the list of years for which groundwater data is available.

WHEN TO USE:
- User asks what years of data are available
- User wants to know the time range of available data
- Before making historical queries to verify year availability`,
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
