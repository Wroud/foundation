/**
 * Path utilities for URL pattern matching
 */

/**
 * Splits a string (URL or pattern) into its path part and query part.
 */
export function splitPathAndQuery(value: string): {
  path: string;
  query: string;
  hash: string;
} {
  let hash = "";
  const hIndex = value.indexOf("#");
  if (hIndex !== -1) {
    hash = value.slice(hIndex);
    value = value.slice(0, hIndex);
  }
  const qIndex = value.indexOf("?");
  if (qIndex === -1) {
    return { path: value, query: "", hash };
  }
  return { path: value.slice(0, qIndex), query: value.slice(qIndex + 1), hash };
}

/**
 * Parsed query parameter definition from a pattern.
 */
export interface QueryParamDef {
  /** The URL query key (e.g. "tab") */
  key: string;
  /** The parameter name (e.g. "tab") */
  paramName: string;
  /** The declared type (e.g. "number") */
  paramType: string;
  /** Whether this query parameter is required (marked with !) */
  required: boolean;
}

/**
 * Parse query parameter definitions from a pattern's query string.
 * Format: "key=:param<type>&key2=:param2"
 */
export function parseQueryPatternDefs(queryPattern: string): QueryParamDef[] {
  if (!queryPattern) return [];

  const defs: QueryParamDef[] = [];

  for (const part of queryPattern.split("&")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;

    const key = part.slice(0, eqIndex);
    let valuePart = part.slice(eqIndex + 1);

    if (!valuePart.startsWith(":")) continue;

    // Check for required flag (trailing !)
    const required = valuePart.endsWith("!");
    if (required) {
      valuePart = valuePart.slice(0, -1);
    }

    const paramName = extractParamName(valuePart);
    const paramType = extractParamType(valuePart);
    defs.push({ key, paramName, paramType, required });
  }

  return defs;
}

/**
 * Parse a URL query string into a key-value map.
 * Handles repeated keys by keeping the last value.
 */
export function parseQueryString(query: string): Record<string, string> {
  if (!query) return {};
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Splits a URL or pattern string into segments
 */
export function splitPath(path: string): string[] {
  // Handle root path specially
  if (path === "/" || path === "") {
    return [""];
  }
  // Remove leading/trailing slashes and split
  return path.replace(/^\/|\/$/g, "").split("/");
}

/**
 * Checks if a segment is a parameter (starts with ":")
 */
export function isParameterSegment(segment: string): boolean {
  return segment.startsWith(":");
}

/**
 * Checks if a segment is a wildcard parameter (starts with ":" and ends with "*")
 */
export function isWildcardSegment(segment: string): boolean {
  return segment.startsWith(":") && segment.endsWith("*");
}

/**
 * Extracts parameter name from a parameter segment
 */
export function extractParamName(segment: string): string {
  let name = segment.slice(1); // remove initial ':'
  if (name.endsWith("*")) {
    name = name.slice(0, -1);
  }
  const typeStart = name.indexOf("<");
  if (typeStart !== -1) {
    name = name.slice(0, typeStart);
  }
  return name;
}

export function extractParamType(segment: string): string {
  const startIndex = segment.indexOf("<");
  const endIndex = segment.indexOf(">");

  if (startIndex === -1 || endIndex === -1) {
    return "string";
  }

  return segment.slice(startIndex + 1, endIndex);
}

const pathCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

/**
 * Evicts the oldest entry from a cache if it exceeds the size limit
 */
function evictCacheIfNeeded<K, V>(cache: Map<K, V>): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove the first entry in the iterator
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
}

/**
 * Joins segments into a URL path with caching for common paths
 */
export function joinPath(segments: string[]): string {
  if (segments.length === 0) {
    return "/";
  }

  // For small segment arrays, use a cache key
  if (segments.length <= 5) {
    const cacheKey = segments.join("/");
    const cached = pathCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = "/" + cacheKey;

    // Use the shared cache management function
    evictCacheIfNeeded(pathCache);
    pathCache.set(cacheKey, result);
    return result;
  }

  return "/" + segments.join("/");
}
