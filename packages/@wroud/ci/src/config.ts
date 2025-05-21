import path from "node:path";
import { readFile } from "node:fs/promises";

export interface ICIConfig {
  repository?: string;
  tagPrefix?: string;
  packageManager?: "yarn" | "npm" | "pnpm";
}

const CONFIG_FILE = "wroud.ci.config.js";
let configCache: ICIConfig | undefined;

export async function loadConfig(): Promise<ICIConfig> {
  if (configCache === undefined) {
    try {
      const mod = await import(path.resolve(process.cwd(), CONFIG_FILE));
      configCache = mod.default ?? mod;
    } catch {
      configCache = {};
    }
  }

  return configCache!;
}

export async function getRepository(): Promise<string | undefined> {
  const config = await loadConfig();
  if (config.repository) {
    return config.repository;
  }

  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkgCode = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgCode);
    const repo =
      typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
    if (typeof repo === "string") {
      const match = repo.match(/github.com[/:](.+?)(?:\.git)?$/i);
      if (match) {
        return match[1];
      }
    }
  } catch {}

  if (process.env["GITHUB_REPOSITORY"]) {
    return process.env["GITHUB_REPOSITORY"];
  }

  return undefined;
}

export async function getTagPrefix(): Promise<string | undefined> {
  if (process.env["TAG_PREFIX"]) {
    return process.env["TAG_PREFIX"];
  }

  const config = await loadConfig();
  if (config.tagPrefix) {
    return config.tagPrefix;
  }

  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkgCode = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgCode);
    if (typeof pkg.tagPrefix === "string") {
      return pkg.tagPrefix;
    }
    if (typeof pkg.release?.tagPrefix === "string") {
      return pkg.release.tagPrefix;
    }
  } catch {}

  return undefined;
}

export async function getPackageManager(): Promise<
  "yarn" | "npm" | "pnpm" | undefined
> {
  const config = await loadConfig();
  if (
    config.packageManager === "yarn" ||
    config.packageManager === "npm" ||
    config.packageManager === "pnpm"
  ) {
    return config.packageManager;
  }

  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkgCode = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgCode);
    const pm = pkg.packageManager?.split("@")[0];
    if (pm === "yarn" || pm === "npm" || pm === "pnpm") {
      return pm;
    }
  } catch {}

  const userAgent = process.env["npm_config_user_agent"];
  if (userAgent) {
    if (userAgent.startsWith("yarn")) {
      return "yarn";
    }
    if (userAgent.startsWith("pnpm")) {
      return "pnpm";
    }
    if (userAgent.startsWith("npm")) {
      return "npm";
    }
  }

  return "yarn";
}
