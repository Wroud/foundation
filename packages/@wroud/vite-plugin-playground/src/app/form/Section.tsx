import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <section className="twp:flex twp:flex-col twp:gap-4">
      <div className="twp:flex twp:h-6 twp:items-center twp:justify-between">
        <h2 className="twp:text-sm twp:font-semibold twp:text-zinc-900 twp:dark:text-white">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
