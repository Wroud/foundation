import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { IViewPort } from "./TreeVirtualizationContext.js";

export interface UseTreeViewportResult {
  containerRef: RefObject<HTMLDivElement | null>;
  viewPort: IViewPort;
  setViewPort: Dispatch<SetStateAction<IViewPort>>;
}

// Fixed constant for overscan - using power of 2 for better performance
const OVERSCAN = 256;

// Moved outside component to avoid recreation
function getPositionWithOverscan(position: number, forward: boolean) {
  if (forward) {
    return position - (position % OVERSCAN) + OVERSCAN;
  }

  return position - (position % OVERSCAN);
}

/**
 * Hook to handle viewport calculations for virtualized trees
 * Tracks scroll position and updates viewport dimensions
 * Optimized with useLayoutEffect and requestAnimationFrame throttling
 * Also handles container resize via ResizeObserver
 * @param initialViewportHeight Optional initial viewport height to use before measurements, default 800
 */
export function useTreeViewport(
  initialViewportHeight = 800,
): UseTreeViewportResult {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start with a reasonable default viewport height to avoid layout thrashing on initial render
  const [viewPort, setViewPort] = useState<IViewPort>({
    from: 0,
    to: initialViewportHeight,
  });
  const rafRef = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initialMeasurementDoneRef = useRef(false);

  const updateViewport = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const { scrollTop, clientHeight } = containerRef.current;

    setViewPort((state) => {
      const from = getPositionWithOverscan(scrollTop, false);
      const to = getPositionWithOverscan(scrollTop + clientHeight, true);

      if (from === state.from && to === state.to) {
        return state;
      }

      return {
        from,
        to,
      };
    });

    isScrolling.current = false;
    initialMeasurementDoneRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    if (isScrolling.current) {
      return;
    }

    isScrolling.current = true;

    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule a new frame for the update
    rafRef.current = requestAnimationFrame(() => {
      updateViewport();
      rafRef.current = null;
    });
  }, [updateViewport]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Initial viewport setup - use layout effect to avoid flickering
    // But use a short timeout to prioritize rendering before measurements
    const initialUpdateTimeoutId = setTimeout(() => {
      updateViewport();
    }, 0);

    // Add scroll event listener
    container.addEventListener("scroll", handleScroll);

    // Setup resize observer to update viewport when container size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      // Use requestAnimationFrame to limit updates during resize
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        updateViewport();
        rafRef.current = null;
      });
    });

    resizeObserverRef.current.observe(container);

    // Cleanup
    return () => {
      clearTimeout(initialUpdateTimeoutId);
      container.removeEventListener("scroll", handleScroll);

      // Disconnect resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      // Cancel any pending animation frame on cleanup
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleScroll, updateViewport]);

  return {
    containerRef,
    viewPort,
    setViewPort,
  };
}
