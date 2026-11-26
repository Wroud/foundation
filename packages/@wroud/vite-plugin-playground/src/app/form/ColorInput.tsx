import { inputClassName } from "./styles.js";

interface ColorInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorInput({ id, value, onChange }: ColorInputProps) {
  return (
    <div className="twp:flex twp:gap-2">
      <input
        type="color"
        aria-label="Pick color"
        className="twp:h-8 twp:w-10 twp:shrink-0 twp:cursor-pointer twp:rounded-md twp:border twp:border-zinc-300 twp:bg-white twp:p-1 twp:dark:border-zinc-700 twp:dark:bg-zinc-800 twp:[&::-webkit-color-swatch]:rounded-sm twp:[&::-webkit-color-swatch]:border-none twp:[&::-webkit-color-swatch-wrapper]:p-0 twp:[&::-moz-color-swatch]:rounded-sm twp:[&::-moz-color-swatch]:border-none"
        value={value || "#000000"}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        id={id}
        type="text"
        spellCheck={false}
        className={`${inputClassName} twp:font-mono`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
