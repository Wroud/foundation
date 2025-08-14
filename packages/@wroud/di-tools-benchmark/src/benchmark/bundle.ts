import * as esbuild from "esbuild";

process.env["NODE_ENV"] = "production";

await esbuild.build({
  entryPoints: [
    "@wroud/di-tools-benchmark/modern/@wroud/register-latest",
    "@wroud/di-tools-benchmark/modern/@wroud/register-main",
    "@wroud/di-tools-benchmark/modern/needle-di/register",
    "@wroud/di-tools-benchmark/legacy/tsyringe/register",
    "@wroud/di-tools-benchmark/legacy/inversify/register",
    "@wroud/di-tools-benchmark/legacy/inversify7/register",
  ],
  bundle: true,
  platform: "node",
  format: "esm",
  minify: true,
  external: ["@wroud/di-tools-benchmark/common/tools/registerLibrary"],
  outdir: "lib/bundled",
});
