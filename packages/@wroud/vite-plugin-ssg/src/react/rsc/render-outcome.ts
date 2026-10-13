import type { IResponseMetadata } from "../../app/IResponseMetadata.js";

export class RenderErrorTracker {
  errored: boolean;
  aborted: boolean;
  onError: (error: unknown) => undefined;

  constructor(signal?: AbortSignal) {
    this.errored = false;
    this.aborted = false;
    this.onError = (error) => {
      if (signal?.aborted) {
        this.aborted = true;
        return;
      }
      this.errored = true;
      console.error(error);
    };
  }
}

function toHeaders(...sources: (IResponseMetadata | undefined)[]): Headers {
  const headers = new Headers();
  for (const source of sources) {
    for (const [name, value] of Object.entries(source?.headers ?? {})) {
      headers.delete(name);
      for (const item of Array.isArray(value) ? value : [value]) {
        headers.append(name, item);
      }
    }
  }
  return headers;
}

export function resolveResponse(
  tracker: RenderErrorTracker,
  ...sources: (IResponseMetadata | undefined)[]
): { status: number | undefined; headers: Headers } {
  if (tracker.aborted || tracker.errored) {
    return {
      status: tracker.aborted ? 503 : 500,
      headers: new Headers({ "cache-control": "no-store" }),
    };
  }
  let status: number | undefined;
  for (const source of sources) {
    status = source?.status ?? status;
  }
  return { status, headers: toHeaders(...sources) };
}

export async function readShell(
  stream: ReadableStream<Uint8Array>,
): Promise<ReadableStream<Uint8Array>> {
  const reader = stream.getReader();
  const first = await reader.read();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (first.done) {
        controller.close();
      } else {
        controller.enqueue(first.value);
      }
    },
    async pull(controller) {
      const next = await reader.read();
      if (next.done) {
        controller.close();
      } else {
        controller.enqueue(next.value);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
