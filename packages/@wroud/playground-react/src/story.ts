import { getDescribe } from "./describe.js";
import { registerStory } from "./registry/stories.js";
import type {
  InferStoryProps,
  IStoryOptions,
  StoryPropsSchema,
} from "./IStory.js";

export function story<Schema extends StoryPropsSchema = StoryPropsSchema<{}>>(
  name: string,
  component: React.ComponentType<InferStoryProps<Schema>>,
  options: IStoryOptions<Schema> = {},
) {
  const describe = getDescribe();
  const id =
    describe.id !== "/" ? describe.id + "/" + name : describe.id + name;

  registerStory({ id, name, describe, component, options });
}
