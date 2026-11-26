import { inputClassName, textareaClassName } from "./styles.js";

interface TextInputProps {
  id?: string;
  value: string;
  type?: "text" | "date";
  multiline?: boolean;
  onChange: (value: string) => void;
}

export function TextInput({
  id,
  value,
  type = "text",
  multiline,
  onChange,
}: TextInputProps) {
  return multiline ? (
    <textarea
      id={id}
      rows={3}
      className={textareaClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <input
      id={id}
      type={type}
      className={inputClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
