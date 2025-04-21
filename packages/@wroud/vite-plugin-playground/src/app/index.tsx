/// <reference types="vite/client" />
import "@wroud/vite-plugin-playground/stories";
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { BrowserNavigation } from "@wroud/navigation/browser";
import info from "@wroud/vite-plugin-playground/info";
import type { IPatternRouteState } from "@wroud/navigation";
import { App } from "./App.js";
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import { fetchAllStories } from "../registry/stories.js";
import { PlaygroundRoutes } from "./PlaygroundRoutes.js";
import { fetchAllDocs } from "../registry/docs.js";

export default createAppConfig(App, {
  async onAppStart({ href, base }) {
    base = base ?? "/";
    let navigatorBase = base;

    if (base.startsWith("http")) {
      navigatorBase = new URL(base).pathname + info.path;
    } else {
      navigatorBase = base + info.path;

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
      ...stories
        .map<
          IPatternRouteState<
            typeof PlaygroundRoutes.story | typeof PlaygroundRoutes.isolated
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
