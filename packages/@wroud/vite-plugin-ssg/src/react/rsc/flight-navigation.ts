import type { RscPayload } from "./shared.js";

export type FlightPromise = Promise<RscPayload>;

export interface FlightNavigationOptions {
  fetchFlight: (url: URL) => FlightPromise;
  update: (payload: RscPayload) => void;
  resolveBase?: () => string;
  maxEntries?: number;
  ttl?: number;
  now?: () => number;
}

export interface FlightNavigation {
  navigate: (href?: string) => Promise<void>;
  prefetch: (href?: string) => Promise<void>;
}

const DEFAULT_MAX_ENTRIES = 8;
const DEFAULT_TTL = 30_000;

interface CacheEntry {
  payload: FlightPromise;
  expires: number;
}

export function createFlightNavigation(
  options: FlightNavigationOptions,
): FlightNavigation {
  const {
    fetchFlight,
    update,
    resolveBase = () => location.href,
    maxEntries = DEFAULT_MAX_ENTRIES,
    ttl = DEFAULT_TTL,
    now = Date.now,
  } = options;

  const cache = new Map<string, CacheEntry>();

  function resolve(href?: string): { url: URL; key: string } {
    const base = resolveBase();
    const url = new URL(href ?? base, base);
    const key = new URL(url.href);
    key.hash = "";
    return { url, key: key.href };
  }

  function read(key: string): FlightPromise | undefined {
    const entry = cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expires <= now()) {
      cache.delete(key);
      return undefined;
    }
    return entry.payload;
  }

  function store(key: string, payload: FlightPromise): void {
    cache.delete(key);
    cache.set(key, { payload, expires: now() + ttl });
    while (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      cache.delete(oldest);
    }
    payload.catch(() => {
      if (cache.get(key)?.payload === payload) {
        cache.delete(key);
      }
    });
  }

  let requestIndex = 0;

  async function navigate(href?: string): Promise<void> {
    const { url, key } = resolve(href);
    const request = ++requestIndex;
    const cached = read(key);
    if (cached) {
      cache.delete(key);
    }
    const next = await (cached ?? fetchFlight(url));
    if (requestIndex !== request) {
      return;
    }
    update(next);
  }

  async function prefetch(href?: string): Promise<void> {
    const { url, key } = resolve(href);
    let payload = read(key);
    if (!payload) {
      payload = fetchFlight(url);
      store(key, payload);
    }
    try {
      await payload;
    } catch {
      return;
    }
  }

  return { navigate, prefetch };
}
