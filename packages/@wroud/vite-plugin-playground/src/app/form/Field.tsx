import type { ReactNode } from "react";
import { labelClassName } from "./styles.js";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  inline?: boolean;
  description?: string;
  errors?: string[];
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  inline,
  description,
  errors,
  children,
}: FieldProps) {
  const text = (
    <>
      {label}
      {required && (
        <span className="twp:ml-0.5 twp:text-zinc-400" aria-hidden="true">
          *
        </span>
      )}
    </>
  );

  return (
    <div className="twp:flex twp:flex-col twp:gap-1">
      {inline ? (
        <label
          className={`twp:flex twp:items-center twp:gap-2 ${labelClassName}`}
        >
          {children}
          {text}
        </label>
      ) : (
        <>
          <label htmlFor={htmlFor} className={labelClassName}>
            {text}
          </label>
          {children}
        </>
      )}
      {description && (
        <p className="twp:text-xs twp:text-zinc-500 twp:dark:text-zinc-400">
          {description}
        </p>
      )}
      <ErrorMessages errors={errors} />
    </div>
  );
}

export function ErrorMessages({ errors }: { errors?: string[] }) {
  return errors?.map((error, index) => (
    <p
      key={index}
      role="alert"
      className="twp:text-xs twp:text-red-600 twp:dark:text-red-400"
    >
      {error}
    </p>
  ));
}
