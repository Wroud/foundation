import { describe, expect, it, vi } from "vitest";
import {
  createMountTable,
  mountBase,
  mountRoute,
  normalizeMountPath,
  selectMount,
} from "./mounts.js";
import { stripBase } from "./routes.js";

describe("normalizeMountPath", () => {
  it("strips surrounding slashes", () => {
    expect(normalizeMountPath("/playground/")).toBe("playground");
    expect(normalizeMountPath("docs/api")).toBe("docs/api");
    expect(normalizeMountPath("/")).toBe("");
  });

  it("rejects empty and parent segments", () => {
    expect(() => normalizeMountPath("a//b")).toThrow(/invalid mount path/);
    expect(() => normalizeMountPath("../x")).toThrow(/invalid mount path/);
  });
});

describe("mountBase", () => {
  it("appends the mount path to any kind of base", () => {
    expect(mountBase("/", "")).toBe("/");
    expect(mountBase("/", "playground")).toBe("/playground/");
    expect(mountBase("/app/", "playground")).toBe("/app/playground/");
    expect(mountBase("./", "playground")).toBe("./playground/");
    expect(mountBase("https://cdn.test/app/", "pg")).toBe(
      "https://cdn.test/app/pg/",
    );
  });
});

describe("stripBase", () => {
  it("treats the base without its trailing slash as the root", () => {
    expect(stripBase("/app/x", "/app/")).toBe("/x");
    expect(stripBase("/app", "/app/")).toBe("/");
    expect(stripBase("/x", "/")).toBe("/x");
  });
});

describe("selectMount", () => {
  const mounts = [{ path: "" }, { path: "pg" }, { path: "pg/nested" }];

  it("picks the longest matching mount and falls back to the root", () => {
    expect(selectMount(mounts, "/pg", "/")?.path).toBe("pg");
    expect(selectMount(mounts, "/pg/story/x", "/")?.path).toBe("pg");
    expect(selectMount(mounts, "/pg/nested/x", "/")?.path).toBe("pg/nested");
    expect(selectMount(mounts, "/pgx", "/")?.path).toBe("");
    expect(selectMount(mounts, "/", "/")?.path).toBe("");
    expect(selectMount(mounts, "/app/pg/x", "/app/")?.path).toBe("pg");
  });

  it("returns undefined without a root mount", () => {
    expect(selectMount([{ path: "pg" }], "/other", "/")).toBeUndefined();
  });
});

describe("mountRoute", () => {
  it("prefixes mount routes and keeps root routes", () => {
    expect(mountRoute("", "/about")).toBe("/about");
    expect(mountRoute("pg", "/")).toBe("/pg/");
    expect(mountRoute("pg", "/about")).toBe("/pg/about");
    expect(mountRoute("pg", "/story/x/")).toBe("/pg/story/x/");
  });
});

describe("createMountTable", () => {
  it("resolves bases against the site base and matches by url", () => {
    const table = createMountTable(
      [{ path: "" }, { path: "admin" }],
      "https://cdn.test/site/",
      async (source) => source.path,
    );
    expect(table.mounts.map((mount) => mount.base)).toEqual([
      "https://cdn.test/site/",
      "https://cdn.test/site/admin/",
    ]);
    expect(table.match("/site/admin/users")?.path).toBe("admin");
    expect(table.match("/site/")?.path).toBe("");
    expect(table.find("admin")?.base).toBe("https://cdn.test/site/admin/");
  });

  it("loads each mount once", async () => {
    const load = vi.fn(async (source: { path: string }) => source.path);
    const table = createMountTable([{ path: "a" }], "/", load);
    const mount = table.find("a")!;
    await Promise.all([table.load(mount), table.load(mount)]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
