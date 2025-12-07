import Fuse from "fuse.js";
import { db } from "../db/gw-db";
import { locations } from "../db/gw-schema";
import { eq } from "drizzle-orm";

interface LocationRecord {
  id: string;
  externalId: string | null;
  name: string;
  type: "COUNTRY" | "STATE" | "DISTRICT" | "TALUK";
  parentId: string | null;
  year: string;
}

let locationCache: LocationRecord[] = [];
let fuse: Fuse<LocationRecord> | null = null;

export async function initLocationSearch(): Promise<void> {
  console.log("📍 Loading locations for fuzzy search...");
  locationCache = await db.select().from(locations);

  fuse = new Fuse(locationCache, {
    keys: ["name"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
  });

  console.log(`✅ Loaded ${locationCache.length} locations`);
}

export interface SearchResult {
  location: LocationRecord;
  score: number;
}

export function searchLocation(
  query: string,
  type?: "COUNTRY" | "STATE" | "DISTRICT" | "TALUK"
): SearchResult[] {
  if (!fuse) {
    throw new Error(
      "Location search not initialized. Call initLocationSearch first."
    );
  }

  const results = fuse.search(query);

  let filtered = results;
  if (type) {
    filtered = results.filter((r) => r.item.type === type);
  }

  return filtered.slice(0, 5).map((r) => ({
    location: r.item,
    score: 1 - (r.score ?? 0),
  }));
}

export function searchState(query: string): SearchResult[] {
  return searchLocation(query, "STATE");
}

export function searchDistrict(query: string): SearchResult[] {
  return searchLocation(query, "DISTRICT");
}

export function searchTaluk(query: string): SearchResult[] {
  return searchLocation(query, "TALUK");
}

export async function getLocationById(
  id: string
): Promise<LocationRecord | null> {
  const result = await db
    .select()
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getLocationByExternalId(
  externalId: string
): Promise<LocationRecord | null> {
  const result = await db
    .select()
    .from(locations)
    .where(eq(locations.externalId, externalId))
    .limit(1);
  return result[0] ?? null;
}

export async function getChildren(parentId: string): Promise<LocationRecord[]> {
  return db.select().from(locations).where(eq(locations.parentId, parentId));
}

export async function getLocationHierarchy(
  locationId: string
): Promise<LocationRecord[]> {
  const hierarchy: LocationRecord[] = [];
  let currentId: string | null = locationId;

  while (currentId) {
    const location = await getLocationById(currentId);
    if (!location) break;
    hierarchy.unshift(location);
    currentId = location.parentId;
  }

  return hierarchy;
}

export function getAllStates(): LocationRecord[] {
  return locationCache.filter((l) => l.type === "STATE");
}

export function getAllDistricts(): LocationRecord[] {
  return locationCache.filter((l) => l.type === "DISTRICT");
}

export function getDistrictsOfState(stateId: string): LocationRecord[] {
  return locationCache.filter(
    (l) => l.type === "DISTRICT" && l.parentId === stateId
  );
}

export function getTaluksOfDistrict(districtId: string): LocationRecord[] {
  return locationCache.filter(
    (l) => l.type === "TALUK" && l.parentId === districtId
  );
}
