import type { INavigation } from "../INavigation.js";
import { NavigationType } from "../NavigationListener.js";
import { KeyMap } from "./KeyMap.js";
import type { Inbound, Platform, Transition } from "./Platform.js";
import { currentUrl, destinationToUrl, readKey, urlToState } from "./url.js";

const SELF = "@wroud/navigation";

async function finish(call: Promise<Transition | null>): Promise<void> {
  const transition = await call;
  if (transition) await transition.finished;
}

function readSelf(info: unknown): Transition | null | undefined {
  if (typeof info === "object" && info !== null && SELF in info) {
    return (info as Record<string, Transition | null>)[SELF];
  }
  return undefined;
}

function issue(run: () => NavigationResult): NavigationResult | null {
  try {
    const result = run();
    result.finished?.catch(() => {});
    return result;
  } catch {
    return null;
  }
}

async function committed(result: NavigationResult): Promise<boolean> {
  try {
    await result.committed;
    return true;
  } catch {
    return false;
  }
}

export class NavigationApiPlatform implements Platform {
  private inbound: Inbound | null;
  private readonly keys: KeyMap;

  constructor(
    private readonly navApi: Navigation,
    private readonly navigation: INavigation,
    private readonly interceptLinks: boolean,
  ) {
    this.inbound = null;
    this.keys = new KeyMap();
    this.onNavigate = this.onNavigate.bind(this);
  }

  get key(): string | null {
    return this.keys.base(this.navApi.currentEntry?.key);
  }

  knows(key: string): boolean {
    return this.keys.platform(key) !== null;
  }

  attach(inbound: Inbound): void {
    this.inbound = inbound;
    const live = new Set(this.navigation.entries.map((entry) => entry.key));
    for (const entry of this.navApi.entries()) {
      const key = readKey(entry.getState());
      if (key !== null && live.has(key) && !this.knows(key)) {
        this.keys.set(entry.key, key);
      }
    }
    this.navApi.addEventListener("navigate", this.onNavigate);
  }

  detach(): void {
    this.navApi.removeEventListener("navigate", this.onNavigate);
    this.inbound = null;
  }

  async push(t: Transition, url: string | null): Promise<boolean> {
    if (!(await this.own(t, url ?? currentUrl(), "push"))) return false;
    return this.settle(t);
  }

  async stay(t: Transition, url: string | null): Promise<boolean> {
    const target =
      url ??
      (t.type === NavigationType.Replace &&
      t.to.state?.hash &&
      t.from !== null &&
      this.key === t.from.key
        ? currentUrl()
        : null);
    if (target !== null) {
      if (!(await this.own(t, target, "replace"))) return false;
    } else if (this.key !== t.to.key) {
      this.stamp(t.to.key);
    }
    return this.settle(t);
  }

  private settle(t: Transition): boolean {
    void t.finished.then(() => this.prune());
    return true;
  }

  async traverse(t: Transition): Promise<boolean> {
    const key = this.keys.platform(t.to.key);
    const result =
      key === null
        ? null
        : issue(() => this.navApi.traverseTo(key, { info: { [SELF]: t } }));
    return result !== null && committed(result);
  }

  revert(key: string): void {
    const target = this.keys.platform(key);
    if (target === null) return;
    issue(() =>
      this.navApi.traverseTo(target, { info: { [SELF]: null } }),
    )?.committed?.catch(() => {});
  }

  private async own(
    t: Transition,
    url: string,
    history: "push" | "replace",
  ): Promise<boolean> {
    const state = { key: t.to.key };
    const result = issue(() =>
      this.navApi.navigate(url, { history, state, info: { [SELF]: t } }),
    );
    if (result === null || !(await committed(result))) return false;
    this.map(t.to.key);
    return true;
  }

  private stamp(key: string): void {
    try {
      this.navApi.updateCurrentEntry({ state: { key } });
    } catch {}
    this.map(key);
  }

  private map(key: string): void {
    const entry = this.navApi.currentEntry;
    if (entry) this.keys.set(entry.key, key);
  }

  private prune(): void {
    this.keys.prune(new Set(this.navigation.entries.map((entry) => entry.key)));
  }

  private onNavigate(event: NavigateEvent): void {
    const interceptable = event.canIntercept && !event.defaultPrevented;
    const own = readSelf(event.info);
    if (own !== undefined) {
      if (own && interceptable) this.interceptOwn(event, own);
      return;
    }
    const inbound = this.inbound;
    if (
      !inbound ||
      !interceptable ||
      event.downloadRequest !== null ||
      event.formData ||
      event.navigationType === "reload"
    ) {
      return;
    }

    const url = destinationToUrl(event.destination.url);
    if (event.navigationType === "traverse") {
      const key = this.keys.base(event.destination.key);
      if (key !== null && key === this.navigation.currentEntry?.key) return;
      event.intercept({
        handler: () =>
          finish(
            key !== null ? inbound.traverse(key) : inbound.adopt(url, false),
          ),
      });
      return;
    }

    if (!this.interceptLinks && !event.hashChange) return;
    const replace = event.navigationType === "replace";
    const user = event.userInitiated || event.sourceElement != null;
    if (!user && !event.destination.sameDocument) return;
    if (!user && replace && !event.hashChange && url === currentUrl()) return;
    if (user && event.cancelable && inbound.request(url, replace)) {
      event.preventDefault();
      return;
    }
    if (!event.hashChange && !urlToState(this.navigation.router.matcher, url)) {
      return;
    }
    const options: NavigationInterceptOptions = {
      handler: () => finish(inbound.adopt(url, replace)),
    };
    if (!user && !event.hashChange) {
      options.scroll = "manual";
      options.focusReset = "manual";
    }
    event.intercept(options);
  }

  private interceptOwn(event: NavigateEvent, own: Transition): void {
    if (own.type !== NavigationType.Replace) {
      event.intercept({
        handler: async () => {
          await own.finished;
        },
      });
      return;
    }
    event.intercept({
      scroll: "manual",
      focusReset: "manual",
      handler: async () => {
        if ((await own.finished) && own.to.state?.hash) {
          try {
            event.scroll();
          } catch {}
        }
      },
    });
  }
}
