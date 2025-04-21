import { type ChangeEvent } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      className={`twp:w-full twp:max-w-md twp:p-2 twp:border twp:border-zinc-300 twp:dark:border-zinc-700 twp:rounded-md twp:bg-white twp:dark:bg-zinc-800 ${className}`}
      value={value}
      onChange={handleChange}
    />
  );
}
