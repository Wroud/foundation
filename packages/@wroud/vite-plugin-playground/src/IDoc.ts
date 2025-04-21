import type { IDescribe } from "./IDescribe.js";

export interface IDoc<T = {}> {
  id: string;
  name: string;
  describe: IDescribe;
  component: React.ComponentType<T>;
  props?: T;
}
