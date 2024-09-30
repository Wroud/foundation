import { join, relative, resolve } from "path";
import { getProjectPaths } from "./getProjectPaths.js";
import { readFile, writeFile } from "fs/promises";
import colors from "picocolors";
import commentJson, { assign, stringify } from "comment-json";
import type { TsConfigDef } from "./TsConfigDef.js";
import { existsSync } from "fs";

interface IPackageInfo {
  directory: string;
  tsConfig: TsConfigDef;
  tsConfigPath: string;
  packageInfo: IPackageJson;
}

interface IPackageJson {
  name: string;
  dependencies: Record<string, string>;
}

export async function link(
  options: { immutable?: boolean } = {},
  ...paths: string[]
): Promise<void> {
  const projects = new Map<string, IPackageInfo>();
  const packages = new Map<string, IPackageInfo>();

  for (const path of paths) {
    const { directory, packageJsonPath, tsConfigPath } = getProjectPaths(path);

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

      if (!existsSync(tsConfigPath)) {
        continue;
      }

      const tsConfig = commentJson.parse(
        await readFile(tsConfigPath, "utf-8"),
      ) as TsConfigDef;

      const packageInfo: IPackageInfo = {
        directory,
        tsConfig,
        tsConfigPath,
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
    } catch (error) {
      console.warn(
        `Error reading package.json at ${packageJsonPath}, skipping`,
      );
    }
  }

  let mutated = false;

  for (const [
    ,
    { directory, tsConfig, tsConfigPath, packageInfo: packageJson },
  ] of packages) {
    try {
      let noEmitRefs: string[] = [];
      let notCompositeRefs: string[] = [];
      let notFoundRefs: string[] = [];
      let newRefs: string[] = [];
      let removedRefs: string[] = [];

      const references = (tsConfig?.references || [])
        .map((ref) => ({
          ...ref,
          path: relative(directory, join(directory, ref.path)),
        }))
        .filter((ref) => {
          const projectPath = resolve(directory, ref.path);
          const project = projects.get(projectPath);

          if (project) {
            if (!project.tsConfig.compilerOptions?.composite) {
              notCompositeRefs.push(ref.path);
              return false;
            }
            if (project.tsConfig.compilerOptions.noEmit) {
              noEmitRefs.push(ref.path);
              return false;
            }
            const isRef = project.packageInfo.name in packageJson.dependencies;

            if (!isRef) {
              removedRefs.push(project.packageInfo.name);
            }

            return isRef;
          }

          notFoundRefs.push(ref.path);
          return true;
        });

      for (const dep of Object.keys(packageJson.dependencies)) {
        const project = packages.get(dep);

        if (
          !project ||
          !project.tsConfig.compilerOptions?.composite ||
          project.tsConfig.compilerOptions?.noEmit
        ) {
          continue;
        }

        const ref = relative(directory, project.directory);

        if (!references.find((r) => r.path === ref)) {
          references.push({ path: ref });
          newRefs.push(dep);
        }
      }

      if (
        newRefs.length ||
        notFoundRefs.length ||
        noEmitRefs.length ||
        removedRefs.length ||
        notCompositeRefs.length
      ) {
        console.log(colors.dim(">"), colors.dim(tsConfigPath));
      }

      if (newRefs.length) {
        console.log(colors.greenBright(colors.dim(`Added references:`)));

        for (const ref of newRefs) {
          console.log(colors.greenBright(`  - ${ref}`));
        }
      }

      if (removedRefs.length) {
        console.log(colors.dim(colors.red(`Removed references:`)));

        for (const ref of removedRefs) {
          console.log(colors.dim(`  - ${ref}`));
        }
      }

      if (noEmitRefs.length) {
        console.log(
          colors.dim(colors.red(`Removed references with noEmit set:`)),
        );

        for (const ref of noEmitRefs) {
          console.log(colors.dim(`  - ${ref}`));
        }
      }

      if (notCompositeRefs.length) {
        console.log(
          colors.dim(colors.red(`Removed references with no composite set:`)),
        );

        for (const ref of notCompositeRefs) {
          console.log(colors.dim(`  - ${ref}`));
        }
      }

      if (notFoundRefs.length) {
        console.warn(`References not found:`);

        for (const ref of notFoundRefs) {
          console.log(colors.dim(`  - ${ref}`));
        }
      }

      if (options.immutable) {
        if (
          newRefs.length ||
          noEmitRefs.length ||
          notCompositeRefs.length ||
          removedRefs.length
        ) {
          mutated = true;
        }
        continue;
      }

      assign(tsConfig, {
        references: references.sort((a, b) => a.path.localeCompare(b.path)),
      });

      if (tsConfig.references?.length === 0) {
        delete tsConfig.references;
      }

      await writeFile(tsConfigPath, stringify(tsConfig, null, 2) + "\n");
    } catch (error) {
      console.warn(
        `Error reading tsconfig.json at ${tsConfigPath}, skipping`,
        error,
      );
      continue;
    }
  }

  const linked = packages.size;
  console.log(
    colors.dim(
      colors.greenBright(`Linked ${linked} package${linked === 1 ? "" : "s"}`),
    ),
  );

  if (mutated) {
    console.error("Immutable mode is enabled, please fix the issues manually");
    process.exit(1);
  }
}
