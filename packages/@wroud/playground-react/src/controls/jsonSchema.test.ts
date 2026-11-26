import { describe, expect, test } from "vitest";
import { z } from "zod";
import type { IStory } from "../IStory.js";
import type { IJsonSchema } from "./IJsonSchema.js";
import {
  getInitialStoryProps,
  getInitialStoryValues,
  getInitialValue,
  getSchemaOptions,
  getStoryJsonSchema,
  resolveStoryProps,
  unwrapNullable,
  formatStoryIssues,
} from "./jsonSchema.js";

function createStory(props?: IStory["options"]["props"]): IStory {
  return {
    id: "/story",
    name: "story",
    describe: { id: "/", name: "" } as IStory["describe"],
    component: () => null,
    options: { props },
  };
}

describe("jsonSchema", () => {
  test("has no initial values without a schema", () => {
    expect(getInitialStoryValues(createStory())).toEqual({});
  });

  test("returns the conversion error for unrepresentable schemas", () => {
    const schema = z.object({ onClick: z.function(), at: z.date() });

    expect(getStoryJsonSchema(schema)).toBeInstanceOf(Error);
    expect(getInitialStoryValues(createStory(schema))).toEqual({});
  });

  test("converts and caches the json schema", () => {
    const schema = z.object({ label: z.string() });
    const jsonSchema = getStoryJsonSchema(schema);

    expect(jsonSchema).toMatchObject({
      type: "object",
      properties: { label: { type: "string" } },
      required: ["label"],
    });
    expect(getStoryJsonSchema(schema)).toBe(jsonSchema);
  });

  test("builds initial values from defaults and types", () => {
    const schema = z.object({
      label: z.string().default("Click me"),
      variant: z.enum(["primary", "ghost"]),
      kind: z.union([z.literal("a"), z.literal("b")]),
      size: z.number().min(8).max(48),
      count: z.int(),
      negative: z.number().max(-5),
      disabled: z.boolean(),
      hidden: z.boolean().optional(),
      nested: z.object({ x: z.number(), y: z.string().optional() }),
      tags: z.array(z.string()),
      nullable: z.string().nullable(),
    });

    expect(getInitialStoryValues(createStory(schema))).toEqual({
      label: "Click me",
      variant: "primary",
      kind: "a",
      size: 8,
      count: 0,
      negative: -5,
      disabled: false,
      nested: { x: 0 },
      tags: [],
      nullable: null,
    });
  });

  test("skips optional values without defaults", () => {
    expect(getInitialValue({ type: "string" }, false)).toBeUndefined();
    expect(getInitialValue({ type: "string", default: "a" }, false)).toBe("a");
  });

  test("reads options from enums and const unions", () => {
    expect(getSchemaOptions({ enum: [1, 2] })).toEqual([1, 2]);
    expect(
      getSchemaOptions({ anyOf: [{ const: "a" }, { const: "b" }] }),
    ).toEqual(["a", "b"]);
    expect(
      getSchemaOptions({ anyOf: [{ const: "a" }, { type: "string" }] }),
    ).toBeNull();
  });

  test("initial props are the validated output", () => {
    const schema = z.object({
      size: z.number().transform((value) => `${value}px`),
    });

    expect(getInitialStoryProps(createStory(schema))).toEqual({ size: "0px" });
  });

  test("initial props fall back to raw values when invalid", () => {
    const schema = z.object({ label: z.string().min(3) });

    expect(getInitialStoryProps(createStory(schema))).toEqual({ label: "" });
  });

  test("resolves validation errors into issues", async () => {
    const throwing = z.object({
      data: z.string().transform((value) => JSON.parse(value)),
    });

    await expect(
      Promise.resolve(resolveStoryProps(throwing, { data: "{" })),
    ).resolves.toMatchObject({ issues: [{ message: expect.any(String) }] });
    expect(resolveStoryProps(throwing, { data: "{}" })).toEqual({
      value: { data: {} },
    });
  });

  test("unwraps nullable variants", () => {
    const schema = getStoryJsonSchema(
      z.object({ variant: z.enum(["a", "b"]).nullable().describe("Variant") }),
    );
    const property = (schema as IJsonSchema).properties!["variant"]!;

    expect(unwrapNullable(property)).toEqual({
      schema: { type: "string", enum: ["a", "b"], description: "Variant" },
      type: "string",
      nullable: true,
    });
    expect(unwrapNullable({ type: "string" })).toEqual({
      schema: { type: "string" },
      type: "string",
      nullable: false,
    });
  });

  test("formats issues with dotted paths", () => {
    expect(
      formatStoryIssues([
        { message: "a", path: ["tags", 0] },
        { message: "b", path: [{ key: "nested" }, "x"] },
        { message: "c" },
      ]),
    ).toEqual([
      { path: "tags.0", message: "a" },
      { path: "nested.x", message: "b" },
      { path: "", message: "c" },
    ]);
  });
});
