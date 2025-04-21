import { useRef } from "react";
import type { ISplitView } from "./ISplitView.js";
import { useSash } from "./useSash.js";

export interface IOptions {
  sticky?: number;
}

export function useSplitView<T extends HTMLElement>(
  options?: IOptions,
): ISplitView<T> {
  const viewRef = useRef<T>(null);
  const sash = useSash({
    onStart(x, y) {
      const parent = viewRef.current?.parentElement;
      const view = viewRef.current;
      if (!view || !parent) return;

      const flexDirection = getComputedStyle(parent).flexDirection as
        | "row"
        | "column"
        | "row-reverse"
        | "column-reverse";

      const rect = parent.getBoundingClientRect();

      return {
        flexDirection,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    },
    onMove(x, y, context) {
      const parent = viewRef.current?.parentElement;
      const view = viewRef.current;
      if (!view || !parent || !context) return;

      let position;
      let offset;
      let size;

      if (
        context.flexDirection === "row" ||
        context.flexDirection === "row-reverse"
      ) {
        position = x;
        offset = context.left;
        size = context.width;
      } else {
        position = y;
        offset = context.top;
        size = context.height;
      }

      let basis: string | number = Math.max(0, position - offset);

      if (options?.sticky !== undefined) {
        if (basis < options.sticky) {
          basis = 0;
        } else if (basis > size - options.sticky) {
          basis = "100%";
        }
      }

      if (typeof basis === "number") {
        view.style.flexBasis = `${basis}px`;
      } else {
        view.style.flexBasis = basis;
      }
      view.style.flexGrow = "0";
    },
    onReset() {
      const view = viewRef.current;
      if (!view) return;

      view.style.flexBasis = "";
      view.style.flexGrow = "";
    },
  });

  return {
    viewProps: { ref: viewRef },
    sashProps: sash.props,
  };
}
