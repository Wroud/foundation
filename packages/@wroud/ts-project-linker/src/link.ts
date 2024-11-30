import { posix } from "path";
import { getProjectPaths } from "./getProjectPaths.js";
import { readFile, writeFile } from "fs/promises";
import colors from "picocolors";
import commentJson, { assign, stringify } from "comment-json";
import { globby } from "globby";
import os from "os";
import {
  TsConfigResolver,
  type TSConfig,
  type TSConfigReference,
} from "./TsConfigResolver.js";
import { existsSync } from "fs";
import { isRootTsConfig } from "./isRootTsConfig.js";
import { toPosixPath } from "./toPosixPath.js";

interface IPackageInfo {
  directory: string;
  tsConfigPaths: string[];
  packageInfo: IPackageJson;
}

interface IPackageJson {
  name: string;
  dependencies: Record<string, string>;
}

interface IRemovedRefInfo {
  name: string;
  noEmit?: boolean;
  notComposite?: boolean;
  notFound?: boolean;
  referencedInRoot?: boolean;
}

export interface ILinkOptions {
  immutable?: boolean;
  verbose?: boolean;
}

export async function link(
  options: ILinkOptions = {},
  ...paths: string[]
): Promise<void> {
  const tsConfigResolver = new TsConfigResolver();
  const projects = new Map<string, IPackageInfo>();
  const packages = new Map<string, IPackageInfo>();

  for (const path of paths) {
    const { directory, packageJsonPath, tsConfigPatterns } =
      getProjectPaths(path);

    try {
      const packageJson = await readFile(packageJsonPath, "utf-8").then(
        (data) => JSON.parse(data),
      );

      if (!packageJson.name) {
        console.warn(
          `No name found in package.json at ${packageJsonPath}, skipping`,
        );
        continue;
      }

      const tsConfigPaths = await globby(tsConfigPatterns);
      if (tsConfigPaths.length === 0) {
        continue;
      }

      const packageInfo: IPackageInfo = {
        directory,
        tsConfigPaths,
        packageInfo: {
          name: packageJson.name,
          dependencies: {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {}),
          },
        },
      };

      packages.set(packageJson.name, packageInfo);
      projects.set(directory, packageInfo);

      for (const tsConfigPath of tsConfigPaths) {
        projects.set(tsConfigPath, packageInfo);
      }
    } catch (error) {
      console.warn(
        `Error reading package.json at ${packageJsonPath}, skipping`,
      );
    }
  }

  let mutated = false;

  for (const [, { directory, tsConfigPaths, packageInfo }] of packages) {
    for (const tsConfigPath of tsConfigPaths) {
      try {
        const resolvedTsConfig = await tsConfigResolver.resolve(tsConfigPath);
        let unknownRefs = new Set<string>();
        let newRefs = new Set<string>();
        let removedRefs: IRemovedRefInfo[] = [];

        const references = new Set<string>();

        for (const ref of resolvedTsConfig.references || []) {
          const projectPath = ref.path.endsWith(".json")
            ? ref.path
            : posix.join(ref.path, "tsconfig.json");
          const project = projects.get(projectPath);

          if (project) {
            const referencedInRoot =
              await tsConfigResolver.isReferencedInRootConfig(projectPath);

            if (referencedInRoot && !isRootTsConfig(tsConfigPath)) {
              removedRefs.push({
                name: posix.relative(directory, ref.path),
                referencedInRoot: true,
              });
              continue;
            }

            const resolvedTsConfig =
              await tsConfigResolver.resolve(projectPath);
            const notComposite = !resolvedTsConfig?.compilerOptions?.composite;
            const noEmit = resolvedTsConfig?.compilerOptions?.noEmit;
            const isDependency =
              project.packageInfo.name in packageInfo.dependencies ||
              project.directory === directory;

            if (!isDependency || notComposite || noEmit) {
              removedRefs.push({
                name: project.packageInfo.name,
                notComposite,
                noEmit,
              });
              continue;
            }
          } else {
            if (existsSync(projectPath)) {
              unknownRefs.add(posix.relative(directory, ref.path));
            } else {
              removedRefs.push({
                name: posix.relative(directory, ref.path),
                notFound: true,
              });
              continue;
            }
          }

          references.add(posix.relative(directory, ref.path));
        }

        for (const dep of Object.keys(packageInfo.dependencies)) {
          const project = packages.get(dep);

          if (!project) {
            continue;
          }

          for (const tsConfigPath of project.tsConfigPaths) {
            const referencedInRoot =
              await tsConfigResolver.isReferencedInRootConfig(tsConfigPath);

            if (referencedInRoot) {
              continue;
            }

            const resolvedTsConfig =
              await tsConfigResolver.resolve(tsConfigPath);
            if (
              !resolvedTsConfig.compilerOptions?.composite ||
              resolvedTsConfig.compilerOptions?.noEmit
            ) {
              continue;
            }

            const ref = posix.relative(
              directory,
              tsConfigPath.replace("tsconfig.json", ""),
            );

            if (!references.has(ref)) {
              references.add(ref);
              newRefs.add(dep);
            }
          }
        }

        if (newRefs.size || unknownRefs.size || removedRefs.length) {
          console.log(
            colorizePackageName(packageInfo.name) + colors.dim(" ·"),
            colors.dim(
              posix.relative(toPosixPath(process.cwd()), tsConfigPath),
            ),
          );
        }

        if (newRefs.size) {
          for (const ref of newRefs) {
            console.log(colors.greenBright(`  + `) + colors.dim(`${ref}`));
          }
        }

        if (removedRefs.length) {
          for (const ref of removedRefs) {
            let reason = "";

            if (options.verbose) {
              if (ref.noEmit) {
                reason += " (noEmit: true)";
              }

              if (ref.notComposite) {
                reason += " (composite: false)";
              }

              if (ref.notFound) {
                reason += " (not found)";
              }

              if (ref.referencedInRoot) {
                reason += " (referenced in root tsconfig.json)";
              }
            }

            console.log(
              colors.redBright(`  - `) + colors.dim(`${ref.name}${reason}`),
            );
          }
        }

        if (unknownRefs.size) {
          for (const ref of unknownRefs) {
            console.log(colors.yellowBright(`  ? `) + colors.dim(`${ref}`));
          }
        }

        if (options.immutable) {
          if (newRefs.size || removedRefs.length) {
            mutated = true;
          }
          continue;
        }

        const tsConfig = await readFile(tsConfigPath, "utf-8").then(
          (data) => commentJson.parse(data) as TSConfig,
        );

        const newReferences: TSConfigReference[] =
          tsConfig.references?.filter((ref) => references.has(ref.path)) || [];

        for (const ref of references) {
          if (newReferences.some((r) => r.path === ref)) {
            continue;
          }
          newReferences.push({
            path: ref,
          });
        }

        assign(tsConfig, {
          references: newReferences.sort((a, b) =>
            a.path.localeCompare(b.path),
          ),
        });

        if (tsConfig.references?.length === 0) {
          delete tsConfig.references;
        }

        await writeFile(
          tsConfigPath,
          normalizeEOL(stringify(tsConfig, null, 2)) + os.EOL,
        );
      } catch (error) {
        console.warn(
          `Error reading tsconfig.json at ${tsConfigPath}, skipping`,
          error,
        );
        continue;
      }
    }
  }

  if (options.verbose) {
    const linked = packages.size;
    console.log(
      colors.dim(
        colors.greenBright(
          `Linked ${linked} package${linked === 1 ? "" : "s"}`,
        ),
      ),
    );
  }

  if (mutated) {
    console.error("Immutable mode is enabled, please fix the issues manually");
    process.exit(1);
  }
}

function colorizePackageName(name: string): string {
  const darkOrange = "\x1b[38;2;200;85;15m";
  const lightOrange = "\x1b[38;2;200;130;90m";
  return name.replace(
    /^(@[^\/]+\/)?(.*?)$/,
    (match, org, name) =>
      `${darkOrange}${org || ""}${lightOrange}${name}${darkOrange}` +
      colors.reset(""),
  );
}

function normalizeEOL(str: string) {
  const eolRegex = /\r\n|\n|\r/g;
  return str.replace(eolRegex, os.EOL);
}
