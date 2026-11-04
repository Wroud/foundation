export type ClientModuleLoader = (id: string) => unknown;

export interface ClientModuleLoaderHost {
  __vite_rsc_client_require__?: ClientModuleLoader;
}

export interface ClientModuleLoads {
  settle(): Promise<unknown[]>;
  dispose(): void;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

export function trackClientModuleLoads(
  host: ClientModuleLoaderHost = globalThis as ClientModuleLoaderHost,
): ClientModuleLoads {
  const load = host.__vite_rsc_client_require__;
  if (!load) {
    throw new Error(
      "[vite-plugin-ssg] the client module loader is not initialized",
    );
  }

  const pending = new Set<PromiseLike<unknown>>();
  const tracked = new WeakSet<PromiseLike<unknown>>();
  const failures: unknown[] = [];

  const track: ClientModuleLoader = (id) => {
    const result = load(id);
    if (!isPromiseLike(result) || tracked.has(result)) {
      return result;
    }
    tracked.add(result);
    pending.add(result);
    result.then(
      () => {
        pending.delete(result);
      },
      (error) => {
        pending.delete(result);
        failures.push(error);
      },
    );
    return result;
  };
  host.__vite_rsc_client_require__ = track;

  function dispose() {
    if (host.__vite_rsc_client_require__ === track) {
      host.__vite_rsc_client_require__ = load;
    }
  }

  return {
    async settle() {
      while (pending.size > 0) {
        await Promise.allSettled([...pending]);
      }
      dispose();
      return failures;
    },
    dispose,
  };
}
