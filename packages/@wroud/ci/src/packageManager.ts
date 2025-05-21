import { execa } from "execa";
import semver from "semver";
import { readFileSync, writeFileSync } from "fs";
import { readPackageJson } from "./readPackageJson.js";
import { getPackageManager } from "./config.js";

export type PackageManager = "yarn" | "npm" | "pnpm";

export async function detectPackageManager(): Promise<PackageManager> {
  const configPm = await getPackageManager();
  if (configPm) {
    return configPm;
  }

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

  try {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const pm = pkg.packageManager?.split("@")[0];
    if (pm === "yarn" || pm === "npm" || pm === "pnpm") {
      return pm;
    }
  } catch {}

  return "yarn";
}

export async function bumpPackageVersion(bump: semver.ReleaseType): Promise<string> {
  const pm = await detectPackageManager();

  if (pm === "yarn" || pm === "npm") {
    await execa(pm, ["version", bump], { stdout: "inherit" });
    const { version } = await readPackageJson();
    if (!version) {
      throw new Error("Version not found in package.json");
    }
    return version;
  }

  // pnpm: update package.json manually
  const pkgPath = "package.json";
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (!pkg.version) {
    throw new Error("Version not found in package.json");
  }
  const newVersion = semver.inc(pkg.version, bump);
  if (!newVersion) {
    throw new Error(`Invalid bump type ${bump}`);
  }
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  return newVersion;
}
