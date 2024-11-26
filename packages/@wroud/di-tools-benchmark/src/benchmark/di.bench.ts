///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe } from "vitest";

describe("create + register + get", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/createRegisterGet");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/createRegisterGet");
  await import("@wroud/di-tools-benchmark/modern/brandi/createRegisterGet");
  await import("@wroud/di-tools-benchmark/legacy/inversify/createRegisterGet");
});

describe("get singleton", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/get_singleton");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/get_singleton");
  await import("@wroud/di-tools-benchmark/modern/brandi/get_singleton");
  await import("@wroud/di-tools-benchmark/legacy/inversify/get_singleton");
});

describe("get scoped", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/get_scoped");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/get_scoped");
  await import("@wroud/di-tools-benchmark/modern/brandi/get_scoped");
});

describe("get transient", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/get_transient");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/get_transient");
  await import("@wroud/di-tools-benchmark/modern/brandi/get_transient");
  await import("@wroud/di-tools-benchmark/legacy/inversify/get_transient");
});

describe("get flat N=10", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/flat_10");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/flat_10");
  await import("@wroud/di-tools-benchmark/legacy/inversify/flat_10");
});

describe("get deep N=10", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/deep_10");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/deep_10");
  await import("@wroud/di-tools-benchmark/legacy/inversify/deep_10");
});

describe("get deep N=100", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/deep_100");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/deep_100");
  await import("@wroud/di-tools-benchmark/legacy/inversify/deep_100");
});

describe("get deep N=500", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/deep_500");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/deep_500");
});

describe("register", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/register");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/register");
  await import("@wroud/di-tools-benchmark/modern/brandi/register");
  await import("@wroud/di-tools-benchmark/legacy/inversify/register");
});

describe("register N=1000", async () => {
  await import("@wroud/di-tools-benchmark/modern/@wroud/register_1000");
  await import("@wroud/di-tools-benchmark/legacy/tsyringe/register_1000");
  await import("@wroud/di-tools-benchmark/legacy/inversify/register_1000");
});
