/**
 * Null-safe utilities for handling data from DB/tools
 */

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Get a value with a fallback if null/undefined
 */
export function valueOr<T>(value: T | null | undefined, fallback: T): T {
  return isNullish(value) ? fallback : value;
}

/**
 * Safe number formatting
 */
export function formatNumber(value: number | null | undefined, decimals = 2, fallback = "N/A"): string {
  if (isNullish(value) || isNaN(value)) return fallback;
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Safe percentage formatting
 */
export function formatPercent(value: number | null | undefined, decimals = 1, fallback = "N/A"): string {
  if (isNullish(value) || isNaN(value)) return fallback;
  return `${value.toFixed(decimals)}%`;
}

/**
 * Remove null/undefined values from an object
 */
export function removeNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (!isNullish(obj[key])) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Filter out items with null values in specified fields
 */
export function filterNullValues<T extends Record<string, unknown>>(items: T[], requiredFields: (keyof T)[]): T[] {
  return items.filter((item) => requiredFields.every((field) => !isNullish(item[field])));
}

/**
 * Safe access to nested property
 */
export function safeGet<T>(obj: Record<string, unknown> | null | undefined, path: string, fallback: T): T {
  if (isNullish(obj)) return fallback;

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (isNullish(current) || typeof current !== "object") {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return isNullish(current) ? fallback : (current as T);
}

/**
 * Ensure array is not null/undefined
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return isNullish(value) ? [] : value;
}

/**
 * Map with null safety - filters out results that are null
 */
export function safeMap<T, R>(items: T[] | null | undefined, mapper: (item: T, index: number) => R | null | undefined): R[] {
  if (isNullish(items)) return [];
  return items.map(mapper).filter((item): item is R => !isNullish(item));
}
