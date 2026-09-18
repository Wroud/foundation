import { join } from "path";
import { writeFile } from "fs/promises";
import { getTsConfigTemplate } from "./getTsConfigTemplate.js";
import type { IParsedPackageName } from "../../parsePackageName.js";
import type { PackageManifest } from "../../prepareTarget.js";
import { runYarn } from "../../runYarn.js";

export interface IInitTsConfigOptions {
  path: string;
  packageName: IParsedPackageName;
  manifest: PackageManifest | null;
  target: string;
  immutable: boolean;
  verbose: boolean;
}
export async function initTsConfig({
  path,
  packageName,
  manifest,
  target,
  immutable,
  verbose,
}: IInitTsConfigOptions): Promise<void> {
  const manifestPath = join(path, "package.json");

  if (immutable) {
    if (manifest) {
      console.log("update:", manifestPath, "name:", packageName.packageName);
    } else {
      console.log("run:", "yarn init -n", packageName.packageName);
    }
  } else if (manifest) {
    await writeFile(
      manifestPath,
      JSON.stringify({ ...manifest, name: packageName.packageName }, null, 2) +
        "\n",
    );
  } else {
    await runYarn(["init", "-n", packageName.packageName]);
  }

  const tsConfigContent = getTsConfigTemplate({ target });
  if (immutable) {
    console.log("writeFile:", join(path, "tsconfig.json"), tsConfigContent);
  } else {
    await writeFile(join(path, "tsconfig.json"), tsConfigContent);
  }
}
