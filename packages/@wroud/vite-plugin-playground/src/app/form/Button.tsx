const variants = {
  default:
    "twp:h-8 twp:rounded-md twp:border twp:border-zinc-300 twp:bg-white twp:px-3 twp:text-sm twp:text-zinc-900 twp:hover:bg-zinc-50 twp:dark:border-zinc-700 twp:dark:bg-zinc-800 twp:dark:text-zinc-100 twp:dark:hover:bg-zinc-700",
  ghost:
    "twp:rounded-md twp:px-2 twp:py-1 twp:text-xs twp:text-zinc-600 twp:hover:bg-zinc-900/5 twp:dark:text-zinc-400 twp:dark:hover:bg-white/5",
};

interface ButtonProps {
  variant?: keyof typeof variants;
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`twp:transition ${variants[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
