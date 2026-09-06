import { act } from "react";
import { createRoot } from "react-dom/client";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

export function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const query = (selector: string) => {
    const found = container.querySelector(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
  };
  const text = () => query("output").textContent;
  const unmount = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };
  return { root, query, text, unmount };
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
