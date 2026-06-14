/// <reference types="vite/client" />
/// <reference types="@vitejs/plugin-rsc/types" />

declare module "react-dom/server" {
  interface RenderToReadableStreamOptions {
    formState?: import("react-dom/client").ReactFormState | null;
  }
}

declare module "react-dom/server.edge" {
  export { renderToReadableStream } from "react-dom/server";
}
