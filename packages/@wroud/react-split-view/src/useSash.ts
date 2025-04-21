import { useCallback, useRef, useState } from "react";
import type { ISplitViewSash } from "./ISplitViewSash.js";

interface IOptions<TContext extends Record<any, any>> {
  onStart?: (x: number, y: number) => TContext | undefined;
  onMove?: (x: number, y: number, context: TContext | undefined) => void;
  onReset?: () => void;
}

export function useSash<
  T extends HTMLElement,
  TContext extends Record<any, any>,
>({ onReset, onMove, onStart }: IOptions<TContext>): ISplitViewSash<T> {
  const optionsRef = useRef<IOptions<TContext>>({ onMove, onStart, onReset });
  const handlerRef = useRef<React.PointerEventHandler<T>>(null);

  optionsRef.current = { onMove, onStart, onReset };

  handlerRef.current = function startDrag(event: React.PointerEvent<T>) {
    if (!event.isPrimary) return; // Ignore multi-touch gestures
    event.preventDefault();

    (event.target as HTMLDivElement).setPointerCapture(event.pointerId); // Ensure pointer is captured

    const context = optionsRef.current.onStart?.(event.pageX, event.pageY);

    function moveDrag(event: PointerEvent) {
      optionsRef.current.onMove?.(event.pageX, event.pageY, context);
    }

    function endDrag() {
      // Remove listeners
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    }

    // Attach move & up listeners to `window` to catch events even outside the element
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const onPointerDown = useCallback(
    (event: React.PointerEvent<T>) => handlerRef.current?.(event),
    [],
  );

  const onDoubleClick = useCallback(() => {
    optionsRef.current.onReset?.();
  }, []);

  const [style] = useState(
    () =>
      ({
        cursor: "grab",
        touchAction: "none",
      }) as const,
  );

  return {
    props: {
      onDoubleClick,
      onPointerDown,
      style,
    },
  };
}
