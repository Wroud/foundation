/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import type { INavigation } from "../INavigation.js";
import type {
  INavigationPlatform,
  NavigationTransition,
} from "../INavigationPlatform.js";
import type { IRouteState } from "../IRouteState.js";
import { NavigationType } from "../NavigationListener.js";
import { HistoryPlatform } from "./HistoryPlatform.js";
import { NavigationApiPlatform } from "./NavigationApiPlatform.js";
import type { Inbound, Platform, Transition } from "./Platform.js";
import {
  currentUrl,
  isBrowserAt,
  navigationApi,
  stateToUrl,
  urlToState,
} from "./url.js";

export interface BrowserNavigationOptions {
  interceptLinks?: boolean;
}

interface Call {
  readonly key: string | null;
  readonly state: IRouteState | null;
  transition: Transition | null;
}

export class BrowserNavigation
  implements INavigationPlatform<IRouteState>, Inbound
{
  private readonly interceptLinks: boolean;
  private platform: Platform | null;
  private registered: boolean;
  private readonly calls: Set<Call>;

  constructor(
    private readonly navigation: INavigation,
    options: BrowserNavigationOptions = {},
  ) {
    this.interceptLinks = options.interceptLinks ?? true;
    this.platform = null;
    this.registered = false;
    this.calls = new Set();
  }

  async registerRoutes(): Promise<void> {
    if (this.registered) return;
    this.registered = true;
    const navApi = navigationApi();
    const platform = navApi
      ? new NavigationApiPlatform(navApi, this.navigation, this.interceptLinks)
      : new HistoryPlatform(this.navigation);
    this.platform = platform;
    platform.attach(this);
    this.navigation.setPlatform(this);
    const current = this.navigation.currentEntry;
    if (current === null || platform.key !== current.key) {
      const hydrate =
        current !== null &&
        platform.key === null &&
        isBrowserAt(this.navigation.router.matcher, current.state);
      await this.adopt(currentUrl(), hydrate);
    }
  }

  dispose(): void {
    this.platform?.detach();
    this.platform = null;
    this.navigation.setPlatform(null);
    this.registered = false;
  }

  async commit(t: NavigationTransition<IRouteState>): Promise<boolean> {
    const committed = await this.place(t);
    if (committed) this.record(t);
    return committed;
  }

  traverse(key: string): Promise<Transition | null> {
    return this.inbound({ key, state: null, transition: null }, () =>
      this.navigation.traverseTo(key),
    );
  }

  adopt(url: string, replace: boolean): Promise<Transition | null> {
    const state = this.urlToState(url);
    return this.inbound({ key: null, state, transition: null }, () =>
      this.issue(state, replace),
    );
  }

  request(url: string, replace: boolean): boolean {
    const state = this.urlToState(url);
    if (!state) return false;
    this.issue(state, replace).catch((error: unknown) => {
      console.error("Navigation failed", error);
    });
    return true;
  }

  private issue(state: IRouteState | null, replace: boolean): Promise<boolean> {
    return replace
      ? this.navigation.replace(state)
      : this.navigation.navigate(state);
  }

  private async place(t: Transition): Promise<boolean> {
    const platform = this.platform!;
    if (t.type === NavigationType.Navigate) {
      const url = this.urlFor(t.to.state);
      return t.from !== null && platform.key === t.from.key
        ? platform.push(t, url)
        : platform.stay(t, url);
    }
    if (platform.key !== t.to.key) {
      if (this.traversing(t.to.key)) return false;
      if (platform.knows(t.to.key)) {
        if (!(await platform.traverse(t))) return false;
      } else if (t.type !== NavigationType.Replace) {
        return false;
      }
    }
    return platform.stay(t, this.urlFor(t.to.state));
  }

  private record(t: Transition): void {
    for (const call of this.calls) {
      if (
        call.key === null ? call.state === t.to.state : call.key === t.to.key
      ) {
        call.transition = t;
      }
    }
  }

  private traversing(key: string): boolean {
    for (const call of this.calls) {
      if (call.key === key) return true;
    }
    return false;
  }

  private async inbound(
    call: Call,
    run: () => Promise<boolean>,
  ): Promise<Transition | null> {
    this.calls.add(call);
    try {
      return (await run()) ? call.transition : null;
    } catch (error) {
      console.error("Navigation failed", error);
      return null;
    } finally {
      this.calls.delete(call);
      if (call.key === null || this.platform?.key === call.key) {
        this.reconcile();
      }
    }
  }

  private reconcile(): void {
    const current = this.navigation.currentEntry;
    const platform = this.platform;
    if (
      current &&
      platform &&
      platform.key !== current.key &&
      platform.knows(current.key)
    ) {
      platform.revert(current.key);
    }
  }

  private urlFor(state: IRouteState | null): string | null {
    const matcher = this.navigation.router.matcher;
    return state && !isBrowserAt(matcher, state)
      ? stateToUrl(matcher, state)
      : null;
  }

  private urlToState(url: string): IRouteState | null {
    return urlToState(this.navigation.router.matcher, url);
  }
}
