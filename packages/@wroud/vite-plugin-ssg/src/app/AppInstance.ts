import { Navigation, type IRouteState } from "@wroud/navigation";
import type { IndexComponent, IndexComponentContext } from "../ssgPlugin.js";
import type { IAppStartData } from "./IAppStartData.js";

interface IAppInitializer {
  (context: IndexComponentContext): IAppStartData | Promise<IAppStartData>;
}

export interface IAppConfigOptions {
  onAppStart?: IAppInitializer;
  onRoutesPrerender?: IRoutesPrerender;
}

export interface IRoutesPrerender {
  (app: IAppStartData): IRouteState[] | Promise<IRouteState[]>;
}

export class AppInstance {
  index: IndexComponent;
  private onAppStart?: IAppInitializer;
  private onRoutesPrerender?: IRoutesPrerender;

  constructor(index: IndexComponent, config?: IAppConfigOptions) {
    this.index = index;
    this.onAppStart = config?.onAppStart;
    this.onRoutesPrerender = config?.onRoutesPrerender;
  }

  async start(context: IndexComponentContext): Promise<IAppStartData> {
    if (this.onAppStart) {
      return await this.onAppStart(context);
    }
    return {
      base: context.base ?? "/",
      navigation: new Navigation(),
    };
  }

  async getRoutesPrerender(startData: IAppStartData): Promise<IRouteState[]> {
    return (await this.onRoutesPrerender?.(startData)) ?? [];
  }

  async stop() {}
}

export function createAppConfig(
  index: IndexComponent,
  config?: IAppConfigOptions,
) {
  return new AppInstance(index, config);
}
