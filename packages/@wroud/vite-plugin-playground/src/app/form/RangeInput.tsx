interface RangeInputProps {
  id?: string;
  value: number | undefined;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function RangeInput({
  id,
  value,
  min,
  max,
  step,
  onChange,
}: RangeInputProps) {
  return (
    <div className="twp:flex twp:items-center twp:gap-2">
      <input
        id={id}
        type="range"
        className="twp:flex-auto"
        min={min}
        max={max}
        step={step ?? "any"}
        value={value ?? min}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
      <output
        htmlFor={id}
        className="twp:w-10 twp:text-right twp:text-sm twp:tabular-nums"
      >
        {value}
      </output>
    </div>
  );
}
