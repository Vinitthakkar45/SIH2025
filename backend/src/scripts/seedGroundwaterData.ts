import { db } from "../db/gw-db";
import { locations, groundwaterData } from "../db/gw-schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://ingres.iith.ac.in/api";
const YEAR = "2024-2025";
const INDIA_UUID = "ffce954d-24e1-494b-ba7e-0931d8ad6085";

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

async function fetchJson<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

interface StateInfo {
  id: string;
  state_name: string;
  year: string;
  type: string;
  active: number;
}

interface LocationData {
  locationName: string;
  locationUUID: string;
  area?: {
    recharge_worthy?: {
      totalArea?: number;
      commandArea?: number;
      nonCommandArea?: number;
      poorQualityArea?: number;
    };
    non_recharge_worthy?: { totalArea?: number };
    total?: { totalArea?: number };
  };
  rainfall?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  rechargeData?: {
    rainfall?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    canal?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    surface_irrigation?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    gw_irrigation?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    water_body?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    artificial_structure?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    total?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  loss?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  baseFlow?: {
    total?: { lateral_aquifer?: number; vertcal_aquifer?: number };
    command?: { lateral_aquifer?: number; vertcal_aquifer?: number };
    non_command?: { lateral_aquifer?: number; vertcal_aquifer?: number };
    poor_quality?: { lateral_aquifer?: number; vertcal_aquifer?: number };
  };
  evaporation?: {
    evaporation?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    transpiration?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  currentAvailabilityForAllPurposes?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  totalGWAvailability?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  availabilityForFutureUse?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  draftData?: {
    agriculture?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    domestic?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    industry?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    total?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  stageOfExtraction?: {
    total?: number;
    command?: number;
    non_command?: number;
    poor_quality?: number;
  };
  gwallocation?: {
    domestic?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    industry?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
    total?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  category?: {
    total?: string;
    command?: string;
    non_command?: string;
    poor_quality?: string;
  };
  reportSummary?: Record<string, unknown>;
}

interface MapBlockData {
  locationName: string;
  locationUUID: string;
  locUUID?: string;
  rainfall?: number;
  category?: { total?: string; command?: string; non_command?: string };
  area?: {
    total?: {
      totalArea?: number;
      commandArea?: number;
      nonCommandArea?: number;
    };
  };
  recharge?: {
    total?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  draft?: {
    total?: { total?: number; command?: number; non_command?: number };
  };
  rechargeData?: {
    total?: {
      total?: number;
      command?: number;
      non_command?: number;
      poor_quality?: number;
    };
  };
  draftData?: {
    total?: { total?: number; command?: number; non_command?: number };
  };
}

async function fetchAvailableStates(): Promise<StateInfo[]> {
  console.log("Fetching available states...");
  return fetchJson<StateInfo[]>(`${BASE_URL}/locations/latestversion`, {
    year: "2024",
    view: "admin",
  });
}

async function fetchCountryData(): Promise<LocationData[]> {
  console.log("Fetching country level data (all states)...");
  return fetchJson<LocationData[]>(
    `${BASE_URL}/gec/getBusinessDataForUserOpen`,
    {
      parentLocName: "INDIA",
      locname: "INDIA",
      loctype: "COUNTRY",
      view: "admin",
      locuuid: INDIA_UUID,
      year: YEAR,
      computationType: "normal",
      component: "recharge",
      period: "annual",
      category: "safe",
      mapOnClickParams: "false",
      verificationStatus: 1,
      approvalLevel: 1,
      parentuuid: INDIA_UUID,
      stateuuid: null,
    }
  );
}

async function fetchStateData(
  stateName: string,
  stateUuid: string
): Promise<LocationData[]> {
  console.log(`Fetching districts for state: ${stateName}`);
  return fetchJson<LocationData[]>(
    `${BASE_URL}/gec/getBusinessDataForUserOpen`,
    {
      parentLocName: "INDIA",
      locname: stateName,
      loctype: "STATE",
      view: "admin",
      locuuid: stateUuid,
      year: YEAR,
      computationType: "normal",
      component: "recharge",
      period: "annual",
      category: "safe",
      mapOnClickParams: "true",
      stateuuid: null,
      verificationStatus: 1,
      approvalLevel: 1,
      parentuuid: INDIA_UUID,
    }
  );
}

async function fetchMapBlockData(
  stateUuids: string[]
): Promise<MapBlockData[]> {
  console.log("Fetching block data for all states...");
  return fetchJson<MapBlockData[]>(`${BASE_URL}/gec/mapBusinessData`, {
    verificationStatus: 1,
    approvalLevel: 1,
    computationType: "normal",
    locuuid: INDIA_UUID,
    parentuuid: INDIA_UUID,
    period: "annual",
    stateuuid: INDIA_UUID,
    view: "admin",
    year: YEAR,
    areaType: "total",
    layerName: "gec:indgec_mandal_all",
    component: "category",
    mapUsage: true,
    stateUUID: stateUuids,
  });
}

function extractGroundwaterData(data: LocationData) {
  return {
    rainfallCommand: data.rainfall?.command ?? null,
    rainfallNonCommand: data.rainfall?.non_command ?? null,
    rainfallPoorQuality: data.rainfall?.poor_quality ?? null,
    rainfallTotal: data.rainfall?.total ?? null,

    categoryCommand: data.category?.command ?? null,
    categoryNonCommand: data.category?.non_command ?? null,
    categoryPoorQuality: data.category?.poor_quality ?? null,
    categoryTotal: data.category?.total ?? null,

    rechargeRainfallCommand: data.rechargeData?.rainfall?.command ?? null,
    rechargeRainfallNonCommand:
      data.rechargeData?.rainfall?.non_command ?? null,
    rechargeRainfallPoorQuality:
      data.rechargeData?.rainfall?.poor_quality ?? null,
    rechargeRainfallTotal: data.rechargeData?.rainfall?.total ?? null,

    rechargeCanalCommand: data.rechargeData?.canal?.command ?? null,
    rechargeCanalNonCommand: data.rechargeData?.canal?.non_command ?? null,
    rechargeCanalPoorQuality: data.rechargeData?.canal?.poor_quality ?? null,
    rechargeCanalTotal: data.rechargeData?.canal?.total ?? null,

    rechargeSurfaceIrrigationCommand:
      data.rechargeData?.surface_irrigation?.command ?? null,
    rechargeSurfaceIrrigationNonCommand:
      data.rechargeData?.surface_irrigation?.non_command ?? null,
    rechargeSurfaceIrrigationPoorQuality:
      data.rechargeData?.surface_irrigation?.poor_quality ?? null,
    rechargeSurfaceIrrigationTotal:
      data.rechargeData?.surface_irrigation?.total ?? null,

    rechargeGwIrrigationCommand:
      data.rechargeData?.gw_irrigation?.command ?? null,
    rechargeGwIrrigationNonCommand:
      data.rechargeData?.gw_irrigation?.non_command ?? null,
    rechargeGwIrrigationPoorQuality:
      data.rechargeData?.gw_irrigation?.poor_quality ?? null,
    rechargeGwIrrigationTotal: data.rechargeData?.gw_irrigation?.total ?? null,

    rechargeWaterBodyCommand: data.rechargeData?.water_body?.command ?? null,
    rechargeWaterBodyNonCommand:
      data.rechargeData?.water_body?.non_command ?? null,
    rechargeWaterBodyPoorQuality:
      data.rechargeData?.water_body?.poor_quality ?? null,
    rechargeWaterBodyTotal: data.rechargeData?.water_body?.total ?? null,

    rechargeArtificialStructureCommand:
      data.rechargeData?.artificial_structure?.command ?? null,
    rechargeArtificialStructureNonCommand:
      data.rechargeData?.artificial_structure?.non_command ?? null,
    rechargeArtificialStructurePoorQuality:
      data.rechargeData?.artificial_structure?.poor_quality ?? null,
    rechargeArtificialStructureTotal:
      data.rechargeData?.artificial_structure?.total ?? null,

    rechargeTotalCommand: data.rechargeData?.total?.command ?? null,
    rechargeTotalNonCommand: data.rechargeData?.total?.non_command ?? null,
    rechargeTotalPoorQuality: data.rechargeData?.total?.poor_quality ?? null,
    rechargeTotalTotal: data.rechargeData?.total?.total ?? null,

    lossCommand: data.loss?.command ?? null,
    lossNonCommand: data.loss?.non_command ?? null,
    lossPoorQuality: data.loss?.poor_quality ?? null,
    lossTotal: data.loss?.total ?? null,

    baseflowLateralCommand: data.baseFlow?.command?.lateral_aquifer ?? null,
    baseflowLateralNonCommand:
      data.baseFlow?.non_command?.lateral_aquifer ?? null,
    baseflowLateralPoorQuality:
      data.baseFlow?.poor_quality?.lateral_aquifer ?? null,
    baseflowLateralTotal: data.baseFlow?.total?.lateral_aquifer ?? null,

    baseflowVerticalCommand: data.baseFlow?.command?.vertcal_aquifer ?? null,
    baseflowVerticalNonCommand:
      data.baseFlow?.non_command?.vertcal_aquifer ?? null,
    baseflowVerticalPoorQuality:
      data.baseFlow?.poor_quality?.vertcal_aquifer ?? null,
    baseflowVerticalTotal: data.baseFlow?.total?.vertcal_aquifer ?? null,

    evaporationCommand: data.evaporation?.evaporation?.command ?? null,
    evaporationNonCommand: data.evaporation?.evaporation?.non_command ?? null,
    evaporationPoorQuality: data.evaporation?.evaporation?.poor_quality ?? null,
    evaporationTotal: data.evaporation?.evaporation?.total ?? null,

    transpirationCommand: data.evaporation?.transpiration?.command ?? null,
    transpirationNonCommand:
      data.evaporation?.transpiration?.non_command ?? null,
    transpirationPoorQuality:
      data.evaporation?.transpiration?.poor_quality ?? null,
    transpirationTotal: data.evaporation?.transpiration?.total ?? null,

    extractableCommand: data.currentAvailabilityForAllPurposes?.command ?? null,
    extractableNonCommand:
      data.currentAvailabilityForAllPurposes?.non_command ?? null,
    extractablePoorQuality:
      data.currentAvailabilityForAllPurposes?.poor_quality ?? null,
    extractableTotal: data.currentAvailabilityForAllPurposes?.total ?? null,

    totalGwAvailabilityCommand: data.totalGWAvailability?.command ?? null,
    totalGwAvailabilityNonCommand:
      data.totalGWAvailability?.non_command ?? null,
    totalGwAvailabilityPoorQuality:
      data.totalGWAvailability?.poor_quality ?? null,
    totalGwAvailabilityTotal: data.totalGWAvailability?.total ?? null,

    availabilityFutureCommand: data.availabilityForFutureUse?.command ?? null,
    availabilityFutureNonCommand:
      data.availabilityForFutureUse?.non_command ?? null,
    availabilityFuturePoorQuality:
      data.availabilityForFutureUse?.poor_quality ?? null,
    availabilityFutureTotal: data.availabilityForFutureUse?.total ?? null,

    draftAgricultureCommand: data.draftData?.agriculture?.command ?? null,
    draftAgricultureNonCommand:
      data.draftData?.agriculture?.non_command ?? null,
    draftAgriculturePoorQuality:
      data.draftData?.agriculture?.poor_quality ?? null,
    draftAgricultureTotal: data.draftData?.agriculture?.total ?? null,

    draftDomesticCommand: data.draftData?.domestic?.command ?? null,
    draftDomesticNonCommand: data.draftData?.domestic?.non_command ?? null,
    draftDomesticPoorQuality: data.draftData?.domestic?.poor_quality ?? null,
    draftDomesticTotal: data.draftData?.domestic?.total ?? null,

    draftIndustryCommand: data.draftData?.industry?.command ?? null,
    draftIndustryNonCommand: data.draftData?.industry?.non_command ?? null,
    draftIndustryPoorQuality: data.draftData?.industry?.poor_quality ?? null,
    draftIndustryTotal: data.draftData?.industry?.total ?? null,

    draftTotalCommand: data.draftData?.total?.command ?? null,
    draftTotalNonCommand: data.draftData?.total?.non_command ?? null,
    draftTotalPoorQuality: data.draftData?.total?.poor_quality ?? null,
    draftTotalTotal: data.draftData?.total?.total ?? null,

    stageOfExtractionCommand: data.stageOfExtraction?.command ?? null,
    stageOfExtractionNonCommand: data.stageOfExtraction?.non_command ?? null,
    stageOfExtractionPoorQuality: data.stageOfExtraction?.poor_quality ?? null,
    stageOfExtractionTotal: data.stageOfExtraction?.total ?? null,

    allocationDomesticCommand: data.gwallocation?.domestic?.command ?? null,
    allocationDomesticNonCommand:
      data.gwallocation?.domestic?.non_command ?? null,
    allocationDomesticPoorQuality:
      data.gwallocation?.domestic?.poor_quality ?? null,
    allocationDomesticTotal: data.gwallocation?.domestic?.total ?? null,

    allocationIndustryCommand: data.gwallocation?.industry?.command ?? null,
    allocationIndustryNonCommand:
      data.gwallocation?.industry?.non_command ?? null,
    allocationIndustryPoorQuality:
      data.gwallocation?.industry?.poor_quality ?? null,
    allocationIndustryTotal: data.gwallocation?.industry?.total ?? null,

    allocationTotalCommand: data.gwallocation?.total?.command ?? null,
    allocationTotalNonCommand: data.gwallocation?.total?.non_command ?? null,
    allocationTotalPoorQuality: data.gwallocation?.total?.poor_quality ?? null,
    allocationTotalTotal: data.gwallocation?.total?.total ?? null,

    areaRechargeWorthyTotal: data.area?.recharge_worthy?.totalArea ?? null,
    areaRechargeWorthyCommand: data.area?.recharge_worthy?.commandArea ?? null,
    areaRechargeWorthyNonCommand:
      data.area?.recharge_worthy?.nonCommandArea ?? null,
    areaRechargeWorthyPoorQuality:
      data.area?.recharge_worthy?.poorQualityArea ?? null,

    areaNonRechargeWorthyTotal:
      data.area?.non_recharge_worthy?.totalArea ?? null,
    areaTotalTotal: data.area?.total?.totalArea ?? null,

    reportSummary: data.reportSummary ?? null,
  };
}

function extractBlockGroundwaterData(data: MapBlockData) {
  const recharge = data.rechargeData ?? data.recharge;
  const draft = data.draftData ?? data.draft;

  return {
    rainfallTotal: data.rainfall ?? null,
    rainfallCommand: null,
    rainfallNonCommand: null,
    rainfallPoorQuality: null,

    categoryCommand: data.category?.command ?? null,
    categoryNonCommand: data.category?.non_command ?? null,
    categoryTotal: data.category?.total ?? null,
    categoryPoorQuality: null,

    rechargeTotalCommand: recharge?.total?.command ?? null,
    rechargeTotalNonCommand: recharge?.total?.non_command ?? null,
    rechargeTotalPoorQuality: recharge?.total?.poor_quality ?? null,
    rechargeTotalTotal: recharge?.total?.total ?? null,

    draftTotalCommand: draft?.total?.command ?? null,
    draftTotalNonCommand: draft?.total?.non_command ?? null,
    draftTotalTotal: draft?.total?.total ?? null,

    areaTotalTotal: data.area?.total?.totalArea ?? null,
    areaRechargeWorthyCommand: data.area?.total?.commandArea ?? null,
    areaRechargeWorthyNonCommand: data.area?.total?.nonCommandArea ?? null,
  };
}

async function clearDatabase() {
  console.log("Clearing existing data...");
  await db.delete(groundwaterData);
  await db.delete(locations);
  console.log("Database cleared.");
}

async function seedDatabase() {
  try {
    await clearDatabase();

    // Create India (Country level)
    console.log("Creating India entry...");
    const [india] = await db
      .insert(locations)
      .values({
        externalId: INDIA_UUID,
        name: "INDIA",
        type: "COUNTRY",
        year: YEAR,
        parentId: null,
      })
      .returning();

    // Fetch available states
    const availableStates = await fetchAvailableStates();
    const stateUuids = availableStates.map((s) => s.id);
    console.log(`Found ${availableStates.length} states`);

    // Fetch country-level data (states with data)
    const statesData = await fetchCountryData();

    // Create a map of state name to UUID
    const stateNameToUuid = new Map<string, string>();
    for (const state of availableStates) {
      stateNameToUuid.set(state.state_name.toUpperCase(), state.id);
    }

    // Insert states and their groundwater data
    const stateIdMap = new Map<string, string>();
    for (const stateData of statesData) {
      if (stateData.locationName === "total") continue;

      const externalId =
        stateData.locationUUID ||
        stateNameToUuid.get(stateData.locationName.toUpperCase());
      if (!externalId) {
        console.log(`Skipping state ${stateData.locationName} - no UUID found`);
        continue;
      }

      console.log(`Inserting state: ${stateData.locationName}`);
      const [stateRecord] = await db
        .insert(locations)
        .values({
          externalId,
          name: stateData.locationName,
          type: "STATE",
          year: YEAR,
          parentId: india.id,
        })
        .returning();

      stateIdMap.set(externalId, stateRecord.id);

      await db.insert(groundwaterData).values({
        locationId: stateRecord.id,
        ...extractGroundwaterData(stateData),
      });
    }

    // Fetch block data for mapping names
    console.log("Fetching block data for name mapping...");
    const blockData = await fetchMapBlockData(stateUuids);
    const blockNameMap = new Map<string, MapBlockData>();
    for (const block of blockData) {
      const uuid = block.locationUUID || block.locUUID;
      if (uuid) {
        blockNameMap.set(uuid, block);
      }
    }
    console.log(`Mapped ${blockNameMap.size} blocks`);

    // For each state, fetch districts
    for (const [stateExternalId, stateDbId] of stateIdMap) {
      const stateName = statesData.find(
        (s) => s.locationUUID === stateExternalId
      )?.locationName;
      if (!stateName) continue;

      try {
        const districtsData = await fetchStateData(stateName, stateExternalId);

        for (const districtData of districtsData) {
          if (districtData.locationName === "total") continue;

          console.log(`  Inserting district: ${districtData.locationName}`);
          const [districtRecord] = await db
            .insert(locations)
            .values({
              externalId: districtData.locationUUID,
              name: districtData.locationName,
              type: "DISTRICT",
              year: YEAR,
              parentId: stateDbId,
            })
            .returning();

          await db.insert(groundwaterData).values({
            locationId: districtRecord.id,
            ...extractGroundwaterData(districtData),
          });

          // Insert taluks from reportSummary
          if (districtData.reportSummary) {
            for (const [talukUuid, talukSummary] of Object.entries(
              districtData.reportSummary
            )) {
              if (talukUuid === "total") continue;

              const talukBlockData = blockNameMap.get(talukUuid);
              if (!talukBlockData) continue;

              console.log(
                `    Inserting taluk: ${talukBlockData.locationName}`
              );
              const [talukRecord] = await db
                .insert(locations)
                .values({
                  externalId: talukUuid,
                  name: talukBlockData.locationName,
                  type: "TALUK",
                  year: YEAR,
                  parentId: districtRecord.id,
                })
                .returning();

              await db.insert(groundwaterData).values({
                locationId: talukRecord.id,
                ...extractBlockGroundwaterData(talukBlockData),
              });
            }
          }
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching districts for ${stateName}:`, error);
      }
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seedDatabase()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
