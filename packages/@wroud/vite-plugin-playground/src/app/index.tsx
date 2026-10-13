/// <reference types="vite/client" />
import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import { BrowserNavigation } from "@wroud/navigation/browser";
import type { IPatternRouteState } from "@wroud/navigation";
import { Navigation, Router, TriePatternMatching } from "@wroud/navigation";
import {
  fetchAllDocs,
  fetchAllStories,
} from "@wroud/playground-react/registry";
import { PlaygroundRoutes } from "@wroud/playground";
import { App } from "./App.js";

type PlaygroundRoute = (typeof PlaygroundRoutes)[keyof typeof PlaygroundRoutes];
type PlaygroundRouteState = IPatternRouteState<PlaygroundRoute>;

export default createAppConfig(App, {
  async onAppStart({ href, base }) {
    base = base ?? "/";
    if (base.startsWith("http")) {
      base = new URL(base).pathname;
    } else if (base.startsWith(".") && href) {
      base = new URL(base, href).pathname;
    }
    const matcher = new TriePatternMatching({ base });
    const router = new Router({ matcher });
    const navigation = new Navigation(router);

    for (const id of Object.values(PlaygroundRoutes)) {
      router.addRoute({ id });
    }

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
  onRoutesPrerender({ navigation, base }) {
    const states: PlaygroundRouteState[] = [
      { id: PlaygroundRoutes.components, params: {} },
    ];

    const nodes = [
      ...fetchAllStories().map((story) => ({
        id: story.id,
        preview: Boolean(story.options.preview),
      })),
      ...fetchAllDocs().map((doc) => ({ id: doc.id, preview: false })),
    ];

    for (const node of nodes) {
      const story = node.id.slice(1).split("/");
      states.push(
        { id: PlaygroundRoutes.story, params: { story } },
        { id: PlaygroundRoutes.isolated, params: { story } },
      );
      if (node.preview) {
        states.push({ id: PlaygroundRoutes.preview, params: { story } });
      }
    }

    const prefix = base.replace(/\/$/, "");
    const routes = states
      .map((state) => navigation.router.matcher?.stateToUrl(state) ?? null)
      .filter((url): url is string => url !== null)
      .map((url) => (url.startsWith(prefix) ? url.slice(prefix.length) : url));

    return ["/", ...routes];
  },
});
