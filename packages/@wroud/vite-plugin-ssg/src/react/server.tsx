import { Writable } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import type { HtmlTagDescriptor } from "vite";
import type {
  IndexComponent,
  IndexComponentContext,
} from "./IndexComponent.js";
import { renderViteTags } from "./ssg-common.js";

export type ServerRenderFunction = (
  Index: IndexComponent,
  htmlTags: HtmlTagDescriptor[],
  context: IndexComponentContext,
  timeout?: number,
  mainScriptUrl?: string,
) => Promise<string>;

export type BoundServerRenderFunction = (
  htmlTags: HtmlTagDescriptor[],
  context: IndexComponentContext,
  timeout?: number,
) => Promise<string>;

export const render: ServerRenderFunction = async function render(
  Index,
  htmlTags,
  context,
  timeout = 10000,
  mainScriptUrl,
) {
  let htmlContent = "";

  await new Promise<void>(async (resolve, reject) => {
    try {
      const writable = new Writable({
        write(chunk, encoding, callback) {
          htmlContent += chunk.toString();
          callback();
        },
        final(callback) {
          resolve();
          callback();
        },
      });

      const { pipe, abort } = renderToPipeableStream(
        <Index
          renderTags={renderViteTags.bind(undefined, htmlTags, context)}
          context={context}
          mainScriptUrl={mainScriptUrl}
        />,
        {
          nonce: context.cspNonce,
          onAllReady() {
            clearTimeout(timeoutId);
            pipe(writable);
          },
          onError(error) {
            reject(error);
          },
        },
      );

      const timeoutId = setTimeout(() => {
        abort(new Error("SSG render timeout"));
      }, timeout);
    } catch (error) {
      reject(error);
    }
  });

  return htmlContent;
};
