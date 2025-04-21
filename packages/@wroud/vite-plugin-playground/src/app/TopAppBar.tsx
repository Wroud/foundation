import type { DialogStore } from "@ariakit/react";
import { HomeLink } from "./components/HomeLink.js";
import { useNavigation } from "./useNavigation.js";
import { PlaygroundRoutes } from "./PlaygroundRoutes.js";

interface Props {
  theme: string;
  switchTheme: () => void;
  dialog: DialogStore;
  isDialogOpen: boolean;
}

export function TopAppBar({ theme, switchTheme, dialog, isDialogOpen }: Props) {
  const navigation = useNavigation();
  return (
    <div
      className="twp:flex twp:shrink-0 twp:h-14 twp:items-center twp:justify-between twp:border-b twp:border-zinc-900/10 twp:dark:border-white/10 twp:gap-12 twp:px-4 twp:transition twp:sm:px-6 twp:lg:px-8 twp:backdrop-blur-xs twp:dark:backdrop-blur-sm twp:bg-white/[var(--twp-bg-opacity-light)] twp:dark:bg-zinc-900/[var(--twp-bg-opacity-dark)]"
      style={
        {
          "--twp-bg-opacity-light": "0.5",
          "--twp-bg-opacity-dark": "0.2",
        } as React.CSSProperties
      }
    >
      <div className="twp:hidden twp:lg:block twp:lg:max-w-md twp:lg:flex-auto">
        <button
          type="button"
          className="twp:hidden twp:h-8 twp:w-full twp:items-center twp:gap-2 twp:rounded-full twp:bg-white twp:pr-3 twp:pl-2 twp:text-sm twp:text-zinc-500 twp:ring-1 twp:ring-zinc-900/10 twp:transition twp:hover:ring-zinc-900/20 twp:lg:flex twp:dark:bg-white/5 twp:dark:text-zinc-400 twp:dark:ring-white/10 twp:dark:ring-inset twp:dark:hover:ring-white/20"
          hidden
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="twp:h-5 twp:w-5 twp:stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
            ></path>
          </svg>
          Find something...
          <kbd className="twp:ml-auto twp:text-2xs twp:text-zinc-400 twp:dark:text-zinc-500">
            <kbd className="twp:font-sans">⌘</kbd>
            <kbd className="twp:font-sans">K</kbd>
          </kbd>
        </button>
      </div>
      <div className="twp:flex twp:items-center twp:gap-5 twp:lg:hidden">
        <button
          type="button"
          className="twp:flex twp:h-6 twp:w-6 twp:items-center twp:justify-center twp:rounded-md twp:transition twp:hover:bg-zinc-900/5 twp:dark:hover:bg-white/5"
          aria-label="Toggle navigation"
          onClick={dialog.toggle}
        >
          {isDialogOpen ? (
            <svg
              viewBox="0 0 10 9"
              fill="none"
              strokeLinecap="round"
              aria-hidden="true"
              className="twp:w-2.5 twp:stroke-zinc-900 twp:dark:stroke-white"
            >
              <path d="m1.5 1 7 7M8.5 1l-7 7"></path>
            </svg>
          ) : (
            <svg
              viewBox="0 0 10 9"
              fill="none"
              strokeLinecap="round"
              aria-hidden="true"
              className="twp:w-2.5 twp:stroke-zinc-900 twp:dark:stroke-white"
            >
              <path d="M.5 1h9M.5 8h9M.5 4.5h9"></path>
            </svg>
          )}
        </button>
        <HomeLink />
      </div>
      <div className="twp:flex twp:items-center twp:gap-5">
        <nav className="twp:hidden twp:md:block">
          <ul role="list" className="twp:flex twp:items-center twp:gap-8">
            <li>
              <a
                className="twp:text-sm/5 twp:text-zinc-600 twp:transition twp:hover:text-zinc-900 twp:dark:text-zinc-400 twp:dark:hover:text-white"
                href={
                  navigation.router.matcher?.stateToUrl({
                    id: PlaygroundRoutes.components,
                    params: {},
                  }) ?? "#"
                }
                onClick={(e) => {
                  e.preventDefault();
                  navigation.navigate({
                    id: PlaygroundRoutes.components,
                    params: {},
                  });
                }}
              >
                Components
              </a>
            </li>
          </ul>
          <ul
            role="list"
            className="twp:flex twp:items-center twp:gap-8"
            hidden
          >
            <li>
              <a
                className="twp:text-sm/5 twp:text-zinc-600 twp:transition twp:hover:text-zinc-900 twp:dark:text-zinc-400 twp:dark:hover:text-white"
                href="/"
              >
                API
              </a>
            </li>
          </ul>
        </nav>
        <div
          className="twp:hidden twp:md:block twp:md:h-5 twp:md:w-px twp:md:bg-zinc-900/10 twp:md:dark:bg-white/15"
          hidden
        ></div>
        <div className="twp:flex twp:gap-4">
          <div className="twp:contents twp:lg:hidden" hidden>
            <button
              type="button"
              className="twp:flex twp:h-6 twp:w-6 twp:items-center twp:justify-center twp:rounded-md twp:transition twp:hover:bg-zinc-900/5 twp:lg:hidden twp:dark:hover:bg-white/5"
              aria-label="Find something..."
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="twp:h-5 twp:w-5 twp:stroke-zinc-900 twp:dark:stroke-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
                ></path>
              </svg>
            </button>
          </div>
          <button
            type="button"
            className="twp:flex twp:h-6 twp:w-6 twp:items-center twp:justify-center twp:rounded-md twp:transition twp:hover:bg-zinc-900/5 twp:dark:hover:bg-white/5"
            aria-label={`Switch to ${theme} theme`}
            onClick={switchTheme}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="twp:h-5 twp:w-5 twp:stroke-zinc-900 twp:dark:hidden"
            >
              <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"></path>
              <path
                strokeLinecap="round"
                d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
              ></path>
            </svg>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="twp:hidden twp:h-5 twp:w-5 twp:stroke-white twp:dark:block"
            >
              <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
