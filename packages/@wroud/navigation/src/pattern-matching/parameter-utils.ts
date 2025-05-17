import type { RouteParams } from "../IRouteMatcher.js";
import {
  isParameterSegment,
  isWildcardSegment,
  extractParamName,
} from "./path-utils.js";

/**
 * Validates that all required parameters are present in the params object.
 * Throws descriptive errors for missing or invalid parameters.
 */
export function validateParameters(
  pattern: string,
  segments: string[],
  params: RouteParams,
): void {
  // Filter out empty segments and process only parameter segments
  segments
    .filter((segment) => segment && isParameterSegment(segment))
    .forEach((segment) => {
      const paramName = extractParamName(segment);
      const value = params[paramName];
      const isWildcard = isWildcardSegment(segment);

      const isMissing = value === undefined || value === null || value === "";

      if (isMissing || (!isWildcard && Array.isArray(value))) {
        if (isWildcard) {
          throw new Error(`Missing required wildcard parameter: ${paramName}`);
        } else {
          throw new Error(
            `Missing or invalid required parameter: ${paramName}`,
          );
        }
      }
    });
}

/**
 * Builds URL segments from a pattern and parameters
 */
export function buildUrlSegments(
  segments: string[],
  params: RouteParams,
): string[] {
  return segments.reduce<string[]>((result, segment) => {
    // Skip empty segments
    if (!segment) return result;

    // Handle parameter segments
    if (isParameterSegment(segment)) {
      const paramName = extractParamName(segment);
      const value = params[paramName];

      // Handle wildcard parameters (arrays)
      if (isWildcardSegment(segment) && Array.isArray(value)) {
        // Filter out undefined values and add valid items as strings
        return [
          ...result,
          ...value
            .filter((item) => item !== undefined)
            .map((item) => String(item)),
        ];
      }

      // Simplify handling of single value parameters
      if (value !== undefined) {
        result.push(String(value));
      }
    } else {
      // Static segment
      result.push(segment);
    }

    return result;
  }, []);
}
