import { describe, it, expect } from "vitest";
import { createRscRenderRequest, parseRenderRequest } from "./shared.js";

describe("rsc render request contract", () => {
  it("builds a GET flight request with the .rsc extension and RSC header", () => {
    const request = createRscRenderRequest("http://localhost/about");
    expect(request.method).toBe("GET");
    expect(new URL(request.url).pathname).toBe("/about.rsc");
    expect(request.headers.get("rsc")).toBe("1");
    expect(request.headers.get("rsc-action")).toBeNull();
  });

  it("maps directory and index routes to their mirrored .rsc files", () => {
    expect(
      new URL(createRscRenderRequest("http://localhost/").url).pathname,
    ).toBe("/index.rsc");
    expect(
      new URL(createRscRenderRequest("http://localhost/blog/").url).pathname,
    ).toBe("/blog/index.rsc");
  });

  it("builds a POST action request carrying the action id and body", () => {
    const request = createRscRenderRequest("http://localhost/about", {
      id: "mod#fn",
      body: "encoded-args",
    });
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/about.rsc");
    expect(request.headers.get("rsc")).toBe("1");
    expect(request.headers.get("rsc-action")).toBe("mod#fn");
  });

  it("round-trips a flight GET request", () => {
    const parsed = parseRenderRequest(
      createRscRenderRequest("http://localhost/about"),
    );
    expect(parsed.isRsc).toBe(true);
    expect(parsed.isAction).toBe(false);
    expect(parsed.actionId).toBeUndefined();
    expect(parsed.url.pathname).toBe("/about");
  });

  it("round-trips index and directory routes", () => {
    expect(
      parseRenderRequest(createRscRenderRequest("http://localhost/")).url
        .pathname,
    ).toBe("/");
    expect(
      parseRenderRequest(createRscRenderRequest("http://localhost/blog/")).url
        .pathname,
    ).toBe("/blog/");
  });

  it("round-trips a flight POST action request", () => {
    const parsed = parseRenderRequest(
      createRscRenderRequest("http://localhost/about", {
        id: "mod#fn",
        body: "x",
      }),
    );
    expect(parsed.isRsc).toBe(true);
    expect(parsed.isAction).toBe(true);
    expect(parsed.actionId).toBe("mod#fn");
    expect(parsed.url.pathname).toBe("/about");
  });

  it("treats a bare URL with the RSC header as a flight request", () => {
    const parsed = parseRenderRequest(
      new Request("http://localhost/about", { headers: { rsc: "1" } }),
    );
    expect(parsed.isRsc).toBe(true);
    expect(parsed.isAction).toBe(false);
    expect(parsed.url.pathname).toBe("/about");
  });

  it("treats a plain page POST as a progressive-enhancement action", () => {
    const parsed = parseRenderRequest(
      new Request("http://localhost/checkout", { method: "POST" }),
    );
    expect(parsed.isRsc).toBe(false);
    expect(parsed.isAction).toBe(true);
    expect(parsed.actionId).toBeUndefined();
    expect(parsed.url.pathname).toBe("/checkout");
  });

  it("treats a plain GET as a document request", () => {
    const parsed = parseRenderRequest(new Request("http://localhost/checkout"));
    expect(parsed.isRsc).toBe(false);
    expect(parsed.isAction).toBe(false);
  });

  it("rejects a flight POST without an action id header", () => {
    expect(() =>
      parseRenderRequest(
        new Request("http://localhost/about.rsc", { method: "POST" }),
      ),
    ).toThrow(/action id/);
  });
});
