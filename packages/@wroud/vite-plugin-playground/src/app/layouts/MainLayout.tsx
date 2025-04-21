import { Navigation } from "../Navigation.js";
import { use, useState } from "react";
import type { ReactNode } from "react";
import { Theme } from "../components/Theme.js";
import { useSplitView } from "@wroud/react-split-view";
import { TopAppBar } from "../TopAppBar.js";
import { Dialog, useDialogStore } from "@ariakit/react";
import { Drawer } from "../Drawer.js";

interface MainLayoutProps {
  children: ReactNode;
  activeNodeId?: string | null;
}

export function MainLayout({ children, activeNodeId = null }: MainLayoutProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const split = useSplitView<HTMLDivElement>();
  const theme = use(Theme)!;
  const dialog = useDialogStore({
    open: navigationOpen,
    setOpen: setNavigationOpen,
  });

  return (
    <div className="twp:h-full twp:w-full twp:overflow-hidden twp:flex">
      <Navigation
        {...split.viewProps}
        switchTheme={theme.switchTheme}
        activeNodeId={activeNodeId}
      />
      <div {...split.sashProps} className="sash" />
      <div className="twp:flex twp:flex-col twp:flex-auto twp:basis-0 twp:overflow-auto">
        <TopAppBar
          theme={theme.theme}
          switchTheme={theme.switchTheme}
          isDialogOpen={navigationOpen}
          dialog={dialog}
        />
        {children}
      </div>
      <Dialog className="twp:fixed twp:lg:hidden" store={dialog}>
        <Drawer
          theme={theme.theme}
          switchTheme={theme.switchTheme}
          isDialogOpen={navigationOpen}
          activeNodeId={activeNodeId}
        />
      </Dialog>
    </div>
  );
}
