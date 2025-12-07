import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  searchLocation,
  getAllStates,
  getDistrictsOfState,
  getTaluksOfDistrict,
} from "./locationSearch";
import {
  searchAndGetGroundwaterData,
  getTopLocationsByField,
  getCategorySummary,
  getAggregateStats,
  getLocationWithChildren,
  formatGroundwaterDataForLLM,
  generateChartData,
  generateComparisonChartData,
} from "./groundwaterService";

export const searchGroundwaterDataTool = tool(
  async ({ locationName, locationType, stateName, districtName }) => {
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

    const record = await searchAndGetGroundwaterData(
      locationName,
      type,
      parentName
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
      textSummary: formatGroundwaterDataForLLM(record),
      charts: generateChartData(record),
      rawData: record,
    });
  },
  {
    name: "search_groundwater_data",
    description: `Search for a location and get its AGGREGATED groundwater data. This tool handles fuzzy matching (e.g., "uttar pradesh" or "uttar_pradesh" both work).

DATA AVAILABLE:
- For STATES: Aggregated data for the entire state (sum of all districts)
- For DISTRICTS: Aggregated data for the entire district (sum of all taluks)
- For TALUKS: Individual taluk-level data (lowest granularity)

WHEN TO USE:
- User asks about groundwater in a specific location
- User wants recharge, extraction, rainfall, or category data for a place
- User asks about water availability, stage of extraction, or resource status

TIPS FOR BETTER RESULTS:
- If searching for a district, provide the state name for disambiguation
- If searching for a taluk, provide the district name for disambiguation
- Many locations share names across states (e.g., "Lucknow" district - specify "Uttar Pradesh")`,
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
    }),
  }
);

export const compareLocationsTool = tool(
  async ({ locationNames, locationType }) => {
    const type = locationType?.toUpperCase() as
      | "STATE"
      | "DISTRICT"
      | "TALUK"
      | undefined;
    const records = [];

    for (const name of locationNames) {
      const record = await searchAndGetGroundwaterData(name, type);
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
      textSummary: textSummaries,
      charts: generateComparisonChartData(records),
      locations: records.map((r) => ({
        id: r.location.id,
        name: r.location.name,
        type: r.location.type,
      })),
    });
  },
  {
    name: "compare_locations",
    description: `Compare groundwater data across multiple locations side-by-side.

WHEN TO USE:
- User wants to compare two or more states, districts, or taluks
- User asks which location has better/worse groundwater status
- User wants to see differences in recharge, extraction, or rainfall between places

DATA RETURNED:
- Side-by-side metrics for each location
- Comparison charts showing recharge, extraction, extractable resources, and rainfall
- Stage of extraction comparison`,
    schema: z.object({
      locationNames: z
        .array(z.string())
        .describe(
          "Array of location names to compare. All should ideally be same type (all states, all districts, or all taluks)."
        ),
      locationType: z
        .enum(["state", "district", "taluk"])
        .optional()
        .describe(
          "Type of locations being compared. If all are states, use 'state'. If mixed, leave empty."
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

export const allTools = [
  searchGroundwaterDataTool,
  compareLocationsTool,
  getTopLocationsTool,
  getCategorySummaryTool,
  listLocationsTool,
  getLocationDetailsTool,
];
