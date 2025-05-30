/// <reference types="vite/client" />
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { BrowserNavigation } from "@wroud/navigation/browser";
import type { IPatternRouteState } from "@wroud/navigation";
import { App } from "./App.js";
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import {
  fetchAllDocs,
  fetchAllStories,
} from "@wroud/playground-react/registry";
import { PlaygroundRoutes } from "@wroud/playground";

export function configure(playgroundPath: string) {
  return createAppConfig(App, {
    async onAppStart({ href, base }) {
      base = base ?? "/";
      let navigatorBase = base;

      if (base.startsWith("http")) {
        navigatorBase = new URL(base).pathname + playgroundPath;
      } else {
        navigatorBase = base + playgroundPath;

        if (navigatorBase.startsWith(".") && href) {
          navigatorBase = new URL(navigatorBase, href).pathname;
        }
      }

      const matcher = new TriePatternMatching({
        base: navigatorBase,
      });
      const router = new Router({
        matcher,
      });

      const navigation = new Navigation(router);

      router.addRoute({ id: PlaygroundRoutes.root });
      router.addRoute({ id: PlaygroundRoutes.story });
      router.addRoute({ id: PlaygroundRoutes.isolated });
      router.addRoute({ id: PlaygroundRoutes.preview });
      router.addRoute({ id: PlaygroundRoutes.components });
      router.addRoute({ id: PlaygroundRoutes.assets });

      if ("document" in globalThis) {
        const browserNavigation = new BrowserNavigation(navigation);
        await browserNavigation.registerRoutes();

        if (import.meta.hot) {
          import.meta.hot.dispose(() => {
            browserNavigation.dispose();
          });
        }
      } else if (href) {
        const path = new URL(href).pathname;
        await navigation.navigate(matcher.urlToState(decodeURIComponent(path)));
      }

      return { navigation, base };
    },
    onRoutesPrerender({ navigation }) {
      const stories = fetchAllStories();
      const docs = fetchAllDocs();

      const routes = [
        {
          id: PlaygroundRoutes.components,
          params: {},
        },
        ...stories
          .map<
            IPatternRouteState<
              | typeof PlaygroundRoutes.story
              | typeof PlaygroundRoutes.isolated
              | typeof PlaygroundRoutes.preview
            >[]
          >((story) => [
            {
              id: PlaygroundRoutes.story,
              params: {
                story: story.id.slice(1).split("/"),
              },
            },
            {
              id: PlaygroundRoutes.isolated,
              params: {
                story: story.id.slice(1).split("/"),
              },
            },
            ...(story.options.preview
              ? [
                  {
                    id: PlaygroundRoutes.preview,
                    params: {
                      story: story.id.slice(1).split("/"),
                    },
                  },
                ]
              : []),
          ])
          .flat(),
        ...docs
          .map<
            IPatternRouteState<
              typeof PlaygroundRoutes.story | typeof PlaygroundRoutes.isolated
            >[]
          >((doc) => [
            {
              id: PlaygroundRoutes.story,
              params: { story: doc.id.slice(1).split("/") },
            },
            {
              id: PlaygroundRoutes.isolated,
              params: {
                story: doc.id.slice(1).split("/"),
              },
            },
          ])
          .flat(),
      ];

      return routes
        .map((route) => navigation.router.matcher?.stateToUrl(route))
        .filter(Boolean) as string[];
    },
  });
}
