import type { RouteParams, RouteParamValue } from "../IRouteMatcher.js";
import {
  isParameterSegment,
  isWildcardSegment,
  extractParamName,
} from "./path-utils.js";

/**
 * Validates that all required parameters are present in the params object.
 * Throws descriptive errors for missing or invalid parameters.
 * Optionally validates parameter types if paramTypes is provided.
 */
export function validateParameters(
  pattern: string,
  segments: string[],
  params: RouteParams,
  paramTypes?: Record<string, string>, // TODO: make it required and remove extra checks
): void {
  // Filter out empty segments and process only parameter segments
  segments
    .filter((segment) => segment && isParameterSegment(segment))
    .forEach((segment) => {
      const paramName = extractParamName(segment);
      const value = params[paramName];
      const isWildcard = isWildcardSegment(segment);

      // Type validation if paramTypes is provided
      if (paramTypes && paramTypes[paramName]) {
        const type = paramTypes[paramName];
        if (isWildcard && Array.isArray(value)) {
          value.forEach((item, idx) => {
            if (!isValidType(item, type)) {
              throw new Error(
                `Parameter '${paramName}' at index ${idx} is not of type '${type}'`,
              );
            }
          });
        } else {
          if (!isValidType(value, type)) {
            throw new Error(
              `Parameter '${paramName}' is not of type '${type}'`,
            );
          }
        }
      } else {
        const isMissing = value === undefined || value === null || value === "";

        if (isMissing || (!isWildcard && Array.isArray(value))) {
          if (isWildcard) {
            throw new Error(
              `Missing required wildcard parameter: ${paramName}`,
            );
          } else {
            throw new Error(
              `Missing or invalid required parameter: ${paramName}`,
            );
          }
        }
      }
    });
}

function isValidType(value: any, type: string): boolean {
  switch (type) {
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return value instanceof Date && !isNaN(value.getTime());
    case "json":
      return (
        typeof value === "object" && value !== null && !(value instanceof Date)
      );
    case "string":
      return typeof value === "string";
    default:
      return true; // Unknown types are considered valid
  }
}

/**
 * Builds URL segments from a pattern and parameters
 */
export function buildUrlSegments(
  segments: string[],
  params: RouteParams,
  paramTypes?: Record<string, string>,
): string[] {
  return segments.reduce<string[]>((result, segment) => {
    // Skip empty segments
    if (!segment) return result;

    // Handle parameter segments
    if (isParameterSegment(segment)) {
      const paramName = extractParamName(segment);
      const value = params[paramName];
      const type = paramTypes?.[paramName];

      // Handle wildcard parameters (arrays)
      if (isWildcardSegment(segment) && Array.isArray(value)) {
        // Filter out undefined values and add valid items as strings
        return [
          ...result,
          ...value
            // TODO: remove undefined filter because it is handled in validateParameters
            .filter((item) => item !== undefined)
            .map((item) => serializeParamValue(item, type)),
        ];
      }

      // TODO: remove undefined filter because it is handled in validateParameters
      // Simplify handling of single value parameters
      if (value !== undefined) {
        result.push(serializeParamValue(value, type));
      }
    } else {
      // Static segment
      result.push(segment);
    }

    return result;
  }, []);
}

function serializeParamValue(value: any, type?: string): string {
  if (type === "date" && value instanceof Date) {
    return value.toISOString();
  }
  if (type === "json" && typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Convert a raw string value according to declared parameter type.
 */
export function convertParamValue(
  value: string,
  type: string,
): RouteParamValue {
  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "true" || value === "1";
    case "date": {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
      return date;
    }
    case "json": {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Invalid JSON: ${value}`);
      }
    }
    default:
      return value;
  }
}
