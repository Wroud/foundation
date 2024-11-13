import type React from "react";

export interface IndexComponentContext {
  cspNonce?: string;
  base?: string;
}

export interface IndexComponentProps {
  renderTags: (
    injectTo?: "head" | "body" | "head-prepend" | "body-prepend",
  ) => React.ReactElement;
  context: IndexComponentContext;
}

export type IndexComponent = React.FC<IndexComponentProps>;
