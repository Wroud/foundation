import { createAppConfig } from "@wroud/vite-plugin-ssg/app";
import type { IndexComponentProps } from "@wroud/vite-plugin-ssg";

function Index({ context }: IndexComponentProps) {
  return <p data-testid="client-nonce">{context.cspNonce}</p>;
}

export default createAppConfig(Index, {
  onAppStart: (context) => ({
    base: context.base ?? "/",
    href: context.href,
    nonce: context.cspNonce,
    id: context.headers?.["x-id"],
  }),
  onResponse: (app) => ({
    headers: {
      "x-ssr-href": app.href ?? "",
      "x-ssr-nonce": app.nonce ?? "",
      "x-ssr-id": String(app.id ?? ""),
    },
  }),
});
