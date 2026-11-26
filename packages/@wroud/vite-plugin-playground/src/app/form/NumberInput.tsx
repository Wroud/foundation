import { inputClassName } from "./styles.js";

interface NumberInputProps {
  id?: string;
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | undefined) => void;
}

export function NumberInput({
  id,
  value,
  min,
  max,
  step,
  onChange,
}: NumberInputProps) {
  return (
    <input
      id={id}
      type="number"
      className={inputClassName}
      min={min}
      max={max}
      step={step ?? "any"}
      value={value ?? ""}
      onChange={(event) =>
        onChange(
          event.target.value === "" ? undefined : event.target.valueAsNumber,
        )
      }
    />
  );
}
