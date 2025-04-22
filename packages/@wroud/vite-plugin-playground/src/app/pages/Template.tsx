import { useNavigation } from "@wroud/playground-react/views";
import { PlaygroundRoutes } from "@wroud/playground";

export function Template() {
  const navigation = useNavigation();
  return (
    <main className="twp:flex twp:h-full twp:flex-col twp:p-4 twp:m:p-8 twp:lg:p-16 twp:overflow-auto twp:flex-auto">
      <article className="twp:flex twp:flex-col">
        <div className="twp:flex-auto twp:prose twp:dark:prose-invert twp:[html_:where(&>*)]:mx-auto twp:[html_:where(&>*)]:max-w-2xl twp:lg:[html_:where(&>*)]:mx-[calc(50%-min(50%,var(--twp-container-lg)))] twp:lg:[html_:where(&>*)]:max-w-3xl">
          <h1>Playground</h1>
          <p>
            Playground is a powerful tool similar to Storybook that allows you
            to view, interact with, and test different components of your
            application in isolation. Experiment with component states, props,
            and configurations in a dedicated environment.
          </p>
          <div className="twp:not-prose twp:mt-6 twp:mb-16 twp:flex twp:gap-3">
            <a
              className="twp:inline-flex twp:gap-0.5 twp:justify-center twp:overflow-hidden twp:text-sm twp:font-medium twp:transition twp:rounded-full twp:bg-zinc-900 twp:py-1 twp:px-3 twp:text-white twp:hover:bg-zinc-700 twp:dark:bg-emerald-400/10 twp:dark:text-emerald-400 twp:dark:ring-1 twp:dark:ring-inset twp:dark:ring-emerald-400/20 twp:dark:hover:bg-emerald-400/10 twp:dark:hover:text-emerald-300 twp:dark:hover:ring-emerald-300 twp:no-underline"
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
              Browse Components
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="twp:mt-0.5 twp:h-5 twp:w-5 twp:-mr-1"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
                ></path>
              </svg>
            </a>
            <a
              className="twp:inline-flex twp:gap-0.5 twp:justify-center twp:overflow-hidden twp:text-sm twp:font-medium twp:transition twp:rounded-full twp:py-1 twp:px-3 twp:text-zinc-700 twp:ring-1 twp:ring-inset twp:ring-zinc-900/10 twp:hover:bg-zinc-900/2.5 twp:hover:text-zinc-900 twp:dark:text-zinc-400 twp:dark:ring-white/10 twp:dark:hover:bg-white/5 twp:dark:hover:text-white twp:no-underline"
              href="/guide"
              hidden
            >
              Usage Guide
            </a>
          </div>
          <h2 className="twp:scroll-mt-24" id="getting-started">
            Getting started
          </h2>
          <p>
            To get started with Playground, simply navigate through the
            component library using the sidebar. Select any component to view it
            in isolation and experiment with its properties. You can modify
            props, change themes, and test different states to ensure your
            components work correctly in all scenarios. Playground makes it easy
            to develop and test UI components without needing to navigate
            through your entire application.
          </p>
        </div>
      </article>
    </main>
  );
}
