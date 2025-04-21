import { getDescribe } from "./describe.js";
import { registerStory } from "./registry/stories.js";
import type { IStoryOptions } from "./IStory.js";

export function story(
  name: string,
  component: React.ComponentType,
  options: IStoryOptions = {},
) {
  const describe = getDescribe();
  const id =
    describe.id !== "/" ? describe.id + "/" + name : describe.id + name;

  registerStory({ id, name, describe, component, options });
}
