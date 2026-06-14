import type { IndexComponent, IndexComponentContext } from "../ssgPlugin.js";
import type { IAppContext } from "./IAppContext.js";

interface IAppInitializer<T extends IAppContext> {
  (context: IndexComponentContext): T | Promise<T>;
}

export interface IAppConfigOptions<T extends IAppContext> {
  onAppStart?: IAppInitializer<T>;
  onRoutesPrerender?: IRoutesPrerender<NoInfer<T>>;
  onAppStop?: IAppFinalizer<NoInfer<T>>;
}

export interface IRoutesPrerender<T extends IAppContext> {
  (app: T): string[] | Promise<string[]>;
}

export interface IAppFinalizer<T extends IAppContext> {
  (app: T): void | Promise<void>;
}

export class AppInstance<T extends IAppContext> {
  index: IndexComponent;
  private onAppStart?: IAppInitializer<T>;
  private onRoutesPrerender?: IRoutesPrerender<T>;
  private onAppStop?: IAppFinalizer<T>;

  constructor(index: IndexComponent, config?: IAppConfigOptions<T>) {
    this.index = index;
    this.onAppStart = config?.onAppStart;
    this.onRoutesPrerender = config?.onRoutesPrerender;
    this.onAppStop = config?.onAppStop;
  }

  async start(context: IndexComponentContext): Promise<T> {
    if (this.onAppStart) {
      return await this.onAppStart(context);
    }
    return {
      base: context.base ?? "/",
    } as T;
  }

  async getRoutesPrerender(startData: T): Promise<string[]> {
    return (await this.onRoutesPrerender?.(startData)) ?? [];
  }

  async stop(startData: T) {
    await this.onAppStop?.(startData);
  }
}

export function createAppConfig<T extends IAppContext>(
  index: IndexComponent,
  config?: IAppConfigOptions<T>,
): AppInstance<T> {
  return new AppInstance(index, config);
}

export function toAppInstance<T extends IAppContext>(
  value: IndexComponent | AppInstance<T>,
): AppInstance<T> {
  return value instanceof AppInstance ? value : new AppInstance(value);
}
