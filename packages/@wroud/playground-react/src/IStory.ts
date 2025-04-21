import type { IDescribe } from "./IDescribe.js";

export interface IStory {
  id: string;
  name: string;
  describe: IDescribe;
  component: React.ComponentType;
  options: IStoryOptions;
}

export interface IStoryOptions {
  preview?: React.ComponentType | true;
  description?: string;
}
