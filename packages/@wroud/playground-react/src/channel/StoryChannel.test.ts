import { describe, expect, it, vi } from "vitest";
import {
  defineStoryTopic,
  StoryChannel,
  type IStoryChannelPeer,
} from "./StoryChannel.js";

const ORIGIN = "http://playground.test";
const pingTopic = defineStoryTopic<{ count: number }>("test:ping");

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createWindows() {
  const hostEndpoint = new EventTarget();
  const frameEndpoint = new EventTarget();
  const deliver =
    (endpoint: EventTarget, source: () => IStoryChannelPeer) =>
    (data: unknown) => {
      setTimeout(() => {
        endpoint.dispatchEvent(
          Object.assign(new Event("message"), { data, source: source() }),
        );
      });
    };
  const toFrame: IStoryChannelPeer = {
    postMessage: deliver(frameEndpoint, () => toHost),
  };
  const toHost: IStoryChannelPeer = {
    postMessage: deliver(hostEndpoint, () => toFrame),
  };

  return {
    host: (storyId = "/story") =>
      new StoryChannel({
        storyId,
        getPeer: () => toFrame,
        endpoint: hostEndpoint,
        origin: ORIGIN,
      }),
    frame: (storyId = "/story") =>
      new StoryChannel({
        storyId,
        getPeer: () => toHost,
        endpoint: frameEndpoint,
        origin: ORIGIN,
      }),
  };
}

describe("StoryChannel", () => {
  it("connects both sides whichever opens first", async () => {
    const windows = createWindows();
    const host = windows.host();
    const frame = windows.frame();
    const hostConnected = vi.fn();
    const frameConnected = vi.fn();
    host.onConnect(hostConnected);
    frame.onConnect(frameConnected);

    host.open();
    await flush();
    expect(hostConnected).not.toHaveBeenCalled();

    frame.open();
    await flush();
    await flush();
    expect(hostConnected).toHaveBeenCalledTimes(1);
    expect(frameConnected).toHaveBeenCalledTimes(1);
  });

  it("delivers topic payloads in both directions", async () => {
    const windows = createWindows();
    const host = windows.host();
    const frame = windows.frame();
    const onHost = vi.fn();
    const onFrame = vi.fn();
    host.on(pingTopic, onHost);
    frame.on(pingTopic, onFrame);
    host.open();
    frame.open();

    host.send(pingTopic, { count: 1 });
    frame.send(pingTopic, { count: 2 });
    await flush();

    expect(onFrame).toHaveBeenCalledWith({ count: 1 });
    expect(onHost).toHaveBeenCalledWith({ count: 2 });
  });

  it("calls onConnect immediately when already connected", async () => {
    const windows = createWindows();
    const host = windows.host();
    host.open();
    windows.frame().open();
    await flush();
    await flush();

    const listener = vi.fn();
    host.onConnect(listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies the host again when the frame reconnects", async () => {
    const windows = createWindows();
    const host = windows.host();
    const connected = vi.fn();
    host.onConnect(connected);
    host.open();

    const close = windows.frame().open();
    await flush();
    close();
    windows.frame().open();
    await flush();

    expect(connected).toHaveBeenCalledTimes(2);
  });

  it("ignores messages for other stories", async () => {
    const windows = createWindows();
    const host = windows.host("/a");
    const frame = windows.frame("/b");
    const listener = vi.fn();
    frame.on(pingTopic, listener);
    host.open();
    frame.open();

    host.send(pingTopic, { count: 1 });
    await flush();

    expect(listener).not.toHaveBeenCalled();
  });
});
