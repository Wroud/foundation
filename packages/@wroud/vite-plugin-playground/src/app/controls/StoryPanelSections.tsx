import { useState } from "react";
import {
  storyActionTopic,
  storyPanelTopic,
  type IStoryPanel,
} from "@wroud/playground-react/controls";
import {
  useChannelListener,
  useStoryChannel,
} from "@wroud/playground-react/channel";
import { Button } from "../form/Button.js";
import { Section } from "../form/Section.js";

const EMPTY_PANEL: IStoryPanel = { actions: [], values: {} };

export function StoryPanelSections() {
  const channel = useStoryChannel();
  const [{ actions, values }, setPanel] = useState(EMPTY_PANEL);
  const entries = Object.entries(values);

  useChannelListener(channel, storyPanelTopic, setPanel);

  return (
    <>
      {actions.length > 0 && (
        <Section title="Actions">
          <div className="twp:flex twp:flex-wrap twp:gap-2">
            {actions.map((action) => (
              <Button
                key={action}
                onClick={() => channel?.send(storyActionTopic, action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </Section>
      )}
      {entries.length > 0 && (
        <Section title="Values">
          <dl className="twp:grid twp:grid-cols-[auto_1fr] twp:gap-x-4 twp:gap-y-2 twp:text-sm">
            {entries.map(([name, value]) => (
              <div key={name} className="twp:contents">
                <dt className="twp:text-zinc-500 twp:dark:text-zinc-400">
                  {name}
                </dt>
                <dd className="twp:truncate twp:text-right twp:font-mono twp:text-zinc-900 twp:dark:text-zinc-100">
                  {value === null ? "—" : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </>
  );
}
