import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { StoryChannel, type IStoryTopic } from "./StoryChannel.js";

export const StoryChannelContext = createContext<StoryChannel | null>(null);

export function useStoryChannel(): StoryChannel | null {
  return use(StoryChannelContext);
}

export function useFrameChannel(storyId: string): StoryChannel {
  const channel = useMemo(
    () =>
      new StoryChannel({
        storyId,
        getPeer: () => (window.parent === window ? null : window.parent),
      }),
    [storyId],
  );

  useEffect(() => channel.open(), [channel]);

  return channel;
}

export function useHostChannel(storyId: string): {
  channel: StoryChannel;
  iframeRef: RefObject<HTMLIFrameElement | null>;
} {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channel = useMemo(
    () =>
      new StoryChannel({
        storyId,
        getPeer: () => iframeRef.current?.contentWindow ?? null,
      }),
    [storyId],
  );

  useEffect(() => channel.open(), [channel]);

  return { channel, iframeRef };
}

export function useChannelListener<T>(
  channel: StoryChannel | null,
  topic: IStoryTopic<T>,
  listener: (payload: T) => void,
): void {
  const latest = useRef(listener);

  useEffect(() => {
    latest.current = listener;
  });

  useEffect(
    () => channel?.on(topic, (payload) => latest.current(payload)),
    [channel, topic],
  );
}

export function useChannelPublish<T>(
  channel: StoryChannel | null,
  topic: IStoryTopic<T>,
  payload: T,
): void {
  const latest = useRef(payload);

  useEffect(() => {
    latest.current = payload;
    channel?.send(topic, payload);
  }, [channel, topic, payload]);

  useEffect(
    () => channel?.onConnect(() => channel.send(topic, latest.current)),
    [channel, topic],
  );
}
