import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";
import { RequestProvider } from "./server-context.js";
import { getTotal } from "./counter-store.js";

function readHeader(
  headers: RscEntryProps["context"]["headers"],
  name: string,
): string {
  const value = headers?.[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function RscRoot({ context, children }: RscEntryProps) {
  const greeting = readHeader(context.headers, "x-greeting") || "hello";
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  return (
    <RequestProvider value={{ greeting, path: pathname, total: getTotal() }}>
      {children}
    </RequestProvider>
  );
}

export default createRscConfig(RscRoot);
