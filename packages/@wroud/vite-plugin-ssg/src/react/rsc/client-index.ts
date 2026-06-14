import type { IAppContext } from "../../app.js";
import { toAppInstance, type AppInstance } from "../../app/AppInstance.js";
import type { IndexComponent } from "../IndexComponent.js";

export function unwrapIndex<T extends IAppContext>(
  value: IndexComponent | AppInstance<T>,
): IndexComponent {
  return toAppInstance(value).index;
}
