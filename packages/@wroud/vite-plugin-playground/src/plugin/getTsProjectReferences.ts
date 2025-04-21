import ts from "typescript";

export function getTsProjectReferences(dir: string): string[] {
  const configPath = ts.findConfigFile(dir, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    return [];
  }

  const config = ts.readConfigFile(configPath, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, dir);
  return parsed.projectReferences?.map((ref) => ref.path) ?? [];
}
