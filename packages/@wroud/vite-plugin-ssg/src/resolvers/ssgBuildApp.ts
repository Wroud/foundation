import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import type { SsgCspOptions } from "../SsgPluginOptions.js";
import {
  htmlFilePath,
  joinBase,
  normalizeRoute,
  rscFilePath,
  sanitizeRoute,
  stripBase,
} from "../utils/routes.js";
import {
  applyCsp,
  metaIncompatibleDirectives,
  resolveCspOptions,
} from "../utils/csp.js";

interface SsgRscEntry {
  runtime: {
    getStaticPaths: () => Promise<string[]>;
    handleSsg: (request: Request) => Promise<{
      html: ReadableStream<Uint8Array>;
      rsc: ReadableStream<Uint8Array>;
    }>;
    dispose: () => Promise<void>;
  };
}

interface SsgBuildAppOptions {
  renderTimeout?: number;
  prerender?: boolean;
  csp?: boolean | SsgCspOptions;
}

interface CspManifestEntry {
  route: string;
  file: string;
  policy: string;
  hashes: string[];
}

export function ssgBuildApp(options: SsgBuildAppOptions = {}): Plugin {
  return {
    name: "@wroud/vite-plugin-ssg:build-app",
    buildApp: {
      order: "post",
      async handler(builder) {
        if (options.prerender === false) {
          return;
        }
        await renderStatic(builder.config, options);
      },
    },
  };
}

async function renderStatic(
  config: ResolvedConfig,
  options: SsgBuildAppOptions,
) {
  const rscOutDir = path.resolve(
    config.root,
    config.environments["rsc"]!.build.outDir,
  );
  const clientOutDir = path.resolve(
    config.root,
    config.environments["client"]!.build.outDir,
  );

  const entryUrl = pathToFileURL(path.join(rscOutDir, "index.js")).href;
  const entry: SsgRscEntry = await import(entryUrl);

  const { runtime } = entry;
  const csp = resolveCspOptions(options.csp);
  const manifest: CspManifestEntry[] = [];
  if (csp?.meta) {
    const ignored = metaIncompatibleDirectives(csp.directives);
    if (ignored.length) {
      config.logger.warn(
        `[vite-plugin-ssg] CSP directives ignored under <meta> delivery: ` +
          `${ignored.join(", ")}. Browsers drop these from a <meta http-equiv> ` +
          `policy; set csp.meta: false and deliver the manifest policy via a ` +
          `response header for them to take effect.`,
      );
    }
  }
  try {
    const routes = (await runtime.getStaticPaths()).map((route) =>
      normalizeRoute(stripBase(sanitizeRoute(route), config.base)),
    );

    for (const route of routes) {
      config.logger.info(`[vite-plugin-ssg] -> ${route}`);
      const url = new URL(joinBase(config.base, route), "http://ssg.local/");
      const request = new Request(url, {
        signal: AbortSignal.timeout(options.renderTimeout ?? 10000),
      });
      const { html, rsc } = await runtime.handleSsg(request);

      const htmlPath = path.join(clientOutDir, htmlFilePath(route));
      if (csp) {
        const applied = await applyCsp(
          (await streamToBuffer(html)).toString("utf8"),
          csp,
        );
        await writeFile(htmlPath, Buffer.from(applied.html, "utf8"));
        if (csp.manifest) {
          manifest.push({
            route,
            file: htmlFilePath(route).replace(/^\//, ""),
            policy: applied.policy,
            hashes: applied.hashes,
          });
        }
      } else {
        await writeFile(htmlPath, await streamToBuffer(html));
      }
      await writeFile(
        path.join(clientOutDir, rscFilePath(route)),
        await streamToBuffer(rsc),
      );
    }

    if (csp?.manifest) {
      await writeFile(
        path.join(clientOutDir, csp.manifest),
        Buffer.from(
          JSON.stringify(
            { version: 1, algorithm: csp.algorithm, pages: manifest },
            null,
            2,
          ) + "\n",
          "utf8",
        ),
      );
    }
  } finally {
    await runtime.dispose();
  }
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function writeFile(filePath: string, data: Buffer): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, data);
}
