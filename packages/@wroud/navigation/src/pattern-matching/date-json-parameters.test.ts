import { describe, test, expect, beforeEach } from "vitest";
import { TriePatternMatching } from "./TriePatternMatching.js";
import type { ExtractRouteParams } from "./types.js";

describe("Date and JSON Parameter Support", () => {
  let patternMatcher: TriePatternMatching;

  beforeEach(() => {
    patternMatcher = new TriePatternMatching({ trailingSlash: false });
  });

  describe("Date parameter types", () => {
    test("should encode and decode Date parameters", () => {
      const pattern = "/events/:date<date>";
      const testDate = new Date("2024-01-15T10:30:00.000Z");

      patternMatcher.addPattern(pattern);

      // Test encoding Date to URL
      const url = patternMatcher.encode(pattern, { date: testDate });
      expect(url).toBe("/events/2024-01-15T10:30:00.000Z");

      // Test decoding URL back to Date
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded).not.toBeNull();
      expect(decoded!.date).toBeInstanceOf(Date);
      expect(decoded!.date.getTime()).toBe(testDate.getTime());
    });

    test("should handle Date parameters in wildcard arrays", () => {
      const pattern = "/schedule/:dates<date>*";
      const testDates = [
        new Date("2024-01-15T10:30:00.000Z"),
        new Date("2024-02-20T14:45:00.000Z"),
        new Date("2024-03-10T09:15:00.000Z"),
      ];

      patternMatcher.addPattern(pattern);

      // Test encoding Date array to URL
      const url = patternMatcher.encode(pattern, { dates: testDates });
      expect(url).toBe(
        "/schedule/2024-01-15T10:30:00.000Z/2024-02-20T14:45:00.000Z/2024-03-10T09:15:00.000Z",
      );

      // Test decoding URL back to Date array
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded).not.toBeNull();
      expect(Array.isArray(decoded!.dates)).toBe(true);
      const decodedDates = decoded!.dates;
      expect(decodedDates).toHaveLength(3);

      decodedDates.forEach((date, index) => {
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(testDates[index]!.getTime());
      });
    });

    test("should handle invalid Date strings", () => {
      const pattern = "/events/:date<date>";
      patternMatcher.addPattern(pattern);

      // Should throw error for invalid date string
      expect(() => {
        patternMatcher.decode(pattern, "/events/invalid-date-string");
      }).toThrow(/Invalid date/);
    });

    test("should validate Date parameter types during encoding", () => {
      const pattern = "/events/:date<date>";
      patternMatcher.addPattern(pattern);

      // Should throw error when trying to encode non-Date value
      expect(() => {
        patternMatcher.encode(pattern, { date: "not-a-date" as any });
      }).toThrow(/not of type 'date'/);
    });
  });

  describe("JSON parameter types", () => {
    test("should encode and decode JSON object parameters", () => {
      const pattern = "/api/:config<json>";
      const testConfig = {
        enabled: true,
        timeout: 5000,
        endpoints: ["api1", "api2"],
        metadata: { version: "1.0", author: "test" },
      };

      patternMatcher.addPattern(pattern);

      // Test encoding JSON object to URL
      const url = patternMatcher.encode(pattern, { config: testConfig });
      expect(url).toBe(`/api/${JSON.stringify(testConfig)}`);

      // Test decoding URL back to JSON object
      const decodedUrl = `/api/${JSON.stringify(testConfig)}`;
      const decoded = patternMatcher.decode(pattern, decodedUrl);
      expect(decoded).not.toBeNull();
      expect(decoded!.config).toEqual(testConfig);
    });

    test("should handle JSON parameters in wildcard arrays", () => {
      const pattern = "/configs/:settings<json>*";
      const testSettings = [
        { theme: "dark", fontSize: 14 },
        { lang: "en", region: "US" },
        { debug: true, level: "info" },
      ];

      patternMatcher.addPattern(pattern);

      // Test encoding JSON array to URL
      const url = patternMatcher.encode(pattern, { settings: testSettings });
      const expectedSegments = testSettings
        .map((s) => JSON.stringify(s))
        .join("/");
      expect(url).toBe(`/configs/${expectedSegments}`);

      // Test decoding URL back to JSON array
      const decodedUrl = `/configs/${testSettings.map((s) => JSON.stringify(s)).join("/")}`;
      const decoded = patternMatcher.decode(pattern, decodedUrl);
      expect(decoded).not.toBeNull();
      expect(Array.isArray(decoded!.settings)).toBe(true);
      expect(decoded!.settings).toEqual(testSettings);
    });

    test("should handle invalid JSON strings", () => {
      const pattern = "/api/:config<json>";
      patternMatcher.addPattern(pattern);

      // Should throw error for invalid JSON string
      expect(() => {
        patternMatcher.decode(pattern, "/api/invalid-json-{");
      }).toThrow(/Invalid JSON/);
    });

    test("should validate JSON parameter types during encoding", () => {
      const pattern = "/api/:config<json>";
      patternMatcher.addPattern(pattern);

      // Should throw error when trying to encode non-object value
      expect(() => {
        patternMatcher.encode(pattern, { config: "not-an-object" as any });
      }).toThrow(/not of type 'json'/);

      // Should throw error for Date objects (they should use date type)
      expect(() => {
        patternMatcher.encode(pattern, { config: new Date() });
      }).toThrow(/not of type 'json'/);

      // Should throw error for null values
      expect(() => {
        patternMatcher.encode(pattern, { config: null as any });
      }).toThrow(/not of type 'json'/);
    });
  });

  describe("Mixed Date and JSON parameters", () => {
    test("should handle routes with both Date and JSON parameters", () => {
      const pattern = "/events/:date<date>/config/:settings<json>";
      const testDate = new Date("2024-01-15T10:30:00.000Z");
      const testSettings = { notifications: true, reminders: ["email", "sms"] };

      patternMatcher.addPattern(pattern);

      // Test encoding
      const url = patternMatcher.encode(pattern, {
        date: testDate,
        settings: testSettings,
      });
      expect(url).toBe(
        `/events/${testDate.toISOString()}/config/${JSON.stringify(testSettings)}`,
      );

      // Test decoding
      const decodedUrl = `/events/${testDate.toISOString()}/config/${JSON.stringify(testSettings)}`;
      const decoded = patternMatcher.decode(pattern, decodedUrl);
      expect(decoded).not.toBeNull();
      expect(decoded!.date).toBeInstanceOf(Date);
      expect(decoded!.date.getTime()).toBe(testDate.getTime());
      expect(decoded!.settings).toEqual(testSettings);
    });

    test("should handle complex nested objects with dates", () => {
      const pattern = "/reports/:metadata<json>";
      const testMetadata = {
        title: "Annual Report",
        authors: ["John Doe", "Jane Smith"],
        createdAt: "2024-01-15T10:30:00.000Z", // Note: stored as string in JSON
        config: {
          format: "pdf",
          pages: 120,
          sections: ["intro", "data", "conclusion"],
        },
      };

      patternMatcher.addPattern(pattern);

      // Test round-trip
      const url = patternMatcher.encode(pattern, { metadata: testMetadata });
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded).not.toBeNull();
      expect(decoded!.metadata).toEqual(testMetadata);
    });
  });

  describe("Type safety with template literal types", () => {
    test("should infer correct types for Date parameters", () => {
      // Type inference test
      type DateParams = ExtractRouteParams<"/events/:date<date>">;

      // Should infer: { date: Date }
      const dateParams: DateParams = { date: new Date() };
      expect(dateParams.date).toBeInstanceOf(Date);
    });

    test("should infer correct types for JSON parameters", () => {
      // Type inference test
      type JsonParams = ExtractRouteParams<"/api/:config<json>">;

      // Should infer: { config: object }
      const jsonParams: JsonParams = { config: { key: "value" } };
      expect(typeof jsonParams.config).toBe("object");
    });

    test("should infer correct types for wildcard Date parameters", () => {
      // Type inference test
      type WildcardDateParams = ExtractRouteParams<"/schedule/:dates<date>*">;

      // Should infer: { dates: Date[] }
      const wildcardParams: WildcardDateParams = {
        dates: [new Date(), new Date()],
      };
      expect(Array.isArray(wildcardParams.dates)).toBe(true);
      wildcardParams.dates.forEach((date) => {
        expect(date).toBeInstanceOf(Date);
      });
    });
  });

  describe("Edge cases", () => {
    test("should handle empty objects", () => {
      const pattern = "/api/:config<json>";
      patternMatcher.addPattern(pattern);

      const emptyObj = {};
      const url = patternMatcher.encode(pattern, { config: emptyObj });
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded!.config).toEqual(emptyObj);
    });

    test("should handle nested arrays and objects", () => {
      const pattern = "/data/:payload<json>";
      const complexPayload = {
        users: [
          { id: 1, name: "Alice", roles: ["admin", "user"] },
          { id: 2, name: "Bob", roles: ["user"] },
        ],
        metadata: {
          total: 2,
          filters: { active: true, department: "IT" },
          timestamps: ["2024-01-01", "2024-01-02"],
        },
      };

      patternMatcher.addPattern(pattern);

      const url = patternMatcher.encode(pattern, { payload: complexPayload });
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded!.payload).toEqual(complexPayload);
    });

    test("should handle Date epoch boundaries", () => {
      const pattern = "/time/:timestamp<date>";
      patternMatcher.addPattern(pattern);

      // Test Unix epoch
      const epochDate = new Date(0);
      const url = patternMatcher.encode(pattern, { timestamp: epochDate });
      const decoded = patternMatcher.decode(pattern, url);
      expect(decoded!.timestamp.getTime()).toBe(0);

      // Test far future date
      const futureDate = new Date("2099-12-31T23:59:59.999Z");
      const url2 = patternMatcher.encode(pattern, { timestamp: futureDate });
      const decoded2 = patternMatcher.decode(pattern, url2);
      expect(decoded2!.timestamp.getTime()).toBe(futureDate.getTime());
    });
  });
});
