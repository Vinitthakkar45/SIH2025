import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  searchLocation,
  searchState,
  searchDistrict,
  searchTaluk,
  getAllStates,
  getDistrictsOfState,
  getTaluksOfDistrict,
} from "./locationSearch";
import {
  searchAndGetGroundwaterData,
  getGroundwaterDataByLocationId,
  compareLocations,
  getTopLocationsByField,
  getCategorySummary,
  getAggregateStats,
  getLocationWithChildren,
  formatGroundwaterDataForLLM,
  generateChartData,
  generateComparisonChartData,
} from "./groundwaterService";

export const findLocationTool = tool(
  async ({ query, type }) => {
    let results;
    if (type === "state") {
      results = searchState(query);
    } else if (type === "district") {
      results = searchDistrict(query);
    } else if (type === "taluk") {
      results = searchTaluk(query);
    } else {
      results = searchLocation(query);
    }

    if (results.length === 0) {
      return JSON.stringify({
        found: false,
        message: `No location found matching "${query}"`,
      });
    }

    return JSON.stringify({
      found: true,
      matches: results.map((r) => ({
        id: r.location.id,
        name: r.location.name,
        type: r.location.type,
        score: r.score,
      })),
    });
  },
  {
    name: "find_location",
    description:
      "Search for a location (state, district, or taluk) by name using fuzzy matching. Use this to find the correct location ID before fetching groundwater data.",
    schema: z.object({
      query: z.string().describe("The location name to search for"),
      type: z
        .enum(["state", "district", "taluk", "any"])
        .optional()
        .describe("Type of location to search for. Use 'any' if unsure."),
    }),
  }
);

export const getGroundwaterDataTool = tool(
  async ({ locationId }) => {
    const record = await getGroundwaterDataByLocationId(locationId);
    if (!record) {
      return JSON.stringify({
        found: false,
        message: "No groundwater data found for this location",
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
    name: "get_groundwater_data",
    description:
      "Get detailed groundwater data for a specific location by its ID. Use find_location first to get the location ID.",
    schema: z.object({
      locationId: z
        .string()
        .describe("The location ID (UUID) obtained from find_location"),
    }),
  }
);

export const searchGroundwaterDataTool = tool(
  async ({ locationName, locationType }) => {
    const type = locationType?.toUpperCase() as
      | "STATE"
      | "DISTRICT"
      | "TALUK"
      | undefined;
    const record = await searchAndGetGroundwaterData(locationName, type);

    if (!record) {
      return JSON.stringify({
        found: false,
        message: `No groundwater data found for "${locationName}"`,
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
    description:
      "Search for a location by name and get its groundwater data directly. Combines location search and data retrieval in one step.",
    schema: z.object({
      locationName: z
        .string()
        .describe("The name of the location (state, district, or taluk)"),
      locationType: z
        .enum(["state", "district", "taluk"])
        .optional()
        .describe("Type of location if known"),
    }),
  }
);

export const compareLocationsTool = tool(
  async ({ locationIds }) => {
    const records = await compareLocations(locationIds);

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
    description:
      "Compare groundwater data across multiple locations. Provide location IDs obtained from find_location.",
    schema: z.object({
      locationIds: z
        .array(z.string())
        .describe("Array of location IDs to compare"),
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
    description:
      "Get top locations ranked by a specific metric like rainfall, extraction rate, recharge, etc.",
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
        .describe("The metric to rank by"),
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe("Type of locations to rank"),
      order: z
        .enum(["asc", "desc"])
        .default("desc")
        .describe("Sort order - desc for highest first, asc for lowest first"),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Number of results to return"),
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
    description:
      "Get a summary of how many locations fall into each category (safe, semi-critical, critical, over-exploited, etc.) and aggregate statistics.",
    schema: z.object({
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe("Type of locations to summarize"),
    }),
  }
);

export const listLocationsTool = tool(
  async ({ locationType, parentId }) => {
    let locations;

    if (locationType === "state") {
      locations = getAllStates();
    } else if (locationType === "district" && parentId) {
      locations = getDistrictsOfState(parentId);
    } else if (locationType === "taluk" && parentId) {
      locations = getTaluksOfDistrict(parentId);
    } else {
      return JSON.stringify({
        found: false,
        message:
          "For districts, provide a state ID. For taluks, provide a district ID.",
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
    description:
      "List all locations of a specific type. For districts, provide the parent state ID. For taluks, provide the parent district ID.",
    schema: z.object({
      locationType: z
        .enum(["state", "district", "taluk"])
        .describe("Type of locations to list"),
      parentId: z
        .string()
        .optional()
        .describe("Parent location ID (required for districts and taluks)"),
    }),
  }
);

export const getLocationDetailsTool = tool(
  async ({ locationId, includeChildren }) => {
    if (includeChildren) {
      const { parent, children } = await getLocationWithChildren(locationId);
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

    const record = await getGroundwaterDataByLocationId(locationId);
    if (!record) {
      return JSON.stringify({ found: false, message: "Location not found" });
    }

    return JSON.stringify({
      found: true,
      textSummary: formatGroundwaterDataForLLM(record),
      charts: generateChartData(record),
    });
  },
  {
    name: "get_location_details",
    description:
      "Get detailed groundwater information for a location, optionally including its child locations (districts for a state, taluks for a district).",
    schema: z.object({
      locationId: z.string().describe("The location ID"),
      includeChildren: z
        .boolean()
        .default(false)
        .describe(
          "Whether to include child locations (districts for state, taluks for district)"
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
  findLocationTool,
  getGroundwaterDataTool,
  searchGroundwaterDataTool,
  compareLocationsTool,
  getTopLocationsTool,
  getCategorySummaryTool,
  listLocationsTool,
  getLocationDetailsTool,
];
