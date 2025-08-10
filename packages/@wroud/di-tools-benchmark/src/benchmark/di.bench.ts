///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe, bench, expect } from "vitest";
import { getLibraries } from "@wroud/di-tools-benchmark/common/tools/registerLibrary";
import { buildLinearTriples } from "./buildLinearTriples.js";
import { registerAll } from "./registerAll.js";
import { buildDeepChain } from "./buildDeepChain.js";
import type { IEntry } from "./IEntry.js";

// -------------------- tuning --------------------

const SIZES = [8, 32];
const DEEP_CHAIN = 16;

// tinybench options are inherited by vitest bench
const COMMON_OPTS: Parameters<typeof bench>[2] = {
  time: 500,
  warmupTime: 1000,
  warmupIterations: 1,
  iterations: 1000,
  // throws: true,
  setup: () => {
    global.gc?.();
  },
  teardown: () => {
    global.gc?.();
  },
};

// -------------------- main --------------------

await import("@wroud/di-tools-benchmark/modern/@wroud/register");
await import("@wroud/di-tools-benchmark/modern/@wroud/registerOld");
await import("@wroud/di-tools-benchmark/modern/needle-di/register");
await import("@wroud/di-tools-benchmark/legacy/tsyringe/register");
// this library has memory leaks in registration
// await import("@wroud/di-tools-benchmark/modern/brandi/register");
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
        { ...COMMON_OPTS, warmupTime: 0, warmupIterations: 0 },
      );
    }
  });
}

for (const lifetime of ["singleton", "transient", "scoped"] as const) {
  for (const n of SIZES) {
    describe(`register: ${lifetime} only x${n}`, () => {
      for (const [name, lib] of getLibraries()) {
        if (
          (!lib.prepare.registerTransient && lifetime === "transient") ||
          (!lib.prepare.registerScoped && lifetime === "scoped")
        )
          continue;

        let entries: IEntry[] = [];
        bench(
          `[${name}]`,
          () => {
            const builder = lib.setup.createContainerBuilder();
            registerAll(lib, builder, entries, lifetime);
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
  describe(`resolve: singleton (warm leaf) x${n}`, () => {
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
  describe(`resolve: transient (leaf) x${n}`, () => {
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
  describe(`create: scope x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      if (!lib.prepare.registerScoped || !lib.prepare.createScopedProvider)
        continue;

      let rootProvider: unknown;

      bench(
        `[${name}]`,
        () => {
          let scope = lib.prepare.createScopedProvider!(rootProvider as never);
          lib.dispose?.disposeProvider?.(scope);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const builder = lib.setup.createContainerBuilder();
            const pre = buildLinearTriples(lib, n);
            registerAll(lib, builder, pre.entries, "scoped");
            rootProvider = lib.prepare.createProvider(builder);
            global.gc?.();
          },
          teardown: () => {
            rootProvider = undefined;
            global.gc?.();
          },
        },
      );
    }
  });
}

describe(`resolve: miss (unknown token)`, () => {
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
          const pre = buildLinearTriples(lib, 1);
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
        lib.resolve.get(provider, lastToken);
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

for (const n of SIZES) {
  describe.only(`app: init x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      bench(
        `[${name}]`,
        () => {
          const { entries, tokensAll } = buildLinearTriples(lib, n);
          const builder = lib.setup.createContainerBuilder();
          registerAll(lib, builder, entries, "singleton");
          const provider = lib.prepare.createProvider(builder);
          for (const token of tokensAll) lib.resolve.get(provider, token);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            global.gc?.();
          },
          teardown: () => {
            global.gc?.();
          },
        },
      );
    }
  });
}

for (const n of SIZES) {
  describe(`app: request (server, ssr) x${n}`, () => {
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
            leafTokens = pre.tokensLeaf;
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
  describe(`app: resolve warm (react, ssr) x${n}`, () => {
    for (const [name, lib] of getLibraries()) {
      let rootProvider: unknown;
      let leafTokens: unknown[] = [];

      bench(
        `[${name}]`,
        () => {
          for (const token of leafTokens) lib.resolve.get(rootProvider, token);
        },
        {
          ...COMMON_OPTS,
          setup: () => {
            const builder = lib.setup.createContainerBuilder();
            const pre = buildLinearTriples(lib, n);
            registerAll(lib, builder, pre.entries, "singleton");
            rootProvider = lib.prepare.createProvider(builder);
            for (const token of pre.tokensLeaf)
              lib.resolve.get(rootProvider, token);
            leafTokens = pre.tokensLeaf;
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
