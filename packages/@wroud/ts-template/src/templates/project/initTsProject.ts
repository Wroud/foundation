import { execa } from "execa";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { getTsConfigTemplate } from "./getTsConfigTemplate.js";
import picocolors from "picocolors";
import type { IParsedPackageName } from "../../pasrsePackageName.js";
import { getTsWithVersion } from "../../getTsWithVersion.js";

export interface IInitTsProjectOptions {
  path: string;
  packageName: IParsedPackageName;
  tsconfig: IParsedPackageName;
  target?: string;
  immutable: boolean;
  verbose: boolean;
}
export async function initTsProject({
  path,
  packageName,
  tsconfig,
  target,
  immutable,
  verbose,
}: IInitTsProjectOptions): Promise<void> {
  if (immutable) {
    console.log("run:", "yarn init -n", packageName.packageName);
    console.log(
      "run:",
      "yarn add -D",
      tsconfig.packageName,
      getTsWithVersion(),
    );
    console.log('make dir "src"');
  } else {
    await execa("yarn", ["init", "-n", packageName.packageName]);
    await execa("yarn", [
      "add",
      "-D",
      tsconfig.packageName,
      getTsWithVersion(),
    ]);
    await mkdir("src");
    console.log(
      "project initialized:",
      picocolors.green(packageName.packageName),
    );
  }

  const tsConfigContent = getTsConfigTemplate({
    parentConfig: `${tsconfig.packageName}/tsconfig.json`,
    target,
  });

  if (immutable) {
    console.log("writeFile:", join(path, "tsconfig.json"), tsConfigContent);
  } else {
    await writeFile(join(path, "tsconfig.json"), tsConfigContent);
    console.log("tsconfig.json created:", picocolors.green("tsconfig.json"));
  }
}
