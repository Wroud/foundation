import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";
import codicon from "@vscode/codicons/dist/codicon.css?url";
import { Link } from "@wroud/vite-plugin-ssg/react/components";
import { PlaygroundRoutes } from "./PlaygroundRoutes.js";
import { lazy, useSyncExternalStore } from "react";
import { useNavigation } from "./useNavigation.js";

// Layouts
const Layout = lazy(() =>
  import("./components/Layout.js").then((m) => ({ default: m.Layout })),
);
const LayoutIsolated = lazy(() =>
  import("./components/LayoutIsolated.js").then((m) => ({
    default: m.LayoutIsolated,
  })),
);
const MainLayout = lazy(() =>
  import("./layouts/MainLayout.js").then((m) => ({ default: m.MainLayout })),
);

// Components
const Isolation = lazy(() =>
  import("./components/Isolation.js").then((m) => ({ default: m.Isolation })),
);
const ComponentsGrid = lazy(() =>
  import("./routes/components/ComponentsGrid.js").then((m) => ({
    default: m.ComponentsGrid,
  })),
);
const Template = lazy(() =>
  import("./pages/Template.js").then((m) => ({ default: m.Template })),
);
const Content = lazy(() =>
  import("./Content.js").then((m) => ({ default: m.Content })),
);

export function App(props: IndexComponentProps) {
  const navigation = useNavigation();
  const navigationState = useSyncExternalStore(
    navigation.addListener,
    navigation.getState,
    navigation.getState,
  );

  const preview = navigation.router.matcher?.isRoute(
    navigationState,
    PlaygroundRoutes.preview,
  );
  // Handle isolated view separately
  if (
    navigation.router.matcher?.isRoute(
      navigationState,
      PlaygroundRoutes.isolated,
    ) ||
    preview
  ) {
    const isolatedId = "/" + navigationState.params.story.join("/");
    return (
      <LayoutIsolated {...props}>
        <Isolation activeNodeId={isolatedId} preview={preview} />
      </LayoutIsolated>
    );
  }

  // For non-isolated views, use Layout with MainLayout inside
  return (
    <Layout {...props}>
      <Link rel="stylesheet" href={codicon} precedence="high" />

      {/* Handle components route */}
      {navigation.router.matcher?.isRoute(
        navigationState,
        PlaygroundRoutes.components,
      ) ? (
        <MainLayout>
          <ComponentsGrid />
        </MainLayout>
      ) : navigation.router.matcher?.isRoute(
          navigationState,
          PlaygroundRoutes.story,
        ) ? (
        // Handle story route
        (() => {
          const storyId = "/" + navigationState.params.story.join("/");
          return (
            <MainLayout activeNodeId={storyId}>
              <Content activeNodeId={storyId} />
            </MainLayout>
          );
        })()
      ) : (
        // Default route (home)
        <MainLayout>
          <Template />
        </MainLayout>
      )}
    </Layout>
  );
}
