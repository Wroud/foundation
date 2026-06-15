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

  constructor(root: RscEntryComponent<T>, config?: IRscConfigOptions<T>) {
    this.root = root;
    this.onAppStart = config?.onAppStart;
    this.onRoutesPrerender = config?.onRoutesPrerender;
    this.onAppStop = config?.onAppStop;
  }

  async start(context: IndexComponentContext): Promise<T> {
    if (this.onAppStart) {
      return await this.onAppStart(context);
    }
    return { base: context.base ?? "/" } as T;
  }

  get hasRoutesPrerender(): boolean {
    return this.onRoutesPrerender !== undefined;
  }

  async getRoutesPrerender(app: T): Promise<string[]> {
    return (await this.onRoutesPrerender?.(app)) ?? [];
  }

  async stop(app: T): Promise<void> {
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
