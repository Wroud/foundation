import { readFile } from "fs/promises";
import commentJson, { assign } from "comment-json";
import { join } from "path";
import { isRootTsConfig } from "./isRootTsConfig.js";

export interface TSConfigReference {
  path: string;
}

export interface TSConfig {
  extends?: string | string[];
  compilerOptions?: {
    noEmit?: boolean;
    composite?: boolean;
  };
  references?: TSConfigReference[];
}

export class TsConfigResolver {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  async resolve(path: string): Promise<TSConfig> {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const config = await readFile(path, "utf-8").then(
      (data) => commentJson.parse(data) as TSConfig,
    );

    for (const ref of config.references || []) {
      assign(ref, {
        path: join(path, "..", ref.path),
      });
    }

    this.cache.set(path, config);
    return config;
  }

  async isReferencedInRootConfig(path: string): Promise<boolean> {
    if (isRootTsConfig(path)) {
      return false;
    }

    const rootTsConfig = await this.resolve(join(path, "..", "tsconfig.json"));

    return rootTsConfig.references?.some((ref) => ref.path === path) || false;
  }
}
