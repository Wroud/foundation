import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { IStory, StoryPropsSchema } from "../IStory.js";
import type { IJsonSchema, JsonSchemaType } from "./IJsonSchema.js";
import type { IStoryPropsIssue } from "./topics.js";

export type StoryPropsResult = StandardSchemaV1.Result<Record<string, unknown>>;

const jsonSchemaCache = new WeakMap<StoryPropsSchema, IJsonSchema | Error>();

export function getStoryJsonSchema(
  schema: StoryPropsSchema,
): IJsonSchema | Error {
  let jsonSchema = jsonSchemaCache.get(schema);
  if (!jsonSchema) {
    try {
      jsonSchema = schema["~standard"].jsonSchema.input({
        target: "draft-2020-12",
      }) as IJsonSchema;
    } catch (error) {
      jsonSchema = error instanceof Error ? error : new Error(String(error));
    }
    jsonSchemaCache.set(schema, jsonSchema);
  }

  return jsonSchema;
}

export function resolveStoryProps(
  schema: StoryPropsSchema,
  values: Record<string, unknown>,
): StoryPropsResult | Promise<StoryPropsResult> {
  try {
    const result = schema["~standard"].validate(values);
    return result instanceof Promise ? result.catch(toFailure) : result;
  } catch (error) {
    return toFailure(error);
  }
}

function toFailure(error: unknown): StoryPropsResult {
  return {
    issues: [
      { message: error instanceof Error ? error.message : String(error) },
    ],
  };
}

export function unwrapNullable(schema: IJsonSchema): {
  schema: IJsonSchema;
  type: JsonSchemaType | undefined;
  nullable: boolean;
} {
  const variants = schema.anyOf ?? schema.oneOf;
  const nullable =
    getSchemaTypes(schema).includes("null") ||
    !!variants?.some((variant) => getSchemaTypes(variant).includes("null"));
  const values = variants?.filter(
    (variant) => !getSchemaTypes(variant).includes("null"),
  );

  const unwrapped =
    values?.length === 1 ? { ...values[0], ...omitVariants(schema) } : schema;

  return {
    schema: unwrapped,
    type: getSchemaTypes(unwrapped).find((type) => type !== "null"),
    nullable,
  };
}

function omitVariants({ anyOf, oneOf, ...rest }: IJsonSchema): IJsonSchema {
  return rest;
}

export function formatStoryIssues(
  issues: readonly StandardSchemaV1.Issue[],
): IStoryPropsIssue[] {
  return issues.map((issue) => ({
    path: (issue.path ?? [])
      .map((segment) =>
        String(typeof segment === "object" ? segment.key : segment),
      )
      .join("."),
    message: issue.message,
  }));
}

export function getSchemaTypes(schema: IJsonSchema): JsonSchemaType[] {
  if (schema.type === undefined) {
    return [];
  }
  return Array.isArray(schema.type) ? schema.type : [schema.type];
}

export function getSchemaOptions(schema: IJsonSchema): unknown[] | null {
  if (schema.enum) {
    return schema.enum;
  }

  const variants = schema.anyOf ?? schema.oneOf;
  if (variants?.length && variants.every((variant) => "const" in variant)) {
    return variants.map((variant) => variant.const);
  }

  return null;
}

export function getInitialValue(schema: IJsonSchema, required = true): unknown {
  if ("default" in schema) {
    return schema.default;
  }

  if ("const" in schema) {
    return schema.const;
  }

  if (!required) {
    return undefined;
  }

  const options = getSchemaOptions(schema);
  if (options) {
    return options[0];
  }

  const variants = schema.anyOf ?? schema.oneOf;
  if (variants?.length) {
    const variant =
      variants.find((variant) => !getSchemaTypes(variant).includes("null")) ??
      variants[0]!;
    return getInitialValue(variant);
  }

  const types = getSchemaTypes(schema);

  if (types.includes("null")) {
    return null;
  }

  switch (types[0]) {
    case "string":
      return "";
    case "number":
    case "integer":
      return Math.min(
        Math.max(0, schema.minimum ?? -Infinity),
        schema.maximum ?? Infinity,
      );
    case "boolean":
      return false;
    case "array":
      return [];
    case "object": {
      const value: Record<string, unknown> = {};
      for (const [key, property] of Object.entries(schema.properties ?? {})) {
        const propertyValue = getInitialValue(
          property,
          schema.required?.includes(key) ?? false,
        );
        if (propertyValue !== undefined) {
          value[key] = propertyValue;
        }
      }
      return value;
    }
    default:
      return undefined;
  }
}

export function getInitialStoryValues(
  story: IStory | null,
): Record<string, unknown> {
  const schema = story?.options.props;
  const jsonSchema = schema ? getStoryJsonSchema(schema) : null;
  if (!jsonSchema || jsonSchema instanceof Error) {
    return {};
  }

  return getInitialValue(jsonSchema) as Record<string, unknown>;
}

export function getInitialStoryProps(
  story: IStory | null,
): Record<string, unknown> {
  const values = getInitialStoryValues(story);
  const schema = story?.options.props;
  if (!schema) {
    return values;
  }

  const result = resolveStoryProps(schema, values);
  if (result instanceof Promise || result.issues) {
    return values;
  }

  return result.value;
}
