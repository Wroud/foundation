import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createBuilder, createServer, type ViteDevServer } from "vite";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import type { SsgRequestOptions, SsgRuntime } from "./react/rsc/server-rsc.js";

const fixture = fileURLToPath(
  new URL("../test-fixtures/middleware", import.meta.url),
);

describe.each(["development", "production"])("HTTP middleware (%s)", (mode) => {
  let server: ViteDevServer | undefined;
  let runtime: SsgRuntime | undefined;
  let base: string;
  let handler: SsgRuntime["handler"];

  beforeAll(async () => {
    const configFile = path.join(fixture, "vite.config.ts");
    if (mode === "development") {
      server = await createServer({
        configFile,
        logLevel: "silent",
        server: { port: 0 },
      });
      await server.listen();
      const address = server.httpServer!.address();
      if (!address || typeof address === "string")
        throw new Error("No server port");
      base = `http://localhost:${address.port}`;
      handler = (request) => fetch(request);
    } else {
      const nodeEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "production";
      try {
        const builder = await createBuilder({ configFile, logLevel: "silent" });
        await builder.buildApp();
      } finally {
        process.env["NODE_ENV"] = nodeEnv;
      }
      const entry = await import(
        pathToFileURL(path.join(fixture, "dist-rsc/index.js")).href
      );
      runtime = entry.runtime;
      handler = entry.default;
      expect(handler).toBe(runtime!.handler);
      base = "http://localhost";
    }
  }, 120_000);

  afterAll(async () => {
    await server?.close();
    await runtime?.dispose();
  });

  function request(
    route: string,
    init?: RequestInit,
    options?: SsgRequestOptions,
  ) {
    return handler(new Request(base + route, init), options);
  }

  it.each(["/", "/index.rsc"])(
    "runs the first middleware outermost for %s",
    async (route) => {
      const response = await request(route);
      expect(response.headers.get("x-enter")).toBe("outer, inner");
      expect(response.headers.get("x-exit")).toBe("inner, outer");
      expect(response.headers.get("content-type")).toContain(
        route.endsWith(".rsc") ? "text/x-component" : "text/html",
      );
      expect(await response.text()).toContain("data-testid");
    },
  );

  it("short-circuits before parsing, actions, and startup", async () => {
    const before = await (await request("/counts")).json();
    const response = await request("/blocked.rsc", {
      method: "POST",
      headers: { "x-block": "1" },
      body: "invalid action",
    });
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("blocked");
    expect(await (await request("/counts")).json()).toEqual(before);
  });

  it.each([false, true])(
    "replaces the downstream URL and headers (RSC: %s)",
    async (rsc) => {
      const response = await request("/rewrite", {
        headers: rsc ? { rsc: "1" } : {},
      });
      expect(response.headers.get("x-context")).toBe("replacement");
      if (!rsc) {
        expect(response.headers.get("x-ssr-href")).toBe(base + "/replaced");
        expect(response.headers.get("x-ssr-id")).toBe("replacement");
      }
      expect(await response.text()).toContain("/replaced");
    },
  );

  it("modifies downstream response headers and status", async () => {
    const response = await request("/decorate");
    expect(response.status).toBe(202);
    expect(response.headers.get("x-exit")).toBe("inner, outer");
    expect(await response.text()).toContain("/decorate");
  });

  it.each(["/startup-error", "/invalid.rsc"])(
    "catches downstream errors at %s",
    async (route) => {
      const response = await request(
        route,
        route.endsWith(".rsc")
          ? { method: "POST", body: "invalid" }
          : undefined,
      );
      expect(response.status).toBe(503);
      expect(await response.text()).toContain(
        route.endsWith(".rsc") ? "missing the action id" : "startup failed",
      );
    },
  );

  it("cleans up each rendered application when its stream finishes", async () => {
    const before = await (await request("/counts")).json();
    await (await request("/cleanup.rsc")).text();
    const after = await (await request("/counts")).json();
    expect(after.starts - before.starts).toBe(1);
    expect(after.stops - before.stops).toBe(1);
  });

  it("isolates asynchronous startup and RSC render context across concurrent requests", async () => {
    const [first, second] = await Promise.all([
      request("/first.rsc", { headers: { "x-id": "first" } }),
      request("/second.rsc", { headers: { "x-id": "second" } }),
    ]);
    expect(first.headers.get("x-context")).toBe("first");
    expect(second.headers.get("x-context")).toBe("second");
    const [a, b] = await Promise.all([first.text(), second.text()]);
    expect(a).toContain('"children":"first"');
    expect(a).not.toContain('"children":"second"');
    expect(b).toContain('"children":"second"');
    expect(b).not.toContain('"children":"first"');
  });

  it.each([false, true])(
    "returns readable chunks before downstream rendering finishes (RSC: %s)",
    async (rsc) => {
      const id = rsc ? "stream-rsc" : "stream-html";
      const responsePromise = request("/slow", {
        headers: { "x-id": id, ...(rsc ? { rsc: "1" } : {}) },
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const chunk = responsePromise.then(async (response) => {
          const reader = response.body!.getReader();
          const first = await reader.read();
          return { reader, first };
        });
        const { reader, first } = await Promise.race([
          chunk,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("Response was buffered")),
              5000,
            );
          }),
        ]);
        expect(first.done).toBe(false);
        expect(first.value!.length).toBeGreaterThan(0);
        await request("/release?id=" + id);
        const chunks = [first.value!];
        for (;;) {
          const next = await reader.read();
          if (next.done) break;
          chunks.push(next.value);
        }
        const body = chunks
          .map((part) => new TextDecoder().decode(part))
          .join("");
        expect(body).toContain(id);
        expect(body).toContain("slow");
      } finally {
        clearTimeout(timer);
        await request("/release?id=" + id);
      }
    },
  );

  if (mode === "production") {
    it("forwards per-request nonce and settled options after replacement without concurrent leakage", async () => {
      const id = "settled";
      let resolved = false;
      const pending = request(
        "/rewrite?target=/slow",
        { headers: { "x-id": id } },
        { cspNonce: "nonce-first", settled: true },
      ).then((response) => {
        resolved = true;
        return response;
      });
      const other = await request("/rewrite", undefined, {
        cspNonce: "nonce-second",
      });
      expect(other.headers.get("x-nonce")).toBe("nonce-second");
      expect(other.headers.get("x-ssr-nonce")).toBe("nonce-second");
      expect(await other.text()).toContain('nonce="nonce-second"');
      expect(resolved).toBe(false);
      await request("/release?id=replacement");
      const response = await pending;
      expect(response.headers.get("x-nonce")).toBe("nonce-first");
      expect(response.headers.get("x-ssr-nonce")).toBe("nonce-first");
      const html = await response.text();
      expect(html).toContain('nonce="nonce-first"');
      expect(html).not.toContain('data-testid="fallback"');
      expect(html).toContain('data-testid="slow"');
    });

    it("forwards request options to a replacement RSC request", async () => {
      const response = await request(
        "/rewrite",
        { headers: { rsc: "1" } },
        { cspNonce: "nonce-flight", settled: true },
      );
      expect(response.headers.get("x-nonce")).toBe("nonce-flight");
      expect(await response.text()).toContain('"cspNonce":"nonce-flight"');
    });

    it("keeps prerendering outside the middleware boundary", async () => {
      const result = await runtime!.handleSsg(
        new Request(base + "/prerender", { headers: { "x-block": "1" } }),
      );
      expect(result.headers.get("x-enter")).toBe("");
      expect(result.headers.get("x-context")).toBe("none");
      expect(await new Response(result.html).text()).toContain("/prerender");
      await new Response(result.rsc).text();
    });
  }
});
