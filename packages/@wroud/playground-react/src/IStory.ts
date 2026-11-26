import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";
import type { IDescribe } from "./IDescribe.js";

export type StoryPropsSchema<Props = any> = StandardSchemaV1<unknown, Props> &
  StandardJSONSchemaV1<unknown, Props>;

export type InferStoryProps<Schema extends StoryPropsSchema> =
  StandardSchemaV1.InferOutput<Schema>;

export interface IStory {
  id: string;
  name: string;
  describe: IDescribe;
  component: React.ComponentType<any>;
  options: IStoryOptions<any>;
}

export interface IStoryOptions<
  Schema extends StoryPropsSchema = StoryPropsSchema<{}>,
> {
  preview?: React.ComponentType | true;
  description?: string;
  props?: Schema;
  states?: Record<string, Partial<StandardSchemaV1.InferInput<Schema>>>;
}
