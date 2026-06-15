import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createBuilder, createServer, type ViteDevServer } from "vite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const fixturesDir = fileURLToPath(new URL("../test-fixtures", import.meta.url));

async function buildFixture(name: string) {
  const fixtureDir = path.join(fixturesDir, name);
  for (const dir of ["dist", "dist-ssr", "dist-rsc"]) {
    await fs.rm(path.join(fixtureDir, dir), { recursive: true, force: true });
  }
  const nodeEnv = process.env["NODE_ENV"];
  process.env["NODE_ENV"] = "production";
  try {
    const builder = await createBuilder({
      configFile: path.join(fixtureDir, "vite.config.ts"),
      logLevel: "silent",
    });
    await builder.buildApp();
  } finally {
    process.env["NODE_ENV"] = nodeEnv;
  }
  return path.join(fixtureDir, "dist");
}

function makeReaders(distDir: string) {
  return {
    read: (file: string) => fs.readFile(path.join(distDir, file), "utf8"),
    exists: (file: string) =>
      fs.access(path.join(distDir, file)).then(
        () => true,
        () => false,
      ),
  };
}

describe("rsc ssg build", () => {
  let read: (file: string) => Promise<string>;
  let exists: (file: string) => Promise<boolean>;

  beforeAll(async () => {
    const distDir = await buildFixture("basic");
    ({ read, exists } = makeReaders(distDir));
  }, 120_000);

  it("emits one html file per declared route", async () => {
    expect(await exists("index.html")).toBe(true);
    expect(await exists("about.html")).toBe(true);
    expect(await exists("profile.html")).toBe(true);
  });

  it("renders server components and dispatches by url", async () => {
    const index = await read("index.html");
    expect(index).toContain('data-testid="server-data">from-server');
    expect(index).toContain('data-testid="path">/<');
    expect(await read("about.html")).toContain('data-testid="path">/about<');
  });

  it("server-renders client components with hydration bootstrap", async () => {
    const index = await read("index.html");
    expect(index).toContain('data-testid="counter"');
    expect(index).toMatch(/<script>import\("\/assets\/[^"]+\.js"\)<\/script>/);
  });

  it("supports context-based libraries with onAppStart-created instances", async () => {
    expect(await read("di.html")).toContain('data-testid="di">from-di');
  });

  it("runs onAppStart during ssr and provides useAppContext", async () => {
    expect(await read("index.html")).toContain(
      'data-testid="app-data">client-start',
    );
  });

  it("injects imported css", async () => {
    const index = await read("index.html");
    expect(index).toMatch(
      /<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"/,
    );
  });

  it("renders distinct routes from a single entry root", async () => {
    expect(await read("profile.html")).toContain('data-testid="profile"');
    expect(await read("profile.html")).not.toContain('data-testid="counter"');
  });

  it("emits rsc flight payloads for client navigation", async () => {
    expect(await exists("index.rsc")).toBe(true);
    expect(await exists("about.rsc")).toBe(true);
    expect(await exists("profile.rsc")).toBe(true);
  });

  it("bridges rsc data to the client only through explicit client props", async () => {
    expect(await read("index.html")).toContain(
      'data-testid="server-data">from-server',
    );
    expect(await read("index.rsc")).toContain("from-server");
  });

  it("never serializes the rsc app object itself", async () => {
    for (const file of [
      "index.html",
      "about.html",
      "profile.html",
      "di.html",
      "index.rsc",
      "di.rsc",
    ]) {
      expect(await read(file)).not.toContain("server-secret");
    }
  });

  it("disposes the app after rendering all routes", () => {
    expect((globalThis as Record<string, unknown>)["__SSG_APP_STOPPED"]).toBe(
      true,
    );
  });

  it("emits no nonce attributes or csp-nonce meta without html.cspNonce", async () => {
    const index = await read("index.html");
    expect(index).not.toMatch(/ nonce=/);
    expect(index).not.toContain("csp-nonce");
  });
});

describe("rsc ssg build (rsc-only: server components, no client entry)", () => {
  let read: (file: string) => Promise<string>;
  let exists: (file: string) => Promise<boolean>;

  beforeAll(async () => {
    const distDir = await buildFixture("rsc-only");
    ({ read, exists } = makeReaders(distDir));
  }, 120_000);

  it("emits html per route declared in createRscConfig", async () => {
    expect(await exists("index.html")).toBe(true);
    expect(await exists("about.html")).toBe(true);
  });

  it("renders async server components per route", async () => {
    expect(await read("index.html")).toContain(
      'data-testid="rsc-only">rsc-only',
    );
    expect(await read("about.html")).toContain('data-testid="path">/about');
  });
});

describe("rsc ssg build (minimal: explicit entry, no onRoutesPrerender)", () => {
  let read: (file: string) => Promise<string>;
  let exists: (file: string) => Promise<boolean>;

  beforeAll(async () => {
    const distDir = await buildFixture("minimal");
    ({ read, exists } = makeReaders(distDir));
  }, 120_000);

  it("pre-renders only / by default", async () => {
    expect(await exists("index.html")).toBe(true);
    expect(await exists("about.html")).toBe(false);
    expect(await read("index.html")).toContain('data-testid="minimal"');
  });

  it("passes html.cspNonce into context and the flight payload script", async () => {
    const index = await read("index.html");
    expect(index).toContain('data-testid="nonce">test-nonce<');
    expect(index).toMatch(/<script nonce="test-nonce">/);
  });

  it("nonces the ssg bootstrap script", async () => {
    const index = await read("index.html");
    expect(index).toMatch(
      /<script nonce="test-nonce">import\("\/assets\/[^"]+\.js"\)<\/script>/,
    );
  });

  it("renders the csp-nonce meta into head", async () => {
    const index = await read("index.html");
    const head = index.match(/<head>.*<\/head>/s)?.[0];
    expect(head).toContain('<meta property="csp-nonce" nonce="test-nonce"');
  });

  it("keeps flight payload scripts nonced", async () => {
    const index = await read("index.html");
    expect(index).toMatch(
      /<script nonce="test-nonce">\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(/,
    );
  });

  it("nonces Link and inline Script but not plain src Script", async () => {
    const index = await read("index.html");
    const link = index.match(/<link[^>]*data-testid="nonced-link"[^>]*>/)?.[0];
    const inlineScript = index.match(
      /<script[^>]*data-testid="inline-script"[^>]*>/,
    )?.[0];
    const plainScript = index.match(
      /<script[^>]*data-testid="plain-script"[^>]*>/,
    )?.[0];
    expect(link).toContain('nonce="test-nonce"');
    expect(inlineScript).toContain('nonce="test-nonce"');
    expect(plainScript).toBeTruthy();
    expect(plainScript).not.toContain("nonce");
  });

  it("serializes the render context into the flight payload", async () => {
    const rsc = await read("index.rsc");
    expect(rsc).toMatch(/^0:\{"root":.*,"context":/m);
    expect(rsc).toContain('"cspNonce":"test-nonce"');
    expect(rsc).toContain('"base":"/"');
  });
});

describe("rsc ssg build (hash-based csp)", () => {
  let read: (file: string) => Promise<string>;
  let exists: (file: string) => Promise<boolean>;

  function sha256(content: string): string {
    return `'sha256-${createHash("sha256").update(content, "utf8").digest("base64")}'`;
  }

  function inlineScripts(html: string): string[] {
    const out: string[] = [];
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\ssrc=/.test(match[1]!)) {
        out.push(match[2]!);
      }
    }
    return out;
  }

  function cspPolicy(html: string): string {
    return html.match(
      /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/,
    )?.[1]!;
  }

  function policyScriptHashes(policy: string): string[] {
    return policy.match(/'sha256-[^']+'/g) ?? [];
  }

  beforeAll(async () => {
    const distDir = await buildFixture("csp-hash");
    ({ read, exists } = makeReaders(distDir));
  }, 120_000);

  it("injects a Content-Security-Policy meta as the first child of <head>", async () => {
    const index = await read("index.html");
    expect(index).toMatch(
      /<head><meta http-equiv="Content-Security-Policy" content="/,
    );
  });

  it("locks script-src to 'self' plus per-script hashes, no nonce", async () => {
    const index = await read("index.html");
    const policy = cspPolicy(index);
    expect(policy).toMatch(/script-src 'self'( 'sha256-[^']+')+/);
    expect(index).not.toMatch(/ nonce=/);
    expect(index).not.toContain("csp-nonce");
    expect(index).toContain('data-testid="nonce">no-nonce<');
  });

  it("hashes exactly the page's inline scripts, and only inline scripts", async () => {
    const index = await read("index.html");
    const policy = cspPolicy(index);
    const scripts = inlineScripts(index);
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const expected = [...new Set(scripts.map(sha256))].sort();
    const actual = [...new Set(policyScriptHashes(policy))].sort();
    expect(actual).toEqual(expected);
    const plainScript = index.match(
      /<script[^>]*data-testid="plain-script"[^>]*>/,
    )?.[0];
    expect(plainScript).toBeTruthy();
  });

  it("hashes the hydration bootstrap and the flight payload scripts", async () => {
    const index = await read("index.html");
    const policy = cspPolicy(index);
    const bootstrap = index.match(
      /<script>(import\("\/assets\/[^"]+\.js"\))<\/script>/,
    )?.[1];
    expect(bootstrap).toBeTruthy();
    expect(policy).toContain(sha256(bootstrap!));
    const flight = index.match(
      /<script>(\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\([\s\S]*?)<\/script>/,
    )?.[1];
    expect(flight).toBeTruthy();
    expect(policy).toContain(sha256(flight!));
  });

  it("merges custom directives with the generated script-src", async () => {
    const policy = cspPolicy(await read("index.html"));
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("img-src 'self' data:");
  });

  it("emits one html + meta per declared route, including nested paths", async () => {
    expect(await exists("index.html")).toBe(true);
    expect(await exists("blog/post.html")).toBe(true);
    const post = await read("blog/post.html");
    expect(cspPolicy(post)).toMatch(/script-src 'self'( 'sha256-[^']+')+/);
    expect(post).toContain('data-testid="path">/blog/post<');
  });

  it("gives each route its own page-specific policy", async () => {
    const indexPolicy = cspPolicy(await read("index.html"));
    const postPolicy = cspPolicy(await read("blog/post.html"));
    expect(indexPolicy).not.toBe(postPolicy);
    expect(indexPolicy).toContain(sha256("window.__SSG_INLINE = 1;"));
    expect(indexPolicy).not.toContain(sha256("window.__SSG_POST = 2;"));
    expect(postPolicy).toContain(sha256("window.__SSG_POST = 2;"));
    expect(postPolicy).not.toContain(sha256("window.__SSG_INLINE = 1;"));
  });

  it("writes a manifest mapping every route to its policy and hashes", async () => {
    expect(await exists("csp-manifest.json")).toBe(true);
    const manifest = JSON.parse(await read("csp-manifest.json"));
    expect(manifest.version).toBe(1);
    expect(manifest.algorithm).toBe("sha256");
    expect(manifest.pages).toHaveLength(2);

    const root = manifest.pages.find(
      (entry: { route: string }) => entry.route === "/",
    );
    expect(root.file).toBe("index.html");
    expect(root.policy).toBe(cspPolicy(await read("index.html")));
    expect(root.hashes).toContain(
      sha256("window.__SSG_INLINE = 1;").slice(1, -1),
    );

    const post = manifest.pages.find(
      (entry: { route: string }) => entry.route === "/blog/post",
    );
    expect(post.file).toBe("blog/post.html");
    expect(post.policy).toBe(cspPolicy(await read("blog/post.html")));
    expect(
      post.hashes.every((hash: string) => !hash.startsWith("'")),
    ).toBe(true);
  });
});

describe("rsc ssg build (hash-based csp, header delivery)", () => {
  let read: (file: string) => Promise<string>;
  let exists: (file: string) => Promise<boolean>;

  beforeAll(async () => {
    const distDir = await buildFixture("csp-hash-header");
    ({ read, exists } = makeReaders(distDir));
  }, 120_000);

  it("omits the in-page CSP meta when meta:false", async () => {
    const index = await read("index.html");
    expect(index).not.toContain("Content-Security-Policy");
    expect(index).not.toContain("http-equiv");
    expect(index).toContain('data-testid="csp-header"');
  });

  it("writes the manifest at the custom filename with the chosen algorithm", async () => {
    expect(await exists("headers.json")).toBe(true);
    expect(await exists("csp-manifest.json")).toBe(false);
    const manifest = JSON.parse(await read("headers.json"));
    expect(manifest.algorithm).toBe("sha384");
    const page = manifest.pages.find(
      (entry: { route: string }) => entry.route === "/",
    );
    expect(page.file).toBe("index.html");
    expect(page.policy).toMatch(/script-src 'self'( 'sha384-[^']+')+/);
    expect(page.hashes.every((hash: string) => hash.startsWith("sha384-"))).toBe(
      true,
    );
  });
});

describe("rsc ssr (request-time rendering via the built handler)", () => {
  let runtime: {
    handler: (
      request: Request,
      requestOptions?: { cspNonce?: string },
    ) => Promise<Response>;
    dispose: () => Promise<void>;
  };
  let exists: (file: string) => Promise<boolean>;

  beforeAll(async () => {
    const distDir = await buildFixture("ssr");
    ({ exists } = makeReaders(distDir));
    const entryUrl = pathToFileURL(
      path.join(fixturesDir, "ssr", "dist-rsc", "index.js"),
    ).href;
    ({ runtime } = await import(entryUrl));
  }, 120_000);

  afterAll(async () => {
    await runtime.dispose();
  });

  it("skips static html generation with prerender: false", async () => {
    expect(await exists("index.html")).toBe(false);
    expect(await exists("index.rsc")).toBe(false);
    expect(await exists("assets")).toBe(true);
  });

  it("renders html per request, reading request headers in a server component", async () => {
    const response = await runtime.handler(
      new Request("http://localhost/hello", {
        headers: { "x-greeting": "salut" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain('data-testid="greeting">salut<');
    expect(html).toContain('data-testid="path">/hello<');
  });

  it("re-renders dynamic content per request without rebuilding", async () => {
    const response = await runtime.handler(
      new Request("http://localhost/world", {
        headers: { "x-greeting": "hola" },
      }),
    );
    const html = await response.text();
    expect(html).toContain('data-testid="greeting">hola<');
    expect(html).toContain('data-testid="path">/world<');
  });

  it("emits a hydration bootstrap for the client tree", async () => {
    const response = await runtime.handler(new Request("http://localhost/"));
    const html = await response.text();
    expect(html).toMatch(/<script>import\("\/assets\/[^"]+\.js"\)<\/script>/);
  });

  it("serves rsc flight payloads from the same handler", async () => {
    const response = await runtime.handler(
      new Request("http://localhost/world.rsc", {
        headers: { "x-greeting": "ciao" },
      }),
    );
    expect(response.headers.get("content-type")).toContain("text/x-component");
    expect(response.headers.get("vary")).toContain("rsc");
    expect(await response.text()).toContain("ciao");
  });

  it("emits no nonce attributes without a per-request cspNonce", async () => {
    const html = await (
      await runtime.handler(new Request("http://localhost/plain"))
    ).text();
    expect(html).not.toMatch(/ nonce=/);
    expect(html).not.toContain("csp-nonce");
  });

  it("threads a per-request cspNonce through the rendered html", async () => {
    const response = await runtime.handler(
      new Request("http://localhost/secure"),
      { cspNonce: "req-nonce-1" },
    );
    const html = await response.text();
    const head = html.match(/<head>.*<\/head>/s)?.[0];
    expect(head).toContain('<meta property="csp-nonce" nonce="req-nonce-1"');
    expect(html).toMatch(
      /<script nonce="req-nonce-1">import\("\/assets\/[^"]+\.js"\)<\/script>/,
    );
    expect(html).toContain('data-testid="nonce">req-nonce-1<');
    const link = html.match(/<link[^>]*data-testid="nonced-link"[^>]*>/)?.[0];
    const inlineScript = html.match(
      /<script[^>]*data-testid="inline-script"[^>]*>/,
    )?.[0];
    expect(link).toContain('nonce="req-nonce-1"');
    expect(inlineScript).toContain('nonce="req-nonce-1"');
  });

  it("nonces the injected flight payload scripts per request", async () => {
    const html = await (
      await runtime.handler(new Request("http://localhost/flight"), {
        cspNonce: "req-nonce-flight",
      })
    ).text();
    expect(html).toMatch(
      /<script nonce="req-nonce-flight">\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(/,
    );
  });

  it("uses a fresh nonce per request rather than a baked value", async () => {
    const first = await (
      await runtime.handler(new Request("http://localhost/a"), {
        cspNonce: "nonce-a",
      })
    ).text();
    const second = await (
      await runtime.handler(new Request("http://localhost/b"), {
        cspNonce: "nonce-b",
      })
    ).text();
    expect(first).toContain('nonce="nonce-a"');
    expect(first).not.toContain("nonce-b");
    expect(second).toContain('nonce="nonce-b"');
    expect(second).not.toContain("nonce-a");
  });

  it("carries the per-request nonce into the rsc flight payload", async () => {
    const response = await runtime.handler(
      new Request("http://localhost/world.rsc", {
        headers: { "x-greeting": "ciao" },
      }),
      { cspNonce: "rsc-nonce" },
    );
    const rsc = await response.text();
    expect(rsc).toContain('"cspNonce":"rsc-nonce"');
  });

  async function readTotal(): Promise<{ total: number; actionField: string }> {
    const html = await (
      await runtime.handler(new Request("http://localhost/"))
    ).text();
    const total = Number(html.match(/data-testid="total">(\d+)</)?.[1]);
    const actionField = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1] ?? "";
    return { total, actionField };
  }

  it("renders a progressive-enhancement form for a server action", async () => {
    const html = await (
      await runtime.handler(new Request("http://localhost/"))
    ).text();
    const form = html.match(
      /<form[^>]*data-testid="add-form"[\s\S]*?<\/form>/,
    )?.[0];
    expect(form).toBeTruthy();
    expect(form).toContain('method="POST"');
    expect(form).toMatch(/name="\$ACTION_ID_[^"]+#addAction"/);
  });

  it("runs a server action via a no-js form post and re-renders with the result", async () => {
    const { total: before, actionField } = await readTotal();
    expect(actionField).toBeTruthy();

    const formData = new FormData();
    formData.set(actionField, "");
    formData.set("amount", "7");
    const response = await runtime.handler(
      new Request("http://localhost/", { method: "POST", body: formData }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(Number(html.match(/data-testid="total">(\d+)</)?.[1])).toBe(
      before + 7,
    );
  });

  it("persists server-action mutations across subsequent requests", async () => {
    const { total: before, actionField } = await readTotal();

    const formData = new FormData();
    formData.set(actionField, "");
    formData.set("amount", "7");
    await runtime.handler(
      new Request("http://localhost/", { method: "POST", body: formData }),
    );

    const { total: after } = await readTotal();
    expect(after).toBe(before + 7);
  });

  function toActionId(actionField: string, name: string): string {
    expect(actionField).toMatch(/^\$ACTION_ID_.+#addAction$/);
    return actionField
      .slice("$ACTION_ID_".length)
      .replace(/#addAction$/, `#${name}`);
  }

  async function callServerFunction(
    actionField: string,
    name: string,
    args: unknown[],
  ): Promise<Response> {
    return runtime.handler(
      new Request("http://localhost/index.rsc", {
        method: "POST",
        headers: { "rsc-action": toActionId(actionField, name) },
        body: JSON.stringify(args),
      }),
    );
  }

  async function readClientAssets(): Promise<string> {
    const dir = path.join(fixturesDir, "ssr", "dist", "assets");
    const files = (await fs.readdir(dir)).filter((file) =>
      file.endsWith(".js"),
    );
    const contents = await Promise.all(
      files.map((file) => fs.readFile(path.join(dir, file), "utf8")),
    );
    return contents.join("\n");
  }

  it("runs a post-hydration server function and streams its return value with a fresh render", async () => {
    const { total: before, actionField } = await readTotal();
    const response = await callServerFunction(actionField, "addAndReport", [5]);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-component");
    const flight = await response.text();
    expect(flight).toContain('"ok":true');
    expect(flight).toContain(`"data":${before + 5}`);
    expect(flight).toContain(`"total":${before + 5}`);
  });

  it("decodes a structured-object argument through the codec chain", async () => {
    const { total: before, actionField } = await readTotal();
    const response = await callServerFunction(actionField, "addObject", [
      { amount: 5 },
    ]);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-component");
    const flight = await response.text();
    expect(flight).toContain('"ok":true');
    expect(flight).toContain(`"data":${before + 5}`);
  });

  it("persists post-hydration server-function mutations for later document requests", async () => {
    const { total: before, actionField } = await readTotal();
    await (await callServerFunction(actionField, "addAndReport", [4])).text();

    const { total: after } = await readTotal();
    expect(after).toBe(before + 4);
  });

  it("threads a thrown server-function error into a 500 flight result", async () => {
    const { actionField } = await readTotal();
    const response = await callServerFunction(actionField, "failAction", []);

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("text/x-component");
    const flight = await response.text();
    expect(flight).toContain('"ok":false');
  });

  it("compiles client-component server-function imports into server references", async () => {
    const assets = await readClientAssets();
    expect(assets).toContain("createServerReference");
    expect(assets).toContain("#addAndReport");
    expect(assets).toContain("#failAction");
  });
});

describe("rsc ssg dev", () => {
  let server: ViteDevServer;
  let base: string;

  beforeAll(async () => {
    server = await createServer({
      configFile: path.join(fixturesDir, "basic/vite.config.ts"),
      logLevel: "silent",
      server: { port: 0 },
    });
    await server.listen();
    const address = server.httpServer!.address();
    base = `http://localhost:${typeof address === "object" ? address!.port : address}`;
  }, 120_000);

  afterAll(async () => {
    await server.close();
  });

  it("serves ssr html per route", async () => {
    const response = await fetch(base + "/about");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('data-testid="path">/about<');
  });

  it("serves the browser entry module chain", async () => {
    const html = await (await fetch(base + "/")).text();
    const entryUrl = html.match(/import\("([^"]+entry-browser[^"]*)"\)/)?.[1];
    expect(entryUrl).toBeTruthy();

    const entryResponse = await fetch(base + entryUrl!);
    const entryCode = await entryResponse.text();
    expect(entryResponse.status).toBe(200);
    expect(entryCode).not.toContain("Failed to resolve import");

    const innerUrl = entryCode.match(/import\("([^"]*__x00__[^"]*)"\)/)?.[1];
    expect(innerUrl).toBeTruthy();

    const innerResponse = await fetch(base + innerUrl!);
    const innerCode = await innerResponse.text();
    expect(innerResponse.status).toBe(200);
    expect(innerCode).toContain("hydrate");
  });

  it("serves rsc flight payloads for navigate()", async () => {
    const response = await fetch(base + "/profile.rsc");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-component");
  });

  it("resolves relative fetch against the request origin during ssr", async () => {
    const html = await (await fetch(base + "/")).text();
    expect(html).toContain('data-testid="ssr-fetch"');
    expect(html).toMatch(/data-testid="ssr-fetch"[^>]*>pong</);
  });

  it("hot-updates server components without a server full reload", async () => {
    const file = path.join(fixturesDir, "basic/src/index.entry.rsc.tsx");
    const original = await fs.readFile(file, "utf8");

    const events: { env: string; type: string }[] = [];
    const restores: (() => void)[] = [];
    for (const name of ["rsc", "ssr", "client"] as const) {
      const hot = server.environments[name]!.hot;
      const send = hot.send.bind(hot);
      hot.send = ((...args: unknown[]) => {
        const m = args[0] as { type?: string; event?: string };
        if (m && typeof m === "object") {
          const type = m.type === "custom" ? `custom:${m.event}` : m.type!;
          if (type !== "custom:vite:invoke") events.push({ env: name, type });
        }
        return (send as (...a: unknown[]) => unknown)(...args);
      }) as typeof hot.send;
      restores.push(() => {
        hot.send = send;
      });
    }

    try {
      await (await fetch(base + "/index.rsc")).text();

      await fs.writeFile(
        file,
        original.replace('"from-server"', '"from-server-hmr"'),
      );

      await vi.waitFor(
        async () => {
          const flight = await (await fetch(base + "/index.rsc")).text();
          expect(flight).toContain("from-server-hmr");
        },
        { timeout: 10_000, interval: 100 },
      );

      const rscEvents = events.filter((e) => e.env === "rsc");
      expect(rscEvents.length).toBeGreaterThan(0);
      expect(rscEvents.map((e) => e.type)).not.toContain("full-reload");
      expect(events).toContainEqual({
        env: "client",
        type: "custom:rsc:update",
      });
    } finally {
      for (const restore of restores) restore();
      await fs.writeFile(file, original);
      await vi.waitFor(
        async () => {
          const flight = await (await fetch(base + "/index.rsc")).text();
          expect(flight).toContain("from-server");
          expect(flight).not.toContain("from-server-hmr");
        },
        { timeout: 10_000, interval: 100 },
      );
    }
  });
});

describe("rsc ssg dev (server functions)", () => {
  let server: ViteDevServer;
  let base: string;

  beforeAll(async () => {
    server = await createServer({
      configFile: path.join(fixturesDir, "ssr/vite.config.ts"),
      logLevel: "silent",
      server: { port: 0 },
    });
    await server.listen();
    const address = server.httpServer!.address();
    base = `http://localhost:${typeof address === "object" ? address!.port : address}`;
  }, 120_000);

  afterAll(async () => {
    await server.close();
  });

  async function readHome(): Promise<{ total: number; actionId: string }> {
    const html = await (await fetch(base + "/")).text();
    const total = Number(html.match(/data-testid="total">(\d+)</)?.[1]);
    const field = html.match(/name="(\$ACTION_ID_[^"]+#addAction)"/)?.[1] ?? "";
    const actionId = field
      .slice("$ACTION_ID_".length)
      .replace(/#addAction$/, "#addAndReport");
    return { total, actionId };
  }

  it("dispatches a post-hydration server function through the dev handler", async () => {
    const { total: before, actionId } = await readHome();
    expect(actionId).toContain("#addAndReport");

    const response = await fetch(base + "/index.rsc", {
      method: "POST",
      headers: { "rsc-action": actionId },
      body: JSON.stringify([6]),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/x-component");
    const flight = await response.text();
    expect(flight).toContain('"ok":true');
    expect(flight).toContain(`"data":${before + 6}`);
  });
});
