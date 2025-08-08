///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, bench, expect } from "vitest";
import { getLibraries } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import { buildLinearTriples } from "./buildLinearTriples.js";
import { registerAll } from "./registerAll.js";
import { buildDeepChain } from "./buildDeepChain.js";
import type { IEntry } from "./IEntry.js";

// -------------------- tuning --------------------

const SIZES = [8, 32, 64];
const DEEP_CHAIN = 16;

// tinybench options are inherited by vitest bench
const COMMON_OPTS: Parameters<typeof bench>[2] = {
  time: 500,
  warmupTime: 200,
  warmupIterations: 32,
  throws: true,
  setup: () => {
    global.gc?.();
  },
  teardown: () => {
    global.gc?.();
  },
};

// -------------------- main --------------------

await import("@wroud/di-tools-benchmark/modern/@wroud/register");
await import("@wroud/di-tools-benchmark/modern/needle-di/register");
await import("@wroud/di-tools-benchmark/legacy/tsyringe/register");
await import("@wroud/di-tools-benchmark/modern/brandi/register");
await import("@wroud/di-tools-benchmark/legacy/inversify/register");
await import("@wroud/di-tools-benchmark/legacy/inversify7/register");

for (const n of SIZES) {
  describe(`create: tokens & service descriptors x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      bench(
        `[${name}]`,
        () => {
          for (let j = 0; j < n; j++) {
            const tA = lib.setup.createToken();
            lib.setup.createService([]);
            const tB = lib.setup.createToken();
            lib.setup.createService([tA]);
            // @ts-ignore
            const tC = lib.setup.createToken();
            lib.setup.createService([tB]);

            // not registering
          }
        },
        COMMON_OPTS,
      );
    }
  });
}

for (const n of SIZES) {
  describe(`register: singleton only x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let entries: IEntry[] = [];
      bench(
        `[${name}]`,
        () => {
          const builder = lib.setup.createContainerBuilder();
          registerAll(lib, builder, entries, "singleton");
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            ({ entries } = buildLinearTriples(lib, n));
            global.gc?.();
          },
          teardown: () => {
            entries = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`build: provider (register + build) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let entries: IEntry[] = [];
      bench(
        `[${name}]`,
        () => {
          const builder = lib.setup.createContainerBuilder();
          registerAll(lib, builder, entries, "singleton");
          lib.prepare.createProvider(builder);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            ({ entries } = buildLinearTriples(lib, n));
            global.gc?.();
          },
          teardown: () => {
            entries = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`resolve: cold (all tokens) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let entries: IEntry[] = [];
      let tokensAll: unknown[] = [];
      bench(
        `[${name}]`,
        () => {
          const builder = lib.setup.createContainerBuilder();
          registerAll(lib, builder, entries, "singleton");
          const provider = lib.prepare.createProvider(builder);
          for (const token of tokensAll) lib.resolve.get(provider, token);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            ({ entries, tokensAll } = buildLinearTriples(lib, n));
            global.gc?.();
          },
          teardown: () => {
            entries = [];
            tokensAll = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe.only(`resolve: warm (leaf only) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let provider: unknown;
      let leafTokens: unknown[] = [];

      bench(
        `[${name}]`,
        () => {
          for (const token of leafTokens) lib.resolve.get(provider, token);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const pre = buildLinearTriples(lib, n);
            const builder = lib.setup.createContainerBuilder();
            registerAll(lib, builder, pre.entries, "singleton");
            provider = lib.prepare.createProvider(builder);
            leafTokens = pre.tokensLeaf.slice();

            for (const token of leafTokens) lib.resolve.get(provider, token);
            global.gc?.();
          },
          teardown: () => {
            provider = undefined;
            leafTokens = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`resolve: transient (warm leaf) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      if (!lib.prepare.registerTransient) continue;

      let provider: unknown;
      let leafTokens: unknown[] = [];

      bench(
        `[${name}]`,
        () => {
          for (const token of leafTokens) lib.resolve.get(provider, token);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const builder = lib.setup.createContainerBuilder();
            const pre = buildLinearTriples(lib, n);
            registerAll(lib, builder, pre.entries, "transient");
            provider = lib.prepare.createProvider(builder);
            leafTokens = pre.tokensLeaf.slice();
            global.gc?.();
          },
          teardown: () => {
            provider = undefined;
            leafTokens = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`resolve: scoped (create scope + leaf) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      if (!lib.prepare.registerScoped || !lib.prepare.createScopedProvider)
        continue;

      let rootProvider: unknown;
      let leafTokens: unknown[] = [];

      bench(
        `[${name}]`,
        () => {
          let scope = lib.prepare.createScopedProvider!(rootProvider as never);
          for (const token of leafTokens) lib.resolve.get(scope, token);
          lib.dispose?.disposeProvider?.(scope);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const builder = lib.setup.createContainerBuilder();
            const pre = buildLinearTriples(lib, n);
            registerAll(lib, builder, pre.entries, "scoped");
            rootProvider = lib.prepare.createProvider(builder);
            leafTokens = pre.tokensLeaf.slice();
            global.gc?.();
          },
          teardown: () => {
            rootProvider = undefined;
            leafTokens = [];
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`resolve: miss (unknown token) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let provider: unknown;
      let unknown: unknown;

      bench(
        `[${name}]`,
        () => {
          expect(() => lib.resolve.get(provider, unknown)).toThrow();
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const builder = lib.setup.createContainerBuilder();
            const pre = buildLinearTriples(lib, n);
            registerAll(lib, builder, pre.entries, "singleton");
            provider = lib.prepare.createProvider(builder);
            unknown = lib.setup.createToken();
            global.gc?.();
          },
          teardown: () => {
            provider = undefined;
            unknown = undefined;
            global.gc?.();
          },
        },
      );
    }
  });
}

describe(`resolve: deep chain (cold) depth=${DEEP_CHAIN}`, () => {
  for (const [name, lib] of getLibraries()) {
    let entries: IEntry[] = [];
    let lastToken: unknown = undefined;
    bench(
      `[${name}]`,
      () => {
        const builder = lib.setup.createContainerBuilder();
        registerAll(lib, builder, entries, "singleton");
        const provider = lib.prepare.createProvider(builder);
        lib.resolve.get(provider, lastToken as never);
      },
      {
        ...COMMON_OPTS,
        setup: () => {
          ({ entries, lastToken } = buildDeepChain(lib, DEEP_CHAIN));
          global.gc?.();
        },
      },
    );
  }
});
