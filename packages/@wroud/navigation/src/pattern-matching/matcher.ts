import type { RouteParams } from "../IRouteMatcher.js";
import { TrieNode } from "./TrieNode.js";
import { convertParamValue } from "./parameter-utils.js";
import type { ExtendedMatchResult } from "./types.js";

// Default empty match result to use instead of undefined
const emptyMatchResult: ExtendedMatchResult = { matched: false, params: {} };

/**
 * Matches a segment against a static child node
 *
 * @param node Current node in the trie
 * @param segment Current segment to match
 * @param segments All segments array
 * @param index Current index in segments
 * @param params Accumulated parameters
 * @returns Array of match results
 *
 * Converts the current segment to the correct primitive type
 * using the parameter type stored on the trie node.
 */
function matchStaticSegment(
  node: TrieNode,
  segment: string,
  segments: string[],
  index: number,
  params: RouteParams,
): ExtendedMatchResult[] {
  if (!node.hasStaticChild(segment)) return [];

  const childNode = node.getStaticChild(segment);
  if (!childNode) return [];

  const result = matchSegments(childNode, segments, index + 1, params);
  return result.matched ? [result] : [];
}

/**
 * Matches a segment against a parameter node
 *
 * @param node Current node in the trie
 * @param segment Current segment to match
 * @param segments All segments array
 * @param index Current index in segments
 * @param params Accumulated parameters
 * @returns Array of match results
 *
 * Consumes one or more segments and converts them to the
 * declared parameter type stored on the wildcard node.
 */
function matchParameterSegment(
  node: TrieNode,
  segment: string,
  segments: string[],
  index: number,
  params: RouteParams,
): ExtendedMatchResult[] {
  if (!node.paramChild) return [];

  const paramName = node.paramChild.name;
  const paramType = node.paramChild.paramType;
  const value = convertParamValue(segment, paramType);
  const newParams = { ...params, [paramName]: value };
  const result = matchSegments(node.paramChild, segments, index + 1, newParams);

  return result.matched ? [result] : [];
}

/**
 * Matches segments against a wildcard node using an optimized algorithm
 *
 * @param node Current node in the trie
 * @param segments All segments array
 * @param index Current index in segments
 * @param params Accumulated parameters
 * @returns Array of match results
 */
function matchWildcardSegment(
  node: TrieNode,
  segments: string[],
  index: number,
  params: RouteParams,
): ExtendedMatchResult[] {
  if (!node.wildcardChild) return [];

  const paramName = node.wildcardChild.name;
  const paramType = node.wildcardChild.paramType;
  const remainingSegments = segments.length - index;
  if (remainingSegments <= 0) return [];

  const results: ExtendedMatchResult[] = [];

  // Optimization for wildcards at the end of pattern
  if (node.wildcardChild.isEndOfPattern) {
    const validSegments = segments.slice(index).map((s) => convertParamValue(s, paramType));
    if (!validSegments.includes(undefined as any)) {
      results.push({
        matched: true,
        params: { ...params, [paramName]: validSegments },
        pattern: node.wildcardChild.pattern || undefined,
      });
    }
    return results;
  }

  // For wildcards in the middle - try different consumption strategies

  // 1. Non-greedy (minimal) match - just one segment
  const segment = segments[index];
  if (segment !== undefined) {
    const nonGreedyParams = {
      ...params,
      [paramName]: [convertParamValue(segment, paramType)],
    };
    const nonGreedyResult = matchSegments(
      node.wildcardChild,
      segments,
      index + 1,
      nonGreedyParams,
    );

    if (nonGreedyResult.matched) {
      results.push(nonGreedyResult);
    }
  }

  // 2. Greedy match - try consuming multiple segments
  if (remainingSegments > 1) {
    // Start with max segments and work backwards for efficiency
    for (let i = remainingSegments; i > 1; i--) {
      const consumedSegments = segments
        .slice(index, index + i)
        .map((s) => convertParamValue(s, paramType));
      if (consumedSegments.includes(undefined as any)) continue;

      const greedyParams = { ...params, [paramName]: consumedSegments };
      const greedyResult = matchSegments(
        node.wildcardChild,
        segments,
        index + i,
        greedyParams,
      );

      if (greedyResult.matched) {
        results.push(greedyResult);
        break; // Found a match, stop trying other segment counts
      }
    }
  }

  return results;
}

// Cache for pattern type analysis
const patternTypeCache = new Map<
  string,
  { hasParams: boolean; hasWildcard: boolean; staticSegmentCount?: number }
>();

/**
 * Analyzes a pattern and caches its characteristics for faster matching
 * @param pattern The pattern to analyze
 * @returns Pattern characteristics
 */
