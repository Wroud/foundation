# @wroud/di-tools-benchmark

Benchmark suite comparing DI libraries (focus on `@wroud/di`).

## Quick Highlights

App scenarios (more realistic end‑to‑end flows):

| Scenario (x8 / x32 services) | Fastest | Key advantages vs prev `@wroud/di@0.15.2` | Vs `tsyringe` | Vs `inversify@6` | Notes |
| ---------------------------- | ------- | ------------------------------------------ | ------------- | --------------- | ----- |
| app: init x8                 | @wroud/di* | ~1.3x faster                               | 2.76x faster  | 3.44x faster    | Startup (needle-di within noise) |
| app: init x32                | @wroud/di | 1.41x faster                               | 3.42x faster  | 3.37x faster    | Larger startup graph |
| app: request x8              | @wroud/di | 1.35x faster                               | 1.44x faster  | —               | Scope creation + scoped services |
| app: request x32             | @wroud/di | 1.45x faster                               | 1.44x faster  | —               | Stable scaling |
| app: resolve warm x8         | @wroud/di | 1.75x faster                               | 2.91x faster  | 10.75x faster   | Hot path leaf resolutions |
| app: resolve warm x32        | @wroud/di | 1.50x faster                               | 2.63x faster  | 10.54x faster   | Larger graph, still fast |

Core takeaways:
* Startup: Current `@wroud/di` overtakes all libraries on larger graphs (3x+ faster than older mainstream libs; >1.4x its own previous version).
* Request / scope: 1.35–1.45x faster than v0.15.2 and tsyringe; big gap vs older inversify versions (scoped benchmarks exclude libs without scopes).
* Warm resolves (React render / SSR reuse): 1.5–1.75x faster than v0.15.2 and ~10x faster than inversify v6 for frequent leaf resolutions.
* Minor regression: raw scope creation alone is ~3% slower than v0.15.2 (trade‑off for broader gains) but still vastly ahead of other libs.

*The 1% difference reported in the x8 init run (needle-di 1.01x) is inside typical noise / error margin for these microbenchmarks; treated as an effective tie and aggregated under `@wroud/di` wins due to consistent lead at larger size.*

> In plain words: `@wroud/di` delivers >3× faster initialization (effective) and >1.4× faster scoped & warm resolution performance versus its previous version, and dramatic (up to ~10×) wins over some popular alternatives in hot paths.

## Reproducing Benchmarks

Benchmarks use Vitest's `bench` (tinybench) with explicit GC calls. To avoid one suite’s allocations influencing another, run a **single top-level suite at a time** using `describe.only` in `src/benchmark/di.bench.ts`.

### 1. Enable a single suite
Open `src/benchmark/di.bench.ts` and put `.only` on the `describe` you want, e.g.

```ts
describe.only(`app: init x32`, () => { /* ... */ })
```

Repeat runs for each scenario you care about, removing `.only` and adding it to the next one.

### 2. Build (needed for mixed TS configs)

```bash
yarn workspace @wroud/di-tools-benchmark build
```

### 3. Run the benchmark

```bash
yarn workspace @wroud/di-tools-benchmark bench
```

Optional: run multiple times and average (noise drops after a couple of warm runs).

## Interpretation Guide

Mapping to real app concerns:
* app: init — initial container build + first resolution of all singletons (server start / app bootstrap).
* app: request (server, ssr) — create a scoped provider and resolve scoped leaves (per HTTP request / SSR render scope).
* app: resolve warm (react, ssr) — cost of retrieving already-initialized singletons many times (hot component renders, server reuse).

Choose metrics:
* Server focus: look at init + request.
* React or SSR focus: init + resolve warm.

## Full Relative Results (abridged selection)

See `benchmark-results.txt` for the complete list. Excerpt of other noteworthy wins (current `@wroud/di` vs others):

| Operation | Relative wins (current `@wroud/di`) |
| --------- | ----------------------------------- |
| build: provider x32 | 1.56x vs needle-di, 3.59x vs v0.15.2, 3.03x vs tsyringe, 26.68x vs inversify7 |
| resolve: cold x32 | 1.04x vs needle-di, 1.33x vs v0.15.2, 1.20x vs tsyringe, 5.22x vs inversify |
| resolve: singleton warm x32 | 1.09x vs needle-di, 1.53x vs v0.15.2, 2.59x vs tsyringe, 10.19x vs inversify |
| resolve: transient leaf x32 | 1.57x vs v0.15.2, 1.49x vs tsyringe, 15.39x vs inversify |

## Caveats

Microbenchmarks approximate patterns; real applications may shift relative differences (IO, framework overhead, etc.). Still, shape & order of magnitude are consistent across reruns. Always validate with your own workload if microseconds matter.

## License

MIT
