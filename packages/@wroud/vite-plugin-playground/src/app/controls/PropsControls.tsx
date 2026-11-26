import { useId, useState } from "react";
import type { IStory, StoryPropsSchema } from "@wroud/playground-react";
import {
  useChannelListener,
  useChannelPublish,
  useStoryChannel,
} from "@wroud/playground-react/channel";
import {
  getInitialStoryValues,
  getStoryJsonSchema,
  storyIssuesTopic,
  storyValuesTopic,
  type IStoryPropsIssue,
} from "@wroud/playground-react/controls";
import { Button } from "../form/Button.js";
import { ErrorMessages, Field } from "../form/Field.js";
import { Section } from "../form/Section.js";
import { Select } from "../form/Select.js";
import { ObjectFields, type IssuesMap } from "./SchemaField.js";

export function PropsSection({ story }: { story: IStory }) {
  const propsSchema = story.options.props;
  return propsSchema ? (
    <PropsControls story={story} propsSchema={propsSchema} />
  ) : null;
}

function PropsControls({
  story,
  propsSchema,
}: {
  story: IStory;
  propsSchema: StoryPropsSchema;
}) {
  const stateId = useId();
  const channel = useStoryChannel();
  const schema = getStoryJsonSchema(propsSchema);
  const states = story.options.states ?? {};
  const [values, setValues] = useState(() => getInitialStoryValues(story));
  const [issues, setIssues] = useState<IStoryPropsIssue[]>([]);
  const [activeState, setActiveState] = useState<string | null>(null);

  useChannelPublish(channel, storyValuesTopic, values);
  useChannelListener(channel, storyIssuesTopic, setIssues);

  if (schema instanceof Error) {
    return (
      <ErrorMessages errors={[`Cannot render controls: ${schema.message}`]} />
    );
  }

  function applyState(state: string | null) {
    setActiveState(state);
    setValues({
      ...getInitialStoryValues(story),
      ...(state === null ? {} : states[state]),
    });
  }

  const issuesMap = groupIssues(issues);
  const stateNames = Object.keys(states);

  return (
    <Section
      title="Controls"
      action={
        <Button variant="ghost" onClick={() => applyState(activeState)}>
          Reset
        </Button>
      }
    >
      <form
        className="twp:flex twp:flex-col twp:gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        {stateNames.length > 0 && (
          <Field label="Preset" htmlFor={stateId}>
            <Select
              id={stateId}
              value={activeState ?? ""}
              onChange={(event) => applyState(event.target.value || null)}
            >
              <option value="">Default</option>
              {stateNames.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <ObjectFields
          path=""
          schema={schema}
          value={values}
          issues={issuesMap}
          onChange={setValues}
        />
        <ErrorMessages errors={issuesMap.get("")} />
      </form>
    </Section>
  );
}

function groupIssues(issues: IStoryPropsIssue[]): IssuesMap {
  const map = new Map<string, string[]>();
  for (const { path, message } of issues) {
    map.set(path, [...(map.get(path) ?? []), message]);
  }
  return map;
}
