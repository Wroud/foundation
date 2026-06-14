import type { ReactNode } from "react";
import type { ReactFormState } from "react-dom/client";
import type { IndexComponentContext } from "../IndexComponent.js";
import { rscFilePath, routeFromRscPath } from "../../utils/routes.js";

export type ActionReturnValue = { ok: boolean; data: unknown };

export type RscPayload = {
  root: ReactNode;
  context: IndexComponentContext;
  returnValue?: ActionReturnValue;
  formState?: ReactFormState;
};

export const RSC_CONTENT_TYPE = "text/x-component;charset=utf-8";
export const HEADER_RSC = "rsc";
export const HEADER_VARY = "vary";
export const HEADER_ACTION_ID = "rsc-action";

const RSC_EXTENSION = ".rsc";

export interface RscActionRequest {
  id: string;
  body: BodyInit;
}

export function createRscRenderRequest(
  urlString: string,
  action?: RscActionRequest,
): Request {
  const url = new URL(urlString);
  url.pathname = rscFilePath(url.pathname);
  const headers = new Headers({ [HEADER_RSC]: "1" });
  if (!action) {
    return new Request(url.toString(), { headers });
  }
  headers.set(HEADER_ACTION_ID, action.id);
  return new Request(url.toString(), {
    method: "POST",
    headers,
    body: action.body,
  });
}

export interface ParsedRenderRequest {
  isRsc: boolean;
  isAction: boolean;
  actionId?: string;
  url: URL;
}

export function parseRenderRequest(request: Request): ParsedRenderRequest {
  const url = new URL(request.url);
  const isAction = request.method === "POST";
  const hasExtension = url.pathname.endsWith(RSC_EXTENSION);
  const isRsc = hasExtension || request.headers.get(HEADER_RSC) === "1";
  if (isRsc) {
    if (hasExtension) {
      url.pathname = routeFromRscPath(url.pathname);
    }
    const actionId = request.headers.get(HEADER_ACTION_ID) || undefined;
    if (isAction && !actionId) {
      throw new Error(
        "[vite-plugin-ssg] RSC action request is missing the action id header",
      );
    }
    return { isRsc: true, isAction, actionId, url };
  }
  return { isRsc: false, isAction, url };
}
