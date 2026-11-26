import { inputClassName } from "./styles.js";

export function Select(props: React.ComponentProps<"select">) {
  return (
    <div className="twp:relative">
      <select
        {...props}
        className={`${inputClassName} twp:appearance-none twp:pr-7`}
      />
      <i
        aria-hidden="true"
        className="codicon codicon-chevron-down twp:pointer-events-none twp:absolute twp:top-1/2 twp:right-2 twp:-translate-y-1/2 twp:text-zinc-500 twp:dark:text-zinc-400"
      />
    </div>
  );
}
