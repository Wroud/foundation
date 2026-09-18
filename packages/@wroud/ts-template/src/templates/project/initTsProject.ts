import { join } from "path";
import { writeFile, mkdir, readFile } from "fs/promises";
import { getTsConfigTemplate } from "./getTsConfigTemplate.js";
import picocolors from "picocolors";
import type { IParsedPackageName } from "../../parsePackageName.js";
import { getTsWithVersion } from "../../getTsWithVersion.js";
import type { PackageManifest } from "../../prepareTarget.js";
import { runYarn } from "../../runYarn.js";

export interface IInitTsProjectOptions {
  path: string;
  packageName: IParsedPackageName;
  tsconfig: IParsedPackageName;
  manifest: PackageManifest | null;
  target?: string;
  immutable: boolean;
  verbose: boolean;
}
export async function initTsProject({
  path,
  packageName,
  tsconfig,
  manifest,
  target,
  immutable,
  verbose,
}: IInitTsProjectOptions): Promise<void> {
  if (immutable) {
    if (manifest) {
      console.log(
        "update:",
        join(path, "package.json"),
        "name:",
        packageName.packageName,
      );
    } else {
      console.log("run:", "yarn init -n", packageName.packageName);
    }
    console.log(
      "run:",
      "yarn add -D",
      tsconfig.packageName,
      getTsWithVersion(),
      "rimraf",
    );
    console.log('make dir "src"');
  } else {
    if (!manifest) {
      await runYarn(["init", "-n", packageName.packageName]);
    }
    await runYarn([
      "add",
      "-D",
      tsconfig.packageName,
      getTsWithVersion(),
      "rimraf",
    ]);
    await mkdir(join(path, "src"), { recursive: true });

    let {
      name,
      description,
      version,
      license,
      author,
      homepage,
      repository,
      type,
      sideEffects = [],
      exports = {},
      scripts = {},
      ...rest
    } = await readFile(join(path, "package.json"), "utf-8").then(JSON.parse);

    const packageJson = {
      name: packageName.packageName,
      description,
      version,
      license,
      author,
      homepage,
      repository,
      type: "module",
      sideEffects: [...sideEffects],
      exports: {
        ".": "./lib/index.js",
        "./*": "./lib/*.js",
        ...exports,
      },
      scripts: {
        ...scripts,
        clear: "rimraf lib",
      },
      files: [
        "package.json",
        "LICENSE",
        "README.md",
        "CHANGELOG.md",
        "lib",
        "!lib/**/*.d.ts.map",
        "!lib/**/*.test.js",
        "!lib/**/*.test.d.ts",
        "!lib/**/*.test.d.ts.map",
        "!lib/**/*.test.js.map",
        "!lib/tests",
        "!.tsbuildinfo",
      ],
      ...rest,
    };

    await writeFile(
      join(path, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );

    console.log(
      "project initialized:",
      picocolors.green(packageName.packageName),
      "in",
      path,
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
