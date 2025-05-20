import { TrieNode } from "./TrieNode.js";
import { matchSegments } from "./matcher.js";
import {
  extractParamName,
  extractParamType,
  isParameterSegment,
  isWildcardSegment,
  joinPath,
  splitPath,
} from "./path-utils.js";
import {
  buildUrlSegments,
  validateParameters,
} from "./parameter-utils.js";
import type {
  TypedPatternMatcher,
  ExtractRouteParams,
  IPatternRouteState,
} from "./types.js";
import type { IRouteMatcher, RouteParams } from "../IRouteMatcher.js";

export interface ITriePatternMatchingOptions {
  trailingSlash?: boolean;
  base?: string;
}

/**
 * Trie-based implementation for URL pattern matching.
 * Supports static segments, parameter segments (:param), and wildcard segments (:param*).
 */
export class TriePatternMatching implements TypedPatternMatcher, IRouteMatcher {
  private root: TrieNode;
  private patterns: Set<string>;
  // Direct mapping from patterns to nodes for fast access
  private patternToNode: Map<string, TrieNode>;
  // Cache for frequently decoded URLs
  private decodeCache: Map<string, Map<string, RouteParams | null>>;
  // Cache for frequently encoded patterns
  private encodeCache: Map<string, Map<string, string>>;
  // Maximum cache size to prevent memory leaks
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly options: ITriePatternMatchingOptions;
  constructor(options: ITriePatternMatchingOptions = {}) {
    this.root = new TrieNode();
    this.patterns = new Set();
    this.patternToNode = new Map();
    this.decodeCache = new Map();
    this.encodeCache = new Map();
    this.options = {
      trailingSlash: true,
      ...options,
    };
  }

  /**
   * Add a pattern to the trie (e.g., "/user/:id<number>")
   *
   * Parameter nodes store declared type information which
   * is later used to convert matched values.
   */
  addPattern(pattern: string): void {
    if (this.patterns.has(pattern)) return;

    this.patterns.add(pattern);
    const segments = splitPath(pattern);
    let current = this.root;

    for (const segment of segments) {
      if (!segment) {
        // Handle root path
        if (pattern === "/" && current === this.root) {
          current = current.addStaticChild("");
        }
        continue;
      }

      if (isParameterSegment(segment)) {
        const paramName = extractParamName(segment);
        const paramType = extractParamType(segment);
        current = isWildcardSegment(segment)
          ? current.getOrCreateWildcardChild(paramName, paramType)
          : current.getOrCreateParamChild(paramName, paramType);
      } else {
        current = current.addStaticChild(segment);
      }
    }

    current.markAsPatternEnd(pattern);
    // Store direct reference to the node
    this.patternToNode.set(pattern, current);
    this.clearCaches();
  }

  /**
   * Type guard to check if a route state matches a specific route ID
   */
  isRoute<Pattern extends string>(
    state: IPatternRouteState<any> | null,
    id: Pattern,
  ): state is IPatternRouteState<Pattern> {
    if (!state) return false;
    return state.id === id;
  }

  /**
   * Match a URL against the patterns in the trie
   */
  match<Pattern extends string>(
    url: string,
  ): IPatternRouteState<Pattern> | null {
    const segments = splitPath(this.removeBaseFromUrl(url));
    const { matched, pattern, params } = matchSegments(
      this.root,
      segments,
      0,
      {},
    );

    if (!matched || !pattern) return null;

    return {
      id: pattern as Pattern,
      params: params as ExtractRouteParams<Pattern>,
    };
  }

  /**
   * Decode URL parameters based on a pattern
   */
  decode<Pattern extends string>(
    pattern: Pattern,
    url: string,
  ): ExtractRouteParams<Pattern> | null {
    url = this.addBaseToUrl(url);
    // Check cache first
    const cached = this.decodeCache.get(pattern)?.get(url) as
      | ExtractRouteParams<Pattern>
      | null
      | undefined;
    if (cached !== undefined) return cached;

    // Register pattern if needed
    if (!this.patterns.has(pattern)) {
      this.addPattern(pattern);
    }

    // Match URL against pattern
    const matchResult = this.match<Pattern>(url);
    const result =
      !matchResult || matchResult.id !== pattern ? null : matchResult.params;

    // Update cache
    this.updateCache(this.decodeCache, pattern, url, result);
    return result;
  }

  /**
   * Encode parameters into a URL based on a pattern
   */
  encode<Pattern extends string>(
    pattern: Pattern,
    params: ExtractRouteParams<Pattern>,
  ): string {
    // Special case for root path
    if (pattern === "/") {
      return "/";
    }

    const paramsKey = JSON.stringify(params);

    // Check cache
    const patternCache = this.encodeCache.get(pattern);
    const cached = patternCache?.get(paramsKey);

    // Only proceed with encoding if the cached value is undefined
    // (not null or empty string, which are valid cached results)
    if (cached !== undefined) return cached;

    const segments = splitPath(pattern);
    validateParameters(pattern, segments, params as RouteParams);

    const resultSegments = buildUrlSegments(segments, params as RouteParams);
    let result = this.addBaseToUrl(joinPath(resultSegments));

    if (!this.options.trailingSlash) {
      result = result.replace(/\/$/, "");
    } else if (!result.endsWith("/")) {
      result += "/";
    }

    // Update cache
    this.updateCache(this.encodeCache, pattern, paramsKey, result);
    return result;
  }

