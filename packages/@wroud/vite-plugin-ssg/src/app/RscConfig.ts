import type {
  IndexComponentContext,
  RscEntryComponent,
} from "../react/IndexComponent.js";
import type { IAppContext } from "./IAppContext.js";

interface IRscInitializer<T extends IAppContext> {
  (context: IndexComponentContext): T | Promise<T>;
}

interface IRscRoutesPrerender<T extends IAppContext> {
  (app: T): string[] | Promise<string[]>;
}

interface IRscFinalizer<T extends IAppContext> {
  (app: T): void | Promise<void>;
}

export interface IRscConfigOptions<T extends IAppContext> {
  onAppStart?: IRscInitializer<T>;
  onRoutesPrerender?: IRscRoutesPrerender<NoInfer<T>>;
  onAppStop?: IRscFinalizer<NoInfer<T>>;
}

export class RscInstance<T extends IAppContext> {
  root: RscEntryComponent<T>;
  private onAppStart?: IRscInitializer<T>;
  private onRoutesPrerender?: IRscRoutesPrerender<T>;
  private onAppStop?: IRscFinalizer<T>;
  private startPromise?: Promise<T>;

  constructor(root: RscEntryComponent<T>, config?: IRscConfigOptions<T>) {
    this.root = root;
    this.onAppStart = config?.onAppStart;
    this.onRoutesPrerender = config?.onRoutesPrerender;
    this.onAppStop = config?.onAppStop;
  }

  start(context: IndexComponentContext): Promise<T> {
    if (!this.startPromise) {
      const startPromise = Promise.resolve(
        this.onAppStart?.(context) ?? ({ base: context.base ?? "/" } as T),
      );
      this.startPromise = startPromise;
      startPromise.catch(() => {
        if (this.startPromise === startPromise) {
          this.startPromise = undefined;
        }
      });
    }
    return this.startPromise;
  }

  get hasRoutesPrerender(): boolean {
    return this.onRoutesPrerender !== undefined;
  }

  async getRoutesPrerender(app: T): Promise<string[]> {
    return (await this.onRoutesPrerender?.(app)) ?? [];
  }

  async stop(): Promise<void> {
    const startPromise = this.startPromise;
    this.startPromise = undefined;

    if (!startPromise) {
      return;
    }

    let app: T;
    try {
      app = await startPromise;
    } catch {
      return;
    }

    await this.onAppStop?.(app);
  }
}

export function createRscConfig<T extends IAppContext>(
  root: RscEntryComponent<T>,
  config?: IRscConfigOptions<T>,
): RscInstance<T> {
  return new RscInstance(root, config);
}

export function toRscInstance(
  value: RscEntryComponent | RscInstance<any>,
): RscInstance<any> {
  return value instanceof RscInstance ? value : new RscInstance(value);
}
