import type { ISplitViewProps } from "./ISplitViewProps.js";
import type { ISplitViewSashProps } from "./ISplitViewSashProps.js";

export interface ISplitView<T extends HTMLElement> {
  viewProps: ISplitViewProps<T>;
  sashProps: ISplitViewSashProps<T>;
}
