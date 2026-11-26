const PROTOCOL = "@wroud/playground";
const CONNECT = "$connect";
const CONNECTED = "$connected";

export interface IStoryTopic<T> {
  readonly name: string;
  readonly payload?: T;
}

export function defineStoryTopic<T>(name: string): IStoryTopic<T> {
  return { name };
}

export interface IStoryChannelPeer {
  postMessage(message: unknown, targetOrigin: string): void;
}

export type IStoryChannelEndpoint = Pick<
  EventTarget,
  "addEventListener" | "removeEventListener"
>;

export interface IStoryChannelOptions {
  storyId: string;
  getPeer: () => IStoryChannelPeer | null;
  endpoint?: IStoryChannelEndpoint;
  origin?: string;
}

interface IStoryEnvelope {
  protocol: typeof PROTOCOL;
  storyId: string;
  topic: string;
  payload?: unknown;
}

type Listener = (payload: any) => void;

export class StoryChannel {
  readonly storyId: string;
  private readonly getPeer: () => IStoryChannelPeer | null;
  private readonly endpoint: IStoryChannelEndpoint | undefined;
  private readonly origin: string | undefined;
  private readonly listeners: Map<string, Set<Listener>>;
  private readonly connectListeners: Set<() => void>;
  private connected: boolean;

  constructor({ storyId, getPeer, endpoint, origin }: IStoryChannelOptions) {
    this.storyId = storyId;
    this.getPeer = getPeer;
    this.endpoint = endpoint;
    this.origin = origin;
    this.listeners = new Map();
    this.connectListeners = new Set();
    this.connected = false;
    this.handleMessage = this.handleMessage.bind(this);
  }

  open(): () => void {
    const endpoint: IStoryChannelEndpoint = this.endpoint ?? window;
    endpoint.addEventListener("message", this.handleMessage);
    this.post(CONNECT);

    return () => {
      endpoint.removeEventListener("message", this.handleMessage);
      this.connected = false;
    };
  }

  send<T>(topic: IStoryTopic<T>, payload: T): void {
    this.post(topic.name, payload);
  }

  on<T>(topic: IStoryTopic<T>, listener: (payload: T) => void): () => void {
    let listeners = this.listeners.get(topic.name);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(topic.name, listeners);
    }
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  onConnect(listener: () => void): () => void {
    this.connectListeners.add(listener);
    if (this.connected) {
      listener();
    }

    return () => {
      this.connectListeners.delete(listener);
    };
  }

  private post(topic: string, payload?: unknown): void {
    this.getPeer()?.postMessage(
      {
        protocol: PROTOCOL,
        storyId: this.storyId,
        topic,
        payload,
      } satisfies IStoryEnvelope,
      this.origin ?? window.location.origin,
    );
  }

  private handleMessage(event: Event): void {
    const { data, source } =
      event as MessageEvent<Partial<IStoryEnvelope> | null>;
    const peer = this.getPeer();
    if (
      !peer ||
      source !== peer ||
      data?.protocol !== PROTOCOL ||
      data.storyId !== this.storyId ||
      typeof data.topic !== "string"
    ) {
      return;
    }

    if (data.topic === CONNECT) {
      this.post(CONNECTED);
      this.setConnected();
    } else if (data.topic === CONNECTED) {
      if (!this.connected) {
        this.setConnected();
      }
    } else {
      this.listeners.get(data.topic)?.forEach((listener) => {
        listener(data.payload);
      });
    }
  }

  private setConnected(): void {
    this.connected = true;
    this.connectListeners.forEach((listener) => {
      listener();
    });
  }
}
