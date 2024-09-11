import { beforeEach, describe, it, vi } from "vitest";
import jscodeshift, { type API } from "jscodeshift";
import transform from "./index.js";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { unlinkSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { IMigrationOptions } from "./IMigrationOptions.js";

const buildApi = (parser: string | undefined): API => ({
  j: parser ? jscodeshift.withParser(parser) : jscodeshift,
  jscodeshift: parser ? jscodeshift.withParser(parser) : jscodeshift,
  stats: () => {
    console.error(
      "The stats function was called, which is not supported on purpose",
    );
  },
  report: () => {
    console.error(
      "The report function was called, which is not supported on purpose",
    );
  },
});

const defaultPackageJson = JSON.stringify({
  name: "di-tools-codemod",
  version: "0.0.0",
  description: "",
  main: "lib/index.js",
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
  },
  keywords: [],
});

const VIRTUAL_PROJECT_ROOT_PATH = "/di-tools-codemod";
const VIRTUAL_PROJECT_SRC_PATH = `${VIRTUAL_PROJECT_ROOT_PATH}/src`;
const VIRTUAL_PROJECT_MODULE_PATH = `${VIRTUAL_PROJECT_SRC_PATH}/module.ts`;
const VIRTUAL_PROJECT_PACKAGE_JSON_PATH = `${VIRTUAL_PROJECT_ROOT_PATH}/package.json`;

vi.mock("node:fs", () => {
  const cache = new Map();
  const module = {
    existsSync: vi.fn((path) => cache.has(path)),
    writeFileSync: vi.fn((path, data) => cache.set(path, data)),
    readFileSync: vi.fn((path) => cache.get(path)),
    unlinkSync: vi.fn((path) => cache.delete(path)),
  };
  return {
    ...module,
    default: module,
  };
});

beforeEach(() => {
  unlinkSync(VIRTUAL_PROJECT_MODULE_PATH);
  writeFileSync(VIRTUAL_PROJECT_PACKAGE_JSON_PATH, defaultPackageJson, "utf8");
  vi.clearAllMocks();
});

describe("test", () => {
  it("test #1", async () => {
    await testFixture(["fixture1"]);
  });
  it("test #2", async () => {
    await testFixture(["fixture2"]);
  });
  it("test #3", async () => {
    await testFixture(["fixture3"]);
  });
  it("test #4", async () => {
    await testFixture(["fixture4"]);
  });
  it("custom reexport", async () => {
    await testFixture(["custom_reexport"], {
      supportedPackages: [
        {
          name: "@custom/di",
          replace: "@custom/di",
          injectableDecorator: "injectable",
          injectDecorator: "inject",
          multiInjectDecorator: "multiInject",
        },
      ],
      generateModule: false,
    });
  });
  it("multiple files", async () => {
    await testFixture([
      "multipleFiles/fixture1",
      "multipleFiles/fixture2",
      "multipleFiles/fixture3",
      "multipleFiles/fixture4",
    ]);
  });
  it("esm", async () => {
    await testFixture(["esm"], {
      transformer: {
        esm: true,
      },
    });
  });
  it("copyright", async () => {
    await testFixture(["copyright"], {
      transformer: {
        esm: true,
        copyright: "\n * Copyright\n ",
      },
    });
  });
});

async function testFixture(names: string[], options?: IMigrationOptions) {
  const fixturesFolder = join(__dirname, "..", "..", "__testfixtures__");
  for (const name of names) {
    const INPUT = await readFile(
      join(fixturesFolder, `${name}.input.ts`),
      "utf-8",
    );
    const OUTPUT = await readFile(
      join(fixturesFolder, `${name}.output.ts`),
      "utf-8",
    );

    const moduleFixturePath = join(fixturesFolder, `${name}.module.output.ts`);
    let OUTPUT_MODULE = undefined;
    try {
      OUTPUT_MODULE = await readFile(moduleFixturePath, "utf-8");
    } catch {}

    const packageJSONFixturePath = join(
      fixturesFolder,
      `${name}.package_json.output.ts`,
    );
    let OUTPUT_PACKAGE_JSON = undefined;
    try {
      OUTPUT_PACKAGE_JSON = await readFile(packageJSONFixturePath, "utf-8");
    } catch {}

    const actualOutput = transform(
      {
        path: `${VIRTUAL_PROJECT_SRC_PATH}/${name}.ts`,
        source: INPUT,
      },
      buildApi("tsx"),
      options,
    );

    assert.deepEqual(
      actualOutput?.replace(/W/gm, ""),
      OUTPUT.replace(/W/gm, ""),
    );
    assert.deepEqual(
      readFileSync(VIRTUAL_PROJECT_MODULE_PATH, "utf8")?.replace(/W/gm, ""),
      OUTPUT_MODULE?.replace(/W/gm, ""),
    );
    assert.deepEqual(
      readFileSync(VIRTUAL_PROJECT_PACKAGE_JSON_PATH, "utf8")?.replace(
        /W/gm,
        "",
      ),
      (OUTPUT_PACKAGE_JSON || defaultPackageJson)?.replace(/W/gm, ""),
    );
  }
}
