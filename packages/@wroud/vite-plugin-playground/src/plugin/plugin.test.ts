import { describe, it, expect, beforeAll } from "vitest";
import { createBuilder } from "vite";
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
