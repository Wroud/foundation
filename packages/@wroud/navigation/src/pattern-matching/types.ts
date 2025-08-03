/**
 * Types for the Trie-based pattern matching system
 */

import type { RouteParams } from "../IRouteMatcher.js";
import type { IRouteState } from "../IRouteState.js";

/**
 * Extracts parameter names from a pattern string using template literal types
 */

// Helper to split pattern into segments
type Split<
  S extends string,
  D extends string,
> = S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

// Helper to remove leading and trailing slashes from a pattern
type TrimSlashes<S extends string> = S extends `/${infer T}`
  ? T extends `${infer U}/`
    ? TrimSlashes<U>
    : T
  : S extends `${infer U}/`
    ? TrimSlashes<U>
    : S;

// Filter out non-parameter parts and get parameter segments
type GetParameterSegments<Pattern extends string> = Pattern extends "/" | ""
  ? []
  : Extract<Split<TrimSlashes<Pattern>, "/">[number], `:${string}`>;

type StripWildcard<S extends string> = S extends `${infer R}*` ? R : S;
type StripParam<S extends string> = S extends `:${infer R}` ? R : S;
type StripType<S extends string> = S extends `${infer N}<${string}>` ? N : S;
type ExtractName<S extends string> = StripType<StripWildcard<StripParam<S>>>;
type ExtractType<S extends string> = S extends `${string}<${infer T}>${string}`
  ? T
  : "string";
type IsWildcard<S extends string> = S extends `${string}*` ? true : false;
type ParamInfo<S extends string> = {
  name: ExtractName<S>;
  type: ExtractType<S>;
  wildcard: IsWildcard<S>;
};
type ParamInfoUnion<Pattern extends string> =
  GetParameterSegments<Pattern> extends infer S
    ? S extends string
      ? ParamInfo<S>
      : never
    : never;

type PrimitiveFromType<T extends string> = T extends "number"
  ? number
  : T extends "boolean"
    ? boolean
    : T extends "date"
      ? Date
      : T extends "json"
        ? object
        : string;

/**
 * Extract route parameters from a pattern string.
 * Returns a clean object type with parameter names as keys.
 *
 * @template Pattern - The URL pattern to extract parameters from
 * @example
 * type Params = ExtractRouteParams<"/user/:id">; // { id: string }
 * type BlogParams = ExtractRouteParams<"/blog/:year/:month/:slug">; // { year: string, month: string, slug: string }
 * type FileParams = ExtractRouteParams<"/files/:path*">; // { path: string[] }
 */
export type ExtractRouteParams<Pattern extends string> = Pattern extends
  | "/"
  | ""
  ? {}
  : {
      [P in ParamInfoUnion<Pattern> as P["name"]]: P["wildcard"] extends true
        ? PrimitiveFromType<P["type"]>[]
        : PrimitiveFromType<P["type"]>;
    };

/**
 * Type-safe TriePatternMatching methods
 */

// Interface that provides type safety for pattern matching operations
export interface TypedPatternMatcher {
  /**
   * Decode URL parameters based on a pattern
   */
  decode<Pattern extends string>(
    pattern: Pattern,
    url: string,
  ): ExtractRouteParams<Pattern> | null;

  /**
   * Encode parameters into a URL based on a pattern
   */
  encode<Pattern extends string>(
    pattern: Pattern,
    params: ExtractRouteParams<Pattern>,
  ): string;

  /**
   * Match a URL against the patterns in the trie
   */
  match<Pattern extends string>(
    url: string,
  ): IPatternRouteState<Pattern> | null;
}

export interface IPatternRouteState<Pattern extends string>
  extends IRouteState {
  id: Pattern;
  params: ExtractRouteParams<this["id"]>;
}

/**
 * Types of nodes in the trie structure
 * - static: regular path segment that matches exactly (e.g., "user", "posts")
 * - param: named parameter segment (e.g., ":id", ":action")
 * - wildcard: captures multiple segments (e.g., ":path*")
 */
export type NodeType = "static" | "param" | "wildcard";

/**
 * Result of a matching operation
 */
export interface MatchResult {
  matched: boolean;
  params: RouteParams;
}

/**
 * Extended match result with the matched pattern
 */
export interface ExtendedMatchResult extends MatchResult {
  pattern?: string;
}
