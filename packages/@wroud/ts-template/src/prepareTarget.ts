import path, { basename, dirname, join, relative, sep } from "path";
import { access, readFile } from "fs/promises";
import picocolors from "picocolors";
import { CliError } from "./CliError.js";
import { confirm, isInteractive } from "./confirm.js";
import type { IParsedPackageName } from "./parsePackageName.js";

export type PackageManifest = Record<string, unknown>;

export interface IPrepareTargetOptions {
  path: string;
  packageName: IParsedPackageName;
  explicitName: boolean;
  args: string[];
  packageJsonChanges: string;
  immutable: boolean;
  force: boolean;
}

interface IWorkspaceRoot {
  path: string;
  manifest: PackageManifest;
  patterns: string[];
}

const SCAFFOLDS_CWD =
  "ts-template always scaffolds the current directory; the [name] argument only sets the package name.";

export async function prepareTarget(
  options: IPrepareTargetOptions,
): Promise<PackageManifest | null> {
  const { path: target, packageJsonChanges, immutable, force } = options;
  const manifest = await readManifest(target);
  const ownPatterns = manifest && getWorkspacePatterns(manifest);

  if (manifest && ownPatterns) {
    throw new CliError(
      [
        `Refusing to scaffold ${target}: it is a workspace root (its package.json declares "workspaces").`,
        SCAFFOLDS_CWD,
        ...howToScaffold(
          { path: target, manifest, patterns: ownPatterns },
          options,
        ),
      ].join("\n"),
    );
  }

  const workspaceRoot = await findWorkspaceRoot(dirname(target));

  if (basename(target).startsWith("@")) {
    throw new CliError(
      [
        `Refusing to scaffold ${target}: "${basename(target)}" is a scope folder, not a package folder.`,
        SCAFFOLDS_CWD,
        ...howToScaffold(workspaceRoot, options),
      ].join("\n"),
    );
  }

  if (workspaceRoot && !isWorkspace(workspaceRoot, target)) {
    throw new CliError(
      [
        `Refusing to scaffold ${target}: it is inside the workspace project ${workspaceRoot.path} but matches none of its "workspaces" globs (${workspaceRoot.patterns.join(", ")}).`,
        SCAFFOLDS_CWD,
        ...howToScaffold(workspaceRoot, options),
      ].join("\n"),
    );
  }

  const existing: string[] = [];
  const changes: string[] = [];
  if (manifest) {
    const name = manifest["name"];
    existing.push(
      typeof name === "string"
        ? `package.json (name "${name}")`
        : "package.json",
    );
    changes.push(packageJsonChanges);
  }
  if (await exists(join(target, "tsconfig.json"))) {
    existing.push("tsconfig.json");
    changes.push("overwrite tsconfig.json");
  }

  if (existing.length === 0 || force) {
    return manifest;
  }

  const summary = [
    `${target} already contains ${existing.join(" and ")}.`,
    `ts-template scaffolds the current directory; continuing will ${changes.join(" and ")}.`,
  ].join("\n");

  if (immutable) {
    console.warn(
      picocolors.yellow(
        `${summary}\nA real run asks for confirmation first, or requires --force when not attached to a terminal.`,
      ),
    );
    return manifest;
  }

  if (isInteractive()) {
    console.warn(picocolors.yellow(summary));
    if (await confirm("Continue?")) {
      return manifest;
    }
    throw new CliError("Aborted, nothing was changed.");
  }

  throw new CliError(
    `${summary}\nNothing was changed. If ${target} is the package you meant to scaffold, re-run with --force.`,
  );
}

function howToScaffold(
  root: IWorkspaceRoot | null,
  { path: target, packageName, explicitName, args }: IPrepareTargetOptions,
): string[] {
  const folder =
    (explicitName && suggestPackageFolder(target, root, packageName)) ||
    "<package-folder>";
  const viaYarn = root !== null && dependsOnTsTemplate(root.manifest);
  const command = [
    viaYarn ? "yarn run -T ts-template" : "ts-template",
    ...args.filter((arg) => !/^(-f|--force(=.*)?)$/.test(arg)),
  ].join(" ");

  return [
    "Create the package folder and run the command from inside it:",
    `  mkdir -p ${folder} && cd ${folder} && ${command}`,
    ...(viaYarn
      ? [
          "-T runs the root workspace's ts-template, so it also works from a folder that already has its own package.json.",
        ]
      : []),
  ];
}

function suggestPackageFolder(
  target: string,
  root: IWorkspaceRoot | null,
  packageName: IParsedPackageName,
): string | null {
  if (packageName.scope && basename(target) === packageName.scope) {
    return join(target, packageName.name);
  }

  if (!root) {
    return null;
  }

  const parents = root.patterns
    .map(normalizePattern)
    .filter((pattern) => pattern.endsWith("/*"))
    .map((pattern) => pattern.slice(0, -2))
    .filter((parent) => !/[*?{}[\]!]/.test(parent));
  const parent =
    parents.find(
      (parent) => path.posix.basename(parent) === packageName.scope,
    ) ?? parents.find((parent) => !path.posix.basename(parent).startsWith("@"));

  return parent ? join(root.path, parent, packageName.name) : null;
}

function isWorkspace(root: IWorkspaceRoot, target: string): boolean {
  if (typeof path.matchesGlob !== "function") {
    return true;
  }

  const relativePath = relative(root.path, target).split(sep).join("/");
  const matches = (pattern: string) =>
    path.matchesGlob(relativePath, normalizePattern(pattern));

  return (
    root.patterns.some(
      (pattern) => !pattern.startsWith("!") && matches(pattern),
    ) &&
    !root.patterns.some(
      (pattern) => pattern.startsWith("!") && matches(pattern.slice(1)),
    )
  );
}

function normalizePattern(pattern: string): string {
  return pattern.replace(/^\.\//, "").replace(/\/+$/, "");
}

async function findWorkspaceRoot(
  start: string,
): Promise<IWorkspaceRoot | null> {
  for (let dir = start; ; dir = dirname(dir)) {
    const manifest = await readManifest(dir).catch(() => null);
    const patterns = manifest && getWorkspacePatterns(manifest);
    if (manifest && patterns) {
      return { path: dir, manifest, patterns };
    }
    if (dirname(dir) === dir) {
      return null;
    }
  }
}

function getWorkspacePatterns(manifest: PackageManifest): string[] | null {
  const workspaces = manifest["workspaces"];
  const patterns = isRecord(workspaces) ? workspaces["packages"] : workspaces;

  return Array.isArray(patterns)
    ? patterns.filter((pattern) => typeof pattern === "string")
    : null;
}

function dependsOnTsTemplate(manifest: PackageManifest): boolean {
  return ["dependencies", "devDependencies"].some((field) => {
    const dependencies = manifest[field];
    return isRecord(dependencies) && "@wroud/ts-template" in dependencies;
  });
}

async function readManifest(dir: string): Promise<PackageManifest | null> {
  const file = join(dir, "package.json");
  const content = await readFile(file, "utf-8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    },
  );

  if (content === null) {
    return null;
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(content);
  } catch {
    manifest = null;
  }

  if (!isRecord(manifest)) {
    throw new CliError(
      `${file} is not a valid package.json; fix or remove it and re-run.`,
    );
  }

  return manifest;
}

async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
