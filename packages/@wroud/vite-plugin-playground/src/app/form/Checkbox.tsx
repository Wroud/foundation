interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className="twp:size-4"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
