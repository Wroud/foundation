import { describe, expect, it } from "vitest";
import { routeFilePath } from "./routes.js";

describe("routeFilePath", () => {
  it("decodes url-encoded segments", () => {
    expect(routeFilePath("/story/%40wroud/Split%20View/")).toBe(
      "/story/@wroud/Split View/",
    );
  });

  it("keeps segments that are not valid percent-encoding", () => {
    expect(routeFilePath("/sale/50%-off/")).toBe("/sale/50%-off/");
  });

  it("rejects segments that decode to path separators or dot dirs", () => {
    expect(() => routeFilePath("/a/%2E%2E/b/")).toThrow(/invalid route/);
    expect(() => routeFilePath("/a/%2E/b/")).toThrow(/invalid route/);
    expect(() => routeFilePath("/a%2Fb/")).toThrow(/invalid route/);
    expect(() => routeFilePath("/a%5Cb/")).toThrow(/invalid route/);
  });
});