  /**
   * Explicitly clear all caches
   */
  clearCaches(): void {
    this.decodeCache.clear();
    this.encodeCache.clear();
  }

  /**
   * Get all registered patterns
   */
  getPatterns(): string[] {
    return [...this.patterns];
  }

  /**
   * Get potential parent patterns for a given pattern
   */
  getPatternAncestors(pattern: string): string[] {
    if (pattern === "/") {
      return []; // Root has no parents
    }

    // Get the node for this pattern - direct lookup from map
    const node = this.patternToNode.get(pattern);
    if (!node) return [];

    // Use the node's findAncestorPatterns method to get ancestors
    return node.findAncestorPatterns();
  }

  /**
   * Find all patterns that could be considered child patterns of the given pattern
   */
  getPatternDescendants(pattern: string): string[] {
    // Get the node for this pattern - direct lookup from map
    const node = this.patternToNode.get(pattern);
    if (!node) return [];

    // Collect all patterns that end in nodes below this one
    return this.collectDescendantPatterns(node);
  }

  /**
   * Collect all patterns that end in nodes below a given node
   */
  private collectDescendantPatterns(node: TrieNode): string[] {
    const patterns: string[] = [];

    const traverse = (current: TrieNode) => {
      // If this node has a pattern and it's not the starting node's pattern,
      // add it to the results
      if (current !== node && current.isEndOfPattern && current.pattern) {
        patterns.push(current.pattern);
      }

      // Traverse all children
      for (const [_, child] of current.children) {
        traverse(child);
      }

      // Check parameter children
      if (current.paramChild) {
        traverse(current.paramChild);
      }

      // Check wildcard children
      if (current.wildcardChild) {
        traverse(current.wildcardChild);
      }
    };

    // Start DFS traversal from the node
    traverse(node);

    return patterns;
  }

  /**
   * Update a cache with a new result
   */
  private updateCache<K, V>(
    cache: Map<string, Map<K, V>>,
    pattern: string,
    key: K,
    value: V,
  ): void {
    const cacheMap = this.ensureCacheMap(cache, pattern);
    this.evictCacheIfNeeded(cacheMap);
    cacheMap.set(key, value);
  }

  /**
   * Ensure a cache map exists for the given key, evicting the oldest entry if needed
   */
  private ensureCacheMap<K, V>(
    cache: Map<string, Map<K, V>>,
    key: string,
  ): Map<K, V> {
    if (!cache.has(key)) {
      // Check if we need to evict the oldest entry due to cache size
      this.evictCacheIfNeeded(cache);
      cache.set(key, new Map());
    }
    return cache.get(key)!;
  }

  /**
   * Helper method to evict oldest cache entry if size limit is reached
   */
  private evictCacheIfNeeded<K, V>(cache: Map<K, V>): void {
    if (cache.size >= this.MAX_CACHE_SIZE) {
      const iterator = cache.keys().next();
      if (iterator.value !== undefined) {
        cache.delete(iterator.value);
      }
    }
  }

  /**
   * Remove a pattern from the trie
   */
  removePattern(pattern: string): void {
    if (!this.patterns.has(pattern)) {
      return;
    }

    // Get the node for this pattern
    const node = this.patternToNode.get(pattern);
    if (node) {
      // Just unmark it as a pattern end
      node.isEndOfPattern = false;
      node.pattern = null;
    }

    // Remove from maps and sets
    this.patterns.delete(pattern);
    this.patternToNode.delete(pattern);
    this.clearCaches();
  }

  /**
   * Convert a URL to a route state
   */
  urlToState<Pattern extends string>(
    url: string,
  ): IPatternRouteState<Pattern> | null {
    return this.match(url);
  }

  /**
   * Convert a route state to a URL
   */
  stateToUrl<Pattern extends string>(
    state: IPatternRouteState<Pattern>,
  ): string | null {
    if (!this.patterns.has(state.id)) return null;
    // Simplified - encode() already handles validation and will return proper results
    return this.encode(state.id, state.params);
  }

  /**
   * Remove base path from URL if present
   */
  private removeBaseFromUrl(url: string): string {
    if (this.options.base && url.startsWith(this.options.base)) {
      return url.replace(this.options.base, "");
    }
    return url;
  }

  /**
   * Add base path to URL if configured
   */
  private addBaseToUrl(url: string): string {
    if (this.options.base && url.startsWith("/")) {
      if (this.options.base.endsWith("/")) {
        return this.options.base + url.replace(/^\//, "");
      }
      return this.options.base + url;
    }
    return url;
  }
}
