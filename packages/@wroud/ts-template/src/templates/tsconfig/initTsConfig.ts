import { execa } from "execa";
import { join } from "path";
import { writeFile } from "fs/promises";
import { getTsConfigTemplate } from "./getTsConfigTemplate.js";
import type { IParsedPackageName } from "../../pasrsePackageName.js";

export interface IInitTsConfigOptions {
  path: string;
  packageName: IParsedPackageName;
  target: string;
  immutable: boolean;
  verbose: boolean;
}
export async function initTsConfig({
  path,
  packageName,
  target,
  immutable,
  verbose,
}: IInitTsConfigOptions): Promise<void> {
  if (immutable) {
    console.log("run:", "yarn init -n", packageName.packageName);
  } else {
    await execa("yarn", ["init", "-n", packageName.packageName]);
  }

  const tsConfigContent = getTsConfigTemplate({ target });
  if (immutable) {
    console.log("writeFile:", join(path, "tsconfig.json"), tsConfigContent);
  } else {
    await writeFile(join(path, "tsconfig.json"), tsConfigContent);
  }
}
