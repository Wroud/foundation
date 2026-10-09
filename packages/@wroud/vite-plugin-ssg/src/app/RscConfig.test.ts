import { describe, it, expect } from "vitest";
import type {
  IndexComponentContext,
  RscEntryComponent,
} from "../react/IndexComponent.js";
import { createRscConfig } from "./RscConfig.js";
import type { RequestHandler, RequestMiddleware } from "../app.js";
import type { RequestMiddleware as PublicRequestMiddleware } from "../ssgPlugin.js";

const root: RscEntryComponent = ({ children }) => children;

function ctx(href: string): IndexComponentContext {
  return { href, base: "/" };
}

describe("RscInstance lifecycle", () => {
  it("stores optional middleware through the public Fetch contract", () => {
    const handler: RequestHandler = () => new Response("ok");
    const middleware: RequestMiddleware = (next) => (request) => next(request);
    const publicMiddleware: PublicRequestMiddleware = middleware;
    const rsc = createRscConfig(root, { middleware: [publicMiddleware] });

    expect(rsc.middleware).toEqual([middleware]);
    expect(createRscConfig(root).middleware).toEqual([]);
    expect(
      middleware(handler)(new Request("http://localhost/")),
    ).toBeInstanceOf(Response);
  });

  it("starts a fresh app per request instead of reusing one instance", async () => {
    const seen: string[] = [];
    const rsc = createRscConfig(root, {
      onAppStart: (context) => {
        seen.push(context.href!);
        return { base: "/", href: context.href };
      },
    });

    const a = await rsc.start(ctx("http://x/a"));
    const b = await rsc.start(ctx("http://x/b"));

    expect(seen).toEqual(["http://x/a", "http://x/b"]);
    expect(a).not.toBe(b);
    expect(a.href).toBe("http://x/a");
    expect(b.href).toBe("http://x/b");
  });

  it("disposes the started app per request via stop(app)", async () => {
    const stopped: unknown[] = [];
    const rsc = createRscConfig(root, {
      onAppStart: (context) => ({ base: "/", href: context.href }),
      onAppStop: (app) => {
        stopped.push(app);
      },
    });

    const a = await rsc.start(ctx("http://x/a"));
    const b = await rsc.start(ctx("http://x/b"));
    await rsc.stop(a);
    await rsc.stop(b);

    expect(stopped).toEqual([a, b]);
  });

  it("gives concurrent requests independent app instances", async () => {
    let resolveFirst!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    let started = 0;
    const rsc = createRscConfig(root, {
      onAppStart: async (context) => {
        if (started++ === 0) {
          await firstStarted;
        }
        return { base: "/", href: context.href };
      },
    });

    const first = rsc.start(ctx("http://x/first"));
    const second = rsc.start(ctx("http://x/second"));
    resolveFirst();

    const [a, b] = await Promise.all([first, second]);
    expect(a).not.toBe(b);
    expect(a.href).toBe("http://x/first");
    expect(b.href).toBe("http://x/second");
  });
});
