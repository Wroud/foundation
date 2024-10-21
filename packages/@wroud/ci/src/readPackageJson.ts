import { readFile } from "fs/promises";

interface IPackageJson {
  name: string;
  version?: string;
}

export async function readPackageJson(): Promise<IPackageJson> {
  return await readFile("package.json", "utf8").then((data) =>
    JSON.parse(data),
  );
}
