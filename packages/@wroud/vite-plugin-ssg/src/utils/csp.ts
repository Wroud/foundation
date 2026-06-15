import type { CspAlgorithm, SsgCspOptions } from "../SsgPluginOptions.js";

export interface ResolvedCspOptions {
  algorithm: CspAlgorithm;
  meta: boolean;
  manifest: string | false;
  directives: Record<string, readonly string[]>;
}

export interface AppliedCsp {
  html: string;
  policy: string;
  hashes: string[];
}

const DEFAULT_MANIFEST = "csp-manifest.json";

const DEFAULT_DIRECTIVES: Record<string, readonly string[]> = {
  "script-src": ["'self'"],
};

export function resolveCspOptions(
  csp: boolean | SsgCspOptions | undefined,
): ResolvedCspOptions | null {
  if (!csp) {
    return null;
  }
  const options = csp === true ? {} : csp;
  return {
    algorithm: options.algorithm ?? "sha256",
    meta: options.meta ?? true,
    manifest:
      options.manifest === true
        ? DEFAULT_MANIFEST
        : (options.manifest ?? false),
    directives: options.directives ?? DEFAULT_DIRECTIVES,
  };
}

const SUBTLE_ALGORITHM: Record<CspAlgorithm, string> = {
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

const INLINE_SCRIPT = /<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export async function inlineScriptHashes(
  html: string,
  algorithm: CspAlgorithm = "sha256",
): Promise<string[]> {
  const encoder = new TextEncoder();
  const seen = new Set<string>();
  const hashes: string[] = [];
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    const digest = await crypto.subtle.digest(
      SUBTLE_ALGORITHM[algorithm],
      encoder.encode(match[1] ?? ""),
    );
    const source = `'${algorithm}-${bytesToBase64(new Uint8Array(digest))}'`;
    if (!seen.has(source)) {
      seen.add(source);
      hashes.push(source);
    }
  }
  return hashes;
}

export function buildCspPolicy(
  scriptHashes: readonly string[],
  directives: Record<string, readonly string[]>,
): string {
  const merged = new Map<string, string[]>();
  for (const [name, sources] of Object.entries(directives)) {
    merged.set(name, [...sources]);
  }
  merged.set("script-src", [
    ...(merged.get("script-src") ?? ["'self'"]),
    ...scriptHashes,
  ]);
  return [...merged]
    .map(([name, sources]) =>
      sources.length ? `${name} ${sources.join(" ")}` : name,
    )
    .join("; ");
}

const META_INCOMPATIBLE_DIRECTIVES = new Set([
  "frame-ancestors",
  "report-uri",
  "report-to",
  "sandbox",
]);

export function metaIncompatibleDirectives(
  directives: Record<string, readonly string[]>,
): string[] {
  return Object.keys(directives).filter((name) =>
    META_INCOMPATIBLE_DIRECTIVES.has(name.toLowerCase()),
  );
}

const ATTR_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
};

export function injectCspMeta(html: string, policy: string): string {
  const content = policy.replace(/[&"<>]/g, (ch) => ATTR_ESCAPE[ch]!);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${content}">`;
  const head = /<head[^>]*>/i.exec(html);
  if (head) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + meta + html.slice(at);
  }
  const htmlTag = /<html[^>]*>/i.exec(html);
  if (htmlTag) {
    const at = htmlTag.index + htmlTag[0].length;
    return `${html.slice(0, at)}<head>${meta}</head>${html.slice(at)}`;
  }
  return meta + html;
}

export async function applyCsp(
  html: string,
  csp: ResolvedCspOptions,
): Promise<AppliedCsp> {
  const quoted = await inlineScriptHashes(html, csp.algorithm);
  const policy = buildCspPolicy(quoted, csp.directives);
  return {
    html: csp.meta ? injectCspMeta(html, policy) : html,
    policy,
    hashes: quoted.map((hash) => hash.slice(1, -1)),
  };
}
