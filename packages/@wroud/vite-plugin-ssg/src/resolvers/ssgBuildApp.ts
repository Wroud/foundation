import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import {
  htmlFilePath,
  joinBase,
  normalizeRoute,
  rscFilePath,
  sanitizeRoute,
  stripBase,
} from "../utils/routes.js";

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

      await writeFileStream(path.join(clientOutDir, htmlFilePath(route)), html);
      await writeFileStream(path.join(clientOutDir, rscFilePath(route)), rsc);
    }
  } finally {
    await runtime.dispose();
  }
}

async function writeFileStream(
  filePath: string,
  stream: ReadableStream<Uint8Array>,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(Buffer.from(value));
  }
  await fs.promises.writeFile(filePath, Buffer.concat(chunks));
}
