export type JsonSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export interface IJsonSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: IJsonSchema[];
  oneOf?: IJsonSchema[];
  properties?: Record<string, IJsonSchema>;
  required?: string[];
  default?: unknown;
  title?: string;
  description?: string;
  format?: string;
  control?: string;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  [key: string]: unknown;
}
