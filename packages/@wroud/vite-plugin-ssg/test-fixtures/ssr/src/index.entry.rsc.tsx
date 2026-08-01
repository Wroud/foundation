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
    ) : undefined;
  return (
    <RequestProvider
      value={{ greeting, path: pathname, total: getTotal(), slot }}
    >
      {children}
    </RequestProvider>
  );
}

export default createRscConfig(RscRoot, {
  onAppStart: (context) => ({
    base: context.base ?? "/",
    pathname: new URL(context.href ?? "/", "http://localhost/").pathname,
  }),
  onResponse: ({ pathname }) => {
    if (pathname === "/missing") {
      return { status: 404, headers: { "x-robots-tag": "noindex" } };
    }
    if (pathname === "/cached" || pathname === "/boom") {
      return { headers: { "cache-control": "public, max-age=300" } };
    }
    return undefined;
  },
});
