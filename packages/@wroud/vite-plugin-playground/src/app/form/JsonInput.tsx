import { useState } from "react";
import { textareaClassName } from "./styles.js";

interface JsonInputProps {
  id?: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function JsonInput({ id, value, onChange }: JsonInputProps) {
  const [draft, setDraft] = useState(() => ({ value, text: stringify(value) }));
  const text = draft.value === value ? draft.text : stringify(value);
  const invalid = parseJson(text) === null;

  return (
    <textarea
      id={id}
      rows={3}
      spellCheck={false}
      aria-invalid={invalid}
      className={`${textareaClassName} twp:font-mono twp:text-xs ${invalid ? "twp:border-red-500 twp:dark:border-red-500" : ""}`}
      value={text}
      onChange={(event) => {
        const text = event.target.value;
        const parsed = parseJson(text);
        setDraft({ value: parsed ? parsed.value : value, text });
        if (parsed) {
          onChange(parsed.value);
        }
      }}
    />
  );
}

function stringify(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value, null, 2);
}

function parseJson(text: string): { value: unknown } | null {
  if (text.trim() === "") {
    return { value: undefined };
  }
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}
