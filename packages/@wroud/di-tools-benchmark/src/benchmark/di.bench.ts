///<reference types="@wroud/tests-runner/jest-extended.d.ts"/>
import { describe } from "vitest";

describe("create + register + get", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/createRegisterGet");
  await import("@wroud/di-tools-benchmark/tsyringe/createRegisterGet");
  await import("@wroud/di-tools-benchmark/brandi/createRegisterGet");
  await import("@wroud/di-tools-benchmark/inversify/createRegisterGet");
});

describe("get singleton", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/get_singleton");
  await import("@wroud/di-tools-benchmark/tsyringe/get_singleton");
  await import("@wroud/di-tools-benchmark/brandi/get_singleton");
  await import("@wroud/di-tools-benchmark/inversify/get_singleton");
});

describe("get scoped", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/get_scoped");
  await import("@wroud/di-tools-benchmark/tsyringe/get_scoped");
  await import("@wroud/di-tools-benchmark/brandi/get_scoped");
});

describe("get transient", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/get_transient");
  await import("@wroud/di-tools-benchmark/tsyringe/get_transient");
  await import("@wroud/di-tools-benchmark/brandi/get_transient");
  await import("@wroud/di-tools-benchmark/inversify/get_transient");
});

describe("get flat N=10", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/flat_10");
  await import("@wroud/di-tools-benchmark/tsyringe/flat_10");
  await import("@wroud/di-tools-benchmark/inversify/flat_10");
});

describe("get deep N=10", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/deep_10");
  await import("@wroud/di-tools-benchmark/tsyringe/deep_10");
  await import("@wroud/di-tools-benchmark/inversify/deep_10");
});

describe("get deep N=100", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/deep_100");
  await import("@wroud/di-tools-benchmark/tsyringe/deep_100");
  await import("@wroud/di-tools-benchmark/inversify/deep_100");
});

describe("register", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/register");
  await import("@wroud/di-tools-benchmark/tsyringe/register");
  await import("@wroud/di-tools-benchmark/brandi/register");
  await import("@wroud/di-tools-benchmark/inversify/register");
});

describe("register N=1000", async () => {
  await import("@wroud/di-tools-benchmark/@wroud/register_1000");
  await import("@wroud/di-tools-benchmark/tsyringe/register_1000");
  await import("@wroud/di-tools-benchmark/inversify/register_1000");
});
