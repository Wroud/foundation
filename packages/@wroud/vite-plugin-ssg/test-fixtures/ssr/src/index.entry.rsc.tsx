import { Suspense } from "react";
import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import { RequestProvider } from "./server-context.js";
import { getTotal } from "./counter-store.js";
import { Boom } from "./boom.js";

function readHeader(
  headers: RscEntryProps["context"]["headers"],
  name: string,
): string {
  const value = headers?.[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function SlowSection() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return <p data-testid="slow-content">slow-done</p>;
}

function SyncBoom(): never {
  throw new Error("sync-boom");
}

async function SlowBoom(): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  throw new Error("slow-boom");
}

async function Stall() {
  await new Promise(() => {});
  return null;
}

function boundary(children: React.ReactNode) {
  return (
    <Suspense fallback={<p data-testid="boom-fallback">boom-loading</p>}>
      {children}
    </Suspense>
  );
}

function RscRoot({ context, children }: RscEntryProps) {
  const greeting = readHeader(context.headers, "x-greeting") || "hello";
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  const slot =
    pathname === "/slow" ? (
      <Suspense fallback={<p data-testid="slow-fallback">slow-loading</p>}>
        <SlowSection />
      </Suspense>
    ) : pathname === "/boom" ? (
      <Boom />
    ) : pathname === "/sync-boom" ? (
      boundary(<SyncBoom />)
    ) : pathname === "/slow-boom" ? (
      boundary(<SlowBoom />)
    ) : pathname === "/stall" ? (
      boundary(<Stall />)
    ) : pathname === "/stall-shell" ? (
      <Stall />
    ) : undefined;
  return (
    <RequestProvider
      value={{ greeting, path: pathname, total: getTotal(), slot }}
    >
      {children}
    </RequestProvider>
  );
}

const CACHED_ROUTES = new Set([
  "/cached",
  "/boom",
  "/sync-boom",
  "/slow-boom",
  "/stall",
  "/stall-shell",
]);

export default createRscConfig(RscRoot, {
  onRoutesPrerender: () => ["/", "/sync-boom"],
  onAppStart: (context) => ({
    base: context.base ?? "/",
    pathname: new URL(context.href ?? "/", "http://localhost/").pathname,
  }),
  onResponse: ({ pathname }) => {
    if (pathname === "/missing") {
      return { status: 404, headers: { "x-robots-tag": "noindex" } };
    }
    if (CACHED_ROUTES.has(pathname)) {
      return { headers: { "cache-control": "public, max-age=300" } };
    }
    return undefined;
  },
});
