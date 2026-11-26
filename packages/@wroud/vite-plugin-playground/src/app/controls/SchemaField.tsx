import { useId } from "react";
import {
  getSchemaOptions,
  unwrapNullable,
  type IJsonSchema,
  type JsonSchemaType,
} from "@wroud/playground-react/controls";
import { Checkbox } from "../form/Checkbox.js";
import { ColorInput } from "../form/ColorInput.js";
import { ErrorMessages, Field } from "../form/Field.js";
import { JsonInput } from "../form/JsonInput.js";
import { NumberInput } from "../form/NumberInput.js";
import { RangeInput } from "../form/RangeInput.js";
import { Select } from "../form/Select.js";
import { TextInput } from "../form/TextInput.js";
import { labelClassName } from "../form/styles.js";

export type IssuesMap = ReadonlyMap<string, string[]>;

interface SchemaFieldProps {
  label: string;
  path: string;
  schema: IJsonSchema;
  value: unknown;
  required: boolean;
  issues: IssuesMap;
  onChange: (value: unknown) => void;
}

export function SchemaField({
  label,
  path,
  schema: fieldSchema,
  value,
  required,
  issues,
  onChange,
}: SchemaFieldProps) {
  const id = useId();
  const { schema, type, nullable } = unwrapNullable(fieldSchema);
  const options = getSchemaOptions(schema);

  if (type === "object" && schema.properties) {
    return (
      <fieldset className="twp:flex twp:flex-col twp:gap-3 twp:rounded-md twp:border twp:border-zinc-200 twp:p-3 twp:dark:border-zinc-700">
        <legend className={`twp:px-1 ${labelClassName}`}>{label}</legend>
        <ObjectFields
          path={path}
          schema={schema}
          value={value}
          issues={issues}
          onChange={onChange}
        />
        <ErrorMessages errors={issues.get(path)} />
      </fieldset>
    );
  }

  const field = {
    label,
    required,
    description: schema.description,
    errors: collectNestedErrors(issues, path),
  };

  if (!options && type === "boolean") {
    return (
      <Field {...field} inline>
        <Checkbox checked={value === true} onChange={onChange} />
      </Field>
    );
  }

  return (
    <Field {...field} htmlFor={id}>
      <SchemaInput
        id={id}
        schema={schema}
        type={type}
        options={options}
        clearable={!required || nullable}
        value={value}
        onChange={(next) => onChange(next ?? (nullable ? null : undefined))}
      />
    </Field>
  );
}

interface ObjectFieldsProps {
  path: string;
  schema: IJsonSchema;
  value: unknown;
  issues: IssuesMap;
  onChange: (value: Record<string, unknown>) => void;
}

export function ObjectFields({
  path,
  schema,
  value,
  issues,
  onChange,
}: ObjectFieldsProps) {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return Object.entries(schema.properties ?? {}).map(([key, property]) => (
    <SchemaField
      key={key}
      label={property.title ?? key}
      path={path ? `${path}.${key}` : key}
      schema={property}
      value={record[key]}
      required={schema.required?.includes(key) ?? false}
      issues={issues}
      onChange={(propertyValue) => {
        const next = { ...record };
        if (propertyValue === undefined) {
          delete next[key];
        } else {
          next[key] = propertyValue;
        }
        onChange(next);
      }}
    />
  ));
}

function collectNestedErrors(issues: IssuesMap, path: string): string[] {
  return [...issues]
    .filter(
      ([issuePath]) => issuePath === path || issuePath.startsWith(`${path}.`),
    )
    .flatMap(([, messages]) => messages);
}

interface SchemaInputProps {
  id: string;
  schema: IJsonSchema;
  type: JsonSchemaType | undefined;
  options: unknown[] | null;
  clearable: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}

function SchemaInput({
  id,
  schema,
  type,
  options,
  clearable,
  value,
  onChange,
}: SchemaInputProps) {
  if (options) {
    const index = options.findIndex((option) => Object.is(option, value));
    return (
      <Select
        id={id}
        value={index === -1 ? "" : String(index)}
        onChange={(event) =>
          onChange(
            event.target.value === ""
              ? undefined
              : options[Number(event.target.value)],
          )
        }
      >
        {(index === -1 || clearable) && <option value="">—</option>}
        {options.map((option, optionIndex) => (
          <option key={optionIndex} value={String(optionIndex)}>
            {String(option)}
          </option>
        ))}
      </Select>
    );
  }

  if (type === "string") {
    const text = typeof value === "string" ? value : "";
    return schema.format === "color" || schema.control === "color" ? (
      <ColorInput id={id} value={text} onChange={onChange} />
    ) : (
      <TextInput
        id={id}
        value={text}
        type={schema.format === "date" ? "date" : "text"}
        multiline={schema.control === "textarea"}
        onChange={onChange}
      />
    );
  }

  if (type === "number" || type === "integer") {
    const number = typeof value === "number" ? value : undefined;
    const step = schema.multipleOf ?? (type === "integer" ? 1 : undefined);
    return schema.control === "range" &&
      schema.minimum !== undefined &&
      schema.maximum !== undefined ? (
      <RangeInput
        id={id}
        value={number}
        min={schema.minimum}
        max={schema.maximum}
        step={step}
        onChange={onChange}
      />
    ) : (
      <NumberInput
        id={id}
        value={number}
        min={schema.minimum}
        max={schema.maximum}
        step={step}
        onChange={onChange}
      />
    );
  }

  return <JsonInput id={id} value={value} onChange={onChange} />;
}
