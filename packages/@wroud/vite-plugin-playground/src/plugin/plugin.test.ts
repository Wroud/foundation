import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createBuilder, createServer, type ViteDevServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

const fixtureDir = fileURLToPath(
  new URL("../../test-fixtures/basic", import.meta.url),
);
const distDir = path.join(fixtureDir, "dist");

async function buildFixture() {
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
}

const read = (file: string) => fs.readFile(path.join(distDir, file), "utf8");
const exists = (file: string) =>
  fs.access(path.join(distDir, file)).then(
    () => true,
    () => false,
  );

describe("playground ssg build", () => {
  beforeAll(buildFixture, 120_000);

  it("keeps the user's own app at the site root", async () => {
    const site = await read("index.html");
    expect(site).toContain('data-testid="site"');
    expect(site).toContain('data-testid="base">/<');
    expect(site).not.toContain("<title>Playground</title>");
  });

  it("prerenders the playground home and components pages", async () => {
    expect(await exists("playground/index.html")).toBe(true);
    expect(await exists("playground/components/index.html")).toBe(true);
    expect(await read("playground/index.html")).toContain(
      "<title>Playground</title>",
    );
  });

  it("prerenders a story, isolated and preview page per story", async () => {
    expect(await exists("playground/story/Button/Default/index.html")).toBe(
      true,
    );
    expect(await exists("playground/isolated/Button/Default/index.html")).toBe(
      true,
    );
    expect(await exists("playground/preview/Button/Default/index.html")).toBe(
      false,
    );
    expect(await exists("playground/preview/Button/Preview/index.html")).toBe(
      true,
    );
  });

  it("renders story components inside isolated pages", async () => {
    expect(
      await read("playground/isolated/Button/Default/index.html"),
    ).toContain('data-testid="default-button"');
  });

  it("renders isolated stories with initial props from the schema", async () => {
    const html = await read("playground/isolated/Button/Controlled/index.html");
    expect(html).toMatch(
      /<button data-testid="controlled-button" data-variant="primary" style="font-size:16px">Controlled label<\/button>/,
    );
  });

  it("renders a controls panel for stories with a props schema", async () => {
    const html = await read("playground/story/Button/Controlled/index.html");
    expect(html).toContain('aria-label="Story controls"');
    expect(html).toContain("Button text");
    expect(html).toContain(">disabled</option>");

    const plain = await read("playground/story/Button/Default/index.html");
    expect(plain).toMatch(/aria-label="Story controls"[^>]*><\/aside>/);
  });

  it("turns markdown docs into story pages", async () => {
    expect(await read("playground/story/Button/Guide/index.html")).toContain(
      "Button guide",
    );
  });

  it("emits a flight payload next to each page", async () => {
    expect(await exists("playground/story/Button/Default/index.rsc")).toBe(
      true,
    );
  });

  it("keeps inlined asset urls untouched", async () => {
    const html = await read("playground/index.html");
    expect(html).toMatch(/<link[^>]*href="data:image\/svg\+xml/);
    expect(html).not.toContain('href="/data:');
  });
});

describe("playground dev server", () => {
  const added = path.join(fixtureDir, "src/Added.stories.tsx");
  let server: ViteDevServer;

  beforeAll(async () => {
    await fs.rm(added, { force: true });
    server = await createServer({
      configFile: path.join(fixtureDir, "vite.config.ts"),
      logLevel: "silent",
      server: { middlewareMode: true },
    });
  }, 120_000);

  afterAll(async () => {
    await fs.rm(added, { force: true });
    await server?.close();
  });

  const entry = async () =>
    (await server.environments.client.transformRequest(
      "virtual:@wroud/vite-plugin-playground",
    ))!.code;

  it("picks up story files added and removed while running", async () => {
    expect(await entry()).not.toContain("Added.stories");

    await fs.writeFile(
      added,
      `import { describe, story } from "@wroud/playground-react";
describe("Added", () => { story("New", () => <i>new</i>); });
`,
    );
    await vi.waitFor(
      async () => expect(await entry()).toContain("/src/Added.stories.tsx"),
      { timeout: 10_000, interval: 200 },
    );

    await fs.rm(added);
    await vi.waitFor(
      async () => expect(await entry()).not.toContain("Added.stories"),
      { timeout: 10_000, interval: 200 },
    );
  }, 30_000);
});

describe("playground entry globs", () => {
  it("honors negated story patterns", async () => {
    const server = await createServer({
      configFile: path.join(fixtureDir, "vite.config.negated.ts"),
      logLevel: "silent",
      server: { middlewareMode: true },
    });
    try {
      const result = await server.environments.client.transformRequest(
        "virtual:@wroud/vite-plugin-playground",
      );
      expect(result?.code.match(/(?<=from ")\/src\/[^"?]+/g)).toEqual([
        "/src/Guide.stories.md",
      ]);
    } finally {
      await server.close();
    }
  }, 30_000);
});
