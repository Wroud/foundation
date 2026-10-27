import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function view(container: HTMLElement, root: () => Root | null) {
  const query = (selector: string) => {
    const found = container.querySelector(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
  };
  const text = () => query("output").textContent;
  const unmount = async () => {
    await act(async () => {
      root()?.unmount();
    });
    container.remove();
  };
  return { container, query, text, unmount };
}

export function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  return { root, ...view(container, () => root) };
}

export function served(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  const errors: string[] = [];
  let root: Root | null = null;
  const hydrate = (element: ReactNode) => {
    root = hydrateRoot(container, element, {
      onRecoverableError: (error) => {
        errors.push(error instanceof Error ? error.message : String(error));
      },
    });
  };
  return { hydrate, errors, ...view(container, () => root) };
}

export function clickWith(target: Element, init: MouseEventInit = {}) {
  let intercepted = false;
  document.body.addEventListener(
    "click",
    (event) => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true },
  );
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
  );
  return intercepted;
}
