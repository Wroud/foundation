import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { createRscConfig } from "@wroud/vite-plugin-ssg/app";

async function Page({ pathname }: { pathname: string }) {
  const data = await Promise.resolve("rsc-only");
  return (
    <>
      <h1 data-testid="rsc-only">{data}</h1>
      <p data-testid="path">{pathname}</p>
    </>
  );
}

function Root({ context }: RscEntryProps) {
  const { pathname } = new URL(context.href ?? "/", "http://localhost/");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{`RSC ${pathname}`}</title>
      </head>
      <body>
        <Page pathname={pathname} />
      </body>
    </html>
  );
}

export default createRscConfig(Root, {
  onRoutesPrerender: () => ["/", "/about"],
});
