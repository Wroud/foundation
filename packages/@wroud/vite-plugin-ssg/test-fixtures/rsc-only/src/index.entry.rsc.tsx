import type { RscEntryProps } from "@wroud/vite-plugin-ssg";
import { Link, Script } from "@wroud/vite-plugin-ssg/react/components";
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
        <Link rel="icon" href="/favicon.svg" data-testid="rsc-nonced-link" />
        <Script data-testid="rsc-inline-script">
          {"window.__RSC_INLINE = 1;"}
        </Script>
        <Script src="/plain.js" data-testid="rsc-plain-script" />
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
