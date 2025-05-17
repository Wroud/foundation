import path from "node:path";
import { readFile } from "node:fs/promises";

export interface ICIConfig {
  repository?: string;
  tagPrefix?: string;
}

const CONFIG_FILE = "wroud.ci.config.js";

export async function loadConfig(): Promise<ICIConfig> {
  try {
    const mod = await import(path.resolve(process.cwd(), CONFIG_FILE));
    return mod.default ?? mod;
  } catch {
    return {};
  }
}

export async function getRepository(): Promise<string | undefined> {
  if (process.env["GITHUB_REPOSITORY"]) {
    return process.env["GITHUB_REPOSITORY"];
  }

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