function getPatternType(pattern: string | undefined) {
  if (!pattern) {
    return { hasParams: false, hasWildcard: false };
  }

  // Return cached result if available
  const cached = patternTypeCache.get(pattern);
  if (cached) return cached;

  // Analyze pattern and cache result
  const result = {
    hasParams: pattern.includes(":"),
    hasWildcard: pattern.includes("*"),
  };

  patternTypeCache.set(pattern, result);
  return result;
}

function getStaticSegmentCount(pattern: string): number {
  // Check if we've already computed this
  const cached = patternTypeCache.get(pattern);
  if (cached?.staticSegmentCount !== undefined) {
    return cached.staticSegmentCount;
  }

  // Count static segments (not starting with ":")
  const count = pattern
    .split("/")
    .filter((s) => s && !s.startsWith(":")).length;

  // Store result in cache
  if (cached) {
    cached.staticSegmentCount = count;
  }

  return count;
}

/**
 * Match a segment array against a trie, starting from the given node
 *
 * This function recursively traverses the trie to find a matching pattern
 * for the given segments.
 *
 * @param node The current node in the trie
 * @param segments The URL segments to match
 * @param index The current segment index
 * @param params The accumulated parameters
 * @returns Match result with parameters and pattern
 */
export function matchSegments(
  node: TrieNode,
  segments: string[],
  index: number,
  params: RouteParams,
): ExtendedMatchResult {
  // End of segments - check if this is a valid pattern end
  if (index === segments.length) {
    return node.isEndOfPattern
      ? { matched: true, params, pattern: node.pattern || undefined }
      : emptyMatchResult;
  }

  const segment = segments[index];

  // Handle empty segments
  if (segment === "") {
    // Special case for root path "/"
    if (index === 0 && node.hasStaticChild("")) {
      const emptyPathNode = node.getStaticChild("");
      if (emptyPathNode) {
        const result = matchSegments(
          emptyPathNode,
          segments,
          index + 1,
          params,
        );
        if (result.matched) return result;
      }
    }
    // Skip other empty segments if not at start
    if (index > 0) return emptyMatchResult;
  }

  // Skip undefined segments
  if (segment === undefined) return emptyMatchResult;

  // Static matches have highest priority
  const staticResults = matchStaticSegment(
    node,
    segment,
    segments,
    index,
    params,
  );
  if (staticResults.length === 1) return staticResults[0]!;

  const paramResults = matchParameterSegment(
    node,
    segment,
    segments,
    index,
    params,
  );

  // Optimization: Skip wildcard matching if we already have results and no wildcard node
  if (
    (staticResults.length > 0 || paramResults.length > 0) &&
    !node.wildcardChild
  ) {
    const results = [...staticResults, ...paramResults];
    if (results.length === 1) return results[0]!;

    const sortedResults = sortMatchResults(results);
    return sortedResults.length > 0 ? sortedResults[0]! : emptyMatchResult;
  }

  const wildcardResults = matchWildcardSegment(node, segments, index, params);
  const allResults = [...staticResults, ...paramResults, ...wildcardResults];

  if (allResults.length === 0) return emptyMatchResult;
  if (allResults.length === 1) return allResults[0]!;

  return sortMatchResults(allResults)[0]!;
}

/**
 * Sort match results by specificity:
 * 1. Static routes
 * 2. Parameter routes with more segments
 * 3. Wildcard routes
 *
 * @param results Array of match results to sort
 * @returns Sorted array of match results
 */
export function sortMatchResults(
  results: ExtendedMatchResult[],
): ExtendedMatchResult[] {
  if (results.length <= 1) return results;

  return results.sort((a, b) => {
    // First, handle cases where one or both patterns might be undefined
    if (a.pattern && !b.pattern) return -1;
    if (!a.pattern && b.pattern) return 1;
    if (!a.pattern || !b.pattern) return 0;

    // Get cached pattern analysis
    const aType = getPatternType(a.pattern);
    const bType = getPatternType(b.pattern);

    // Priority order: static > parameter > wildcard
    // First compare by pattern type
    if (!aType.hasParams && bType.hasParams) return -1; // Static over param
    if (aType.hasParams && !bType.hasParams) return 1; // Param under static

    if (!aType.hasWildcard && bType.hasWildcard) return -1; // Non-wildcard over wildcard
    if (aType.hasWildcard && !bType.hasWildcard) return 1; // Wildcard under non-wildcard

    // If both are the same type, prioritize by number of static segments
    if (aType.hasWildcard && bType.hasWildcard) {
      return (
        getStaticSegmentCount(b.pattern) - getStaticSegmentCount(a.pattern)
      );
    }

    return 0;
  });
}
