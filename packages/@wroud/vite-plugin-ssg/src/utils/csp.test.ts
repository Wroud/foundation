import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  applyCsp,
  buildCspPolicy,
  injectCspMeta,
  inlineScriptHashes,
  metaIncompatibleDirectives,
  resolveCspOptions,
} from "./csp.js";

function sha(content: string, algorithm = "sha256"): string {
  const digest = createHash(algorithm).update(content, "utf8").digest("base64");
  return `'${algorithm}-${digest}'`;
}

describe("resolveCspOptions", () => {
  it("returns null when disabled", () => {
    expect(resolveCspOptions(undefined)).toBeNull();
    expect(resolveCspOptions(false)).toBeNull();
  });

  it("applies defaults for `true`", () => {
    expect(resolveCspOptions(true)).toEqual({
      algorithm: "sha256",
      meta: true,
      manifest: false,
      directives: { "script-src": ["'self'"] },
    });
  });

  it("merges an explicit options object over the defaults", () => {
    expect(
      resolveCspOptions({ algorithm: "sha384", meta: false, manifest: true }),
    ).toEqual({
      algorithm: "sha384",
      meta: false,
      manifest: "csp-manifest.json",
      directives: { "script-src": ["'self'"] },
    });
  });

  it("keeps a custom manifest filename", () => {
    expect(resolveCspOptions({ manifest: "headers.json" })!.manifest).toBe(
      "headers.json",
    );
  });
});

describe("inlineScriptHashes", () => {
  it("hashes inline scripts and skips external ones", async () => {
    const html =
      `<script>window.a = 1;</script>` +
      `<script src="/app.js"></script>` +
      `<script type="module">window.b = 2;</script>`;
    expect(await inlineScriptHashes(html)).toEqual([
      sha("window.a = 1;"),
      sha("window.b = 2;"),
    ]);
  });

  it("does not treat a `data-src` attribute as external", async () => {
    const html = `<script data-src="x">window.c = 3;</script>`;
    expect(await inlineScriptHashes(html)).toEqual([sha("window.c = 3;")]);
  });

  it("deduplicates byte-identical scripts", async () => {
    const html = `<script>x()</script><script>x()</script>`;
    expect(await inlineScriptHashes(html)).toEqual([sha("x()")]);
  });

  it("honors the algorithm", async () => {
    const html = `<script>z()</script>`;
    expect(await inlineScriptHashes(html, "sha512")).toEqual([
      sha("z()", "sha512"),
    ]);
  });
});

describe("buildCspPolicy", () => {
  it("appends hashes to a default script-src 'self'", () => {
    expect(buildCspPolicy(["'sha256-abc'"], { "script-src": ["'self'"] })).toBe(
      "script-src 'self' 'sha256-abc'",
    );
  });

  it("creates script-src when the directives omit it", () => {
    expect(
      buildCspPolicy(["'sha256-abc'"], { "default-src": ["'self'"] }),
    ).toBe("default-src 'self'; script-src 'self' 'sha256-abc'");
  });

  it("preserves the position of a provided script-src", () => {
    expect(
      buildCspPolicy(["'sha256-abc'"], {
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:"],
      }),
    ).toBe("script-src 'self' 'sha256-abc'; img-src 'self' data:");
  });

  it("emits a bare directive name when its source list is empty", () => {
    expect(buildCspPolicy([], { "upgrade-insecure-requests": [] })).toBe(
      "upgrade-insecure-requests; script-src 'self'",
    );
  });
});

describe("metaIncompatibleDirectives", () => {
  it("flags directives a <meta> policy cannot deliver", () => {
    expect(
      metaIncompatibleDirectives({
        "script-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "report-uri": ["/csp"],
        sandbox: [],
      }),
    ).toEqual(["frame-ancestors", "report-uri", "sandbox"]);
  });

  it("is case-insensitive and empty when all directives are meta-safe", () => {
    expect(metaIncompatibleDirectives({ "Report-To": ["g"] })).toEqual([
      "Report-To",
    ]);
    expect(
      metaIncompatibleDirectives({
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:"],
      }),
    ).toEqual([]);
  });
});

describe("injectCspMeta", () => {
  it("inserts the meta tag right after <head>", () => {
    const html = `<html><head><title>x</title></head><body></body></html>`;
    const out = injectCspMeta(html, "script-src 'self'");
    expect(out).toContain(
      `<head><meta http-equiv="Content-Security-Policy" content="script-src 'self'"><title>`,
    );
  });

  it("escapes characters that would break the attribute", () => {
    const out = injectCspMeta("<head></head>", `script-src 'self' "&<>`);
    expect(out).toContain(`content="script-src 'self' &quot;&amp;&lt;&gt;"`);
  });

  it("synthesizes a head when none exists", () => {
    const out = injectCspMeta("<html><body></body></html>", "script-src 'self'");
    expect(out).toContain(
      `<html><head><meta http-equiv="Content-Security-Policy" content="script-src 'self'"></head><body>`,
    );
  });

  it("prepends the meta when there is no html or head", () => {
    const out = injectCspMeta("<body></body>", "script-src 'self'");
    expect(out).toBe(
      `<meta http-equiv="Content-Security-Policy" content="script-src 'self'"><body></body>`,
    );
  });
});

describe("applyCsp", () => {
  it("injects the meta and returns the policy plus unquoted hashes", async () => {
    const html = `<head></head><body><script>go()</script></body>`;
    const result = await applyCsp(html, resolveCspOptions(true)!);
    expect(result.policy).toBe(`script-src 'self' ${sha("go()")}`);
    expect(result.hashes).toEqual([sha("go()").slice(1, -1)]);
    expect(result.html).toContain(
      `<head><meta http-equiv="Content-Security-Policy"`,
    );
  });

  it("skips meta injection but still returns the policy when meta is false", async () => {
    const html = `<head></head><body><script>go()</script></body>`;
    const result = await applyCsp(html, resolveCspOptions({ meta: false })!);
    expect(result.html).toBe(html);
    expect(result.policy).toBe(`script-src 'self' ${sha("go()")}`);
  });
});
