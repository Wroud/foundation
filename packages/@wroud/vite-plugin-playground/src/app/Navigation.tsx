import { HomeLink } from "./components/HomeLink.js";
import { StoriesTree } from "./components/StoriesTree.js";
interface Props {
  switchTheme: () => void;
  activeNodeId: string | null;
  ref: React.Ref<HTMLDivElement>;
}

export function Navigation({ activeNodeId, ref }: Props) {
  return (
    <div
      ref={ref}
      className="twp:contents twp:lg:flex twp:basis-72 twp:overflow-auto"
    >
      <div className="twp:contents twp:lg:flex twp:lg:flex-col twp:lg:w-full twp:lg:overflow-y-auto twp:lg:border-r twp:lg:border-zinc-900/10 twp:lg:px-6 twp:lg:pt-4 twp:lg:pb-8 twp:lg:dark:border-white/10">
        <div className="twp:hidden twp:lg:flex">
          <HomeLink />
        </div>
        <nav className="twp:hidden twp:overflow-auto twp:lg:mt-10 twp:lg:block">
          <StoriesTree root={"/"} activeNodeId={activeNodeId} />
        </nav>
      </div>
    </div>
  );
}
