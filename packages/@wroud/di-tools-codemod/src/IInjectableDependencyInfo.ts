import type { Identifier } from "jscodeshift";

export interface IInjectableDependencyInfo {
  multiple: boolean;
  type: Identifier;
}
