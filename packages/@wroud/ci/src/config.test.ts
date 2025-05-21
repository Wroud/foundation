import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fs, vol } from "memfs";
import path from "path";

vi.mock("fs", () => fs);
vi.mock("fs/promises", () => fs.promises);

let configMock = {};

vi.doMock("/project/wroud.ci.config.js", () => {
  return {
    get default() {
      return configMock;
    },
  };
});

const CWD = path.normalize("/project");
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vol.reset();
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(CWD);
  configMock = {};
  delete process.env["npm_config_user_agent"];
  delete process.env["GITHUB_REPOSITORY"];
  delete process.env["TAG_PREFIX"];
  vi.resetModules();
});

afterEach(() => {
  vol.reset();
  cwdSpy.mockRestore();
  delete process.env["npm_config_user_agent"];
  delete process.env["GITHUB_REPOSITORY"];
  delete process.env["TAG_PREFIX"];
  vi.resetModules();
  vi.clearAllMocks();
  configMock = {};
});

describe.sequential("config", () => {
  describe("loadConfig", () => {
    it("should load config from config file", async () => {
      configMock = {
        repository: "user/repo",
        tagPrefix: "v",
        packageManager: "yarn",
      };
      const { loadConfig } = await import("./config.js");
      const config = await loadConfig();
      expect(config).toEqual(configMock);
    });

    it("should return empty object when config file is not found", async () => {
      // Empty configMock by default
      const { loadConfig } = await import("./config.js");
      const config = await loadConfig();
      expect(config).toEqual({});
    });

    it("should use cache on subsequent calls", async () => {
      configMock = { repository: "user/repo" };
      const { loadConfig } = await import("./config.js");
      const config1 = await loadConfig();

      // Change the mock, but the cached value should be returned
      configMock = { repository: "different/repo" };
      const config2 = await loadConfig();

      expect(config1).toEqual(config2);
      expect(config2.repository).toBe("user/repo");
    });
  });

  describe("getRepository", () => {
    it("should get repository from env", async () => {
      process.env["GITHUB_REPOSITORY"] = "env/repo";
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBe("env/repo");
    });

    it("should get repository from config", async () => {
      configMock = { repository: "config/repo" };
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBe("config/repo");
    });

    it("should get repository from package.json string", async () => {
      vol.fromJSON(
        {
          "package.json": JSON.stringify({ repository: "github.com/pkg/repo" }),
        },
        CWD,
      );
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBe("pkg/repo");
    });

    it("should get repository from package.json url", async () => {
      vol.fromJSON(
        {
          "package.json": JSON.stringify({
            repository: {
              url: "https://github.com/pkg/repo-url.git",
            },
          }),
        },
        CWD,
      );
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBe("pkg/repo-url");
    });

    it("should handle SSH repository URLs", async () => {
      vol.fromJSON(
        {
          "package.json": JSON.stringify({
            repository: "git@github.com:pkg/ssh-repo.git",
          }),
        },
        CWD,
      );
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBe("pkg/ssh-repo");
    });

    it("should return undefined when repository is not found", async () => {
      vol.fromJSON({ "package.json": JSON.stringify({ name: "test" }) }, CWD);
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBeUndefined();
    });

    it("should handle invalid repository format", async () => {
      vol.fromJSON(
        { "package.json": JSON.stringify({ repository: "invalid-format" }) },
        CWD,
      );
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBeUndefined();
    });

    it("should handle file read errors", async () => {
      // No package.json file
      const { getRepository } = await import("./config.js");
      expect(await getRepository()).toBeUndefined();
    });
  });

  describe("getTagPrefix", () => {
    it("should get tag prefix from env", async () => {
      process.env["TAG_PREFIX"] = "v";
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBe("v");
    });

    it("should get tag prefix from config", async () => {
      configMock = { tagPrefix: "vv" };
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBe("vv");
    });

    it("should get tag prefix from package.json", async () => {
      vol.fromJSON({ "package.json": JSON.stringify({ tagPrefix: "v" }) }, CWD);
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBe("v");
    });

    it("should get tag prefix from package.json release config", async () => {
      vol.fromJSON(
        { "package.json": JSON.stringify({ release: { tagPrefix: "rel-" } }) },
        CWD,
      );
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBe("rel-");
    });

    it("should return undefined when tag prefix is not found", async () => {
      vol.fromJSON({ "package.json": JSON.stringify({ name: "test" }) }, CWD);
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBeUndefined();
    });

    it("should handle file read errors", async () => {
      // No package.json file
      const { getTagPrefix } = await import("./config.js");
      expect(await getTagPrefix()).toBeUndefined();
    });
  });

  describe("getPackageManager", () => {
    it("should get package manager from config", async () => {
      configMock = { packageManager: "yarn" };
      const { getPackageManager } = await import("./config.js");
      expect(await getPackageManager()).toBe("yarn");

      // Reset and test npm
      vi.resetModules();
      configMock = { packageManager: "npm" };
      const { getPackageManager: getPackageManagerNpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerNpm()).toBe("npm");

      // Reset and test pnpm
      vi.resetModules();
      configMock = { packageManager: "pnpm" };
      const { getPackageManager: getPackageManagerPnpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerPnpm()).toBe("pnpm");
    });

    it("should get package manager from package.json", async () => {
      vol.fromJSON(
        { "package.json": JSON.stringify({ packageManager: "yarn@3.0.0" }) },
        CWD,
      );
      const { getPackageManager } = await import("./config.js");
      expect(await getPackageManager()).toBe("yarn");

      // Reset and test npm
      vi.resetModules();
      vol.fromJSON(
        { "package.json": JSON.stringify({ packageManager: "npm@8.1.0" }) },
        CWD,
      );
      const { getPackageManager: getPackageManagerNpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerNpm()).toBe("npm");

      // Reset and test pnpm
      vi.resetModules();
      vol.fromJSON(
        { "package.json": JSON.stringify({ packageManager: "pnpm@6.0.0" }) },
        CWD,
      );
      const { getPackageManager: getPackageManagerPnpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerPnpm()).toBe("pnpm");
    });

    it("should get package manager from user agent", async () => {
      process.env["npm_config_user_agent"] =
        "yarn/1.22.17 npm/? node/v16.13.0 darwin x64";
      const { getPackageManager } = await import("./config.js");
      expect(await getPackageManager()).toBe("yarn");

      // Reset and test npm
      vi.resetModules();
      process.env["npm_config_user_agent"] =
        "npm/8.1.0 node/v16.13.0 darwin x64";
      const { getPackageManager: getPackageManagerNpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerNpm()).toBe("npm");

      // Reset and test pnpm
      vi.resetModules();
      process.env["npm_config_user_agent"] =
        "pnpm/6.24.2 npm/? node/v16.13.0 darwin x64";
      const { getPackageManager: getPackageManagerPnpm } = await import(
        "./config.js"
      );
      expect(await getPackageManagerPnpm()).toBe("pnpm");
    });

    it("should default to yarn when no package manager is specified", async () => {
      // No config, no package.json, no user agent
      const { getPackageManager } = await import("./config.js");
      expect(await getPackageManager()).toBe("yarn");
    });

    it("should handle file read errors", async () => {
      // No package.json file
      const { getPackageManager } = await import("./config.js");
      expect(await getPackageManager()).toBe("yarn");
    });
  });
});
