/**
 * Path utilities for URL pattern matching
 */

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
  if (isWildcardSegment(segment)) {
    return segment.slice(1, -1); // Remove ":" and "*"
  }
  return segment.slice(1); // Remove ":"
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
