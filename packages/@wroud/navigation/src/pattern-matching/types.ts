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

// Split pattern into path and query parts
type PatternPath<S extends string> = S extends `${infer Path}?${string}`
  ? Path
  : S;
type PatternQuery<S extends string> = S extends `${string}?${infer Query}`
  ? Query
  : "";

// Extract query parameter segments from "key=:param<type>&key2=:param2"
type SplitAmpersand<S extends string> = S extends `${infer First}&${infer Rest}`
  ? [First, ...SplitAmpersand<Rest>]
  : S extends ""
    ? []
    : [S];

// Extract the param part from "key=:param<type>"
type QueryParamSegment<S extends string> = S extends `${string}=:${infer Param}`
  ? `:${Param}`
  : never;

type StripWildcard<S extends string> = S extends `${infer R}*` ? R : S;
type StripParam<S extends string> = S extends `:${infer R}` ? R : S;
type StripType<S extends string> = S extends `${infer N}<${string}>${string}`
  ? N
  : S;
type StripRequired<S extends string> = S extends `${infer R}!` ? R : S;
type ExtractName<S extends string> = StripRequired<
  StripType<StripWildcard<StripParam<S>>>
>;
type ExtractType<S extends string> = S extends `${string}<${infer T}>${string}`
  ? T
  : "string";
type IsWildcard<S extends string> = S extends `${string}*` ? true : false;
type ParamInfo<S extends string> = {
  name: ExtractName<S>;
  type: ExtractType<S>;
  wildcard: IsWildcard<S>;
};

type PrimitiveFromType<T extends string> = T extends "number"
  ? number
  : T extends "boolean"
    ? boolean
    : T extends "date"
      ? Date
      : T extends "json"
        ? object
        : string;

type ParamToValue<P extends { type: string; wildcard: boolean }> =
  P["wildcard"] extends true
    ? PrimitiveFromType<P["type"]>[]
    : PrimitiveFromType<P["type"]>;

// Helper to simplify intersected types into a single flat object
type Simplify<T> = { [K in keyof T]: T[K] };

// Distribute ParamInfo over a union of segment strings
type ToParamInfo<S> = S extends string ? ParamInfo<S> : never;

// Path params (always required)
type PathParams<Pattern extends string> = ToParamInfo<
  Extract<Split<TrimSlashes<PatternPath<Pattern>>, "/">[number], `:${string}`>
>;

// Query param segments split by required (!) vs optional
type QuerySegments<Pattern extends string> = QueryParamSegment<
  SplitAmpersand<PatternQuery<Pattern>>[number]
>;
type RequiredQueryParams<Pattern extends string> = ToParamInfo<
  Extract<QuerySegments<Pattern>, `${string}!`>
>;
type OptionalQueryParams<Pattern extends string> = ToParamInfo<
  Exclude<QuerySegments<Pattern>, `${string}!`>
>;

/**
 * Extract route parameters from a pattern string.
 * Path params and query params with `!` suffix are required.
 * Query params without `!` are optional.
 *
 * @template Pattern - The URL pattern to extract parameters from
 * @example
 * type Params = ExtractRouteParams<"/user/:id">; // { id: string }
 * type QueryParams = ExtractRouteParams<"/search?q=:q!&page=:page<number>">; // { q: string; page?: number }
 * type FileParams = ExtractRouteParams<"/files/:path*">; // { path: string[] }
 */
export type ExtractRouteParams<Pattern extends string> = Pattern extends
  | "/"
  | ""
  ? {}
  : Simplify<
      {
        [P in
          | PathParams<Pattern>
          | RequiredQueryParams<Pattern> as P["name"]]: ParamToValue<P>;
      } & {
        [P in OptionalQueryParams<Pattern> as P["name"]]?: ParamToValue<P>;
      }
    >;

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
