import { useDialogContext } from "@ariakit/react";
import { TopAppBar } from "./TopAppBar.js";
import { StoriesTree } from "./components/StoriesTree.js";

interface Props {
  theme: string;
  switchTheme: () => void;
  activeNodeId: string | null;
  isDialogOpen: boolean;
}

export function Drawer({
  theme,
  switchTheme,
  isDialogOpen,
  activeNodeId,
}: Props) {
  const dialog = useDialogContext()!;

  return (
    <>
      <div
        className="twp:fixed twp:inset-0 twp:top-14 twp:bg-zinc-400/20 twp:backdrop-blur-xs twp:data-closed:opacity-0 twp:data-enter:duration-300 twp:data-enter:ease-out twp:data-leave:duration-200 twp:data-leave:ease-in twp:dark:bg-black/40"
        aria-hidden="true"
        data-open
        onClick={dialog.hide}
      ></div>
      <div data-open>
        <TopAppBar
          theme={theme}
          switchTheme={switchTheme}
          isDialogOpen={isDialogOpen}
          dialog={dialog}
        />
        <div className="twp:fixed twp:top-14 twp:bottom-0 twp:left-0 twp:w-full twp:overflow-y-auto twp:bg-white twp:px-4 twp:pt-6 twp:pb-4 twp:ring-1 twp:shadow-lg twp:shadow-zinc-900/10 twp:ring-zinc-900/7.5 twp:duration-500 twp:ease-in-out twp:data-closed:-translate-x-full twp:min-[416px]:max-w-sm twp:sm:px-6 twp:sm:pb-10 twp:dark:bg-zinc-900 twp:dark:ring-zinc-800">
          <nav>
            <StoriesTree root={"/"} activeNodeId={activeNodeId} />
          </nav>
        </div>
      </div>
    </>
  );
}
