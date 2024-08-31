import { useEffect, useRef } from "react";

export function useAbandonedRenderDisposer(dispose: () => any) {
  const tracker = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (tracker.current === null) {
    tracker.current = setTimeout(dispose, 5 * 60 * 1000);
  }

  useEffect(() => {
    if (tracker.current !== null) {
      clearTimeout(tracker.current);
    }
  }, []);
}
