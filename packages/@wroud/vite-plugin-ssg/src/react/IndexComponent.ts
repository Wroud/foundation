import type React from "react";

export interface IndexComponentContext {
  href?: string | null;
  cspNonce?: string;
  base?: string;
  headers?: Record<string, string | string[] | undefined>;
  navigate?: (href: string) => Promise<void>;
}

export interface IndexComponentProps {
  context: IndexComponentContext;
}

export type IndexComponent = React.FC<IndexComponentProps>;

export interface RscEntryProps<TApp = unknown> {
  context: IndexComponentContext;
  app: TApp;
  children?: React.ReactNode;
}

export type RscEntryComponent<TApp = any> = (
  props: RscEntryProps<TApp>,
) => React.ReactNode | Promise<React.ReactNode>;
