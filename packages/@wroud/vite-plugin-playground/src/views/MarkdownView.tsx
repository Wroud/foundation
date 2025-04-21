import Markdown from "react-markdown";

export interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="twp:flex twp:h-full twp:flex-col twp:p-4 twp:m:p-8 twp:lg:p-16 twp:overflow-auto">
      <div className="twp:flex-auto twp:prose twp:prose-sm twp:dark:prose-invert twp:[html_:where(&>*)]:mx-auto twp:[html_:where(&>*)]:max-w-2xl twp:lg:[html_:where(&>*)]:mx-[calc(50%-min(50%,var(--twp-container-lg)))] twp:lg:[html_:where(&>*)]:max-w-3xl">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
