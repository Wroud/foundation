import type { HtmlTagDescriptor } from "vite";

export interface IEntryDescriptor {
  chunk: string;
  entry: string;
  main?: IEntryDescriptor;
  htmlTags: HtmlTagDescriptor[];
}
