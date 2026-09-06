import type { INavigation } from "./INavigation.js";
import type { INavigationEntry } from "./INavigationEntry.js";
import type {
  INavigationPlatform,
  NavigationTransition,
} from "./INavigationPlatform.js";
import type { IRouteMatcher, RouteMatcherState } from "./IRouteMatcher.js";
import type { IRouteState } from "./IRouteState.js";
import type { IRouter } from "./IRouter.js";
import {
  NavigationType,
  type NavigationListener,
} from "./NavigationListener.js";
import { Router } from "./Router.js";

type State<TMatcher extends IRouteMatcher> = RouteMatcherState<TMatcher>;

interface Intent<TState> {
  readonly type: NavigationType;
  readonly index: number;
  readonly to: INavigationEntry<TState>;
}

interface Guarded<TState> extends Intent<TState> {
  next: Promise<unknown> | null;
}

interface Committed<TState> {
  readonly transition: NavigationTransition<TState>;
  readonly finish: (applied: boolean) => void;
}

export class Navigation<TMatcher extends IRouteMatcher = IRouteMatcher>
  implements INavigation<TMatcher>
{
  get state(): State<TMatcher> | null {
    return this.currentEntry?.state ?? null;
  }

  get history(): (State<TMatcher> | null)[] {
    return this.entryList.map((entry) => entry.state);
  }

  get entries(): readonly INavigationEntry<State<TMatcher>>[] {
    return this.entryList.slice();
  }

  get position(): number {
    return this.cursor;
  }

  get currentEntry(): INavigationEntry<State<TMatcher>> | null {
    return this.entryList[this.cursor] ?? null;
  }

  get canGoBack(): boolean {
    return this.cursor > 0;
  }

  get canGoForward(): boolean {
    return this.cursor < this.entryList.length - 1;
  }

  private entryList: INavigationEntry<State<TMatcher>>[];
  private cursor: number;
  private platform: INavigationPlatform<State<TMatcher>> | null;
  private guarded: Guarded<State<TMatcher>> | null;
  private tail: Promise<unknown>;
  private active: number;
  private readonly listeners: Set<NavigationListener>;
  private readonly keyPrefix: string;
  private keyCounter: number;
  readonly router: IRouter<TMatcher>;

  constructor(router?: IRouter<TMatcher>) {
    this.entryList = [];
    this.cursor = -1;
    this.platform = null;
    this.guarded = null;
    this.tail = Promise.resolve();
    this.active = 0;
    this.listeners = new Set();
    this.keyPrefix = Math.random().toString(36).slice(2, 8);
    this.keyCounter = 0;
    this.router = router || new Router();
    this.addListener = this.addListener.bind(this);
    this.getState = this.getState.bind(this);
  }

  getState(): State<TMatcher> | null {
    return this.state;
  }

  setState(position: number, state?: State<TMatcher>[]): void {
    this.entryList = (state || []).map((s) => ({
      key: this.newKey(),
      state: s,
    }));
    this.cursor = position;
  }

  setPlatform(platform: INavigationPlatform<State<TMatcher>> | null): void {
    this.platform = platform;
  }

  async navigate(state: State<TMatcher> | null): Promise<boolean> {
    this.assertRoute(state);
    return this.start(() => ({
      type: NavigationType.Navigate,
      index: this.cursor + 1,
      to: { key: this.newKey(), state },
    }));
  }

  async replace(state: State<TMatcher> | null): Promise<boolean> {
    this.assertRoute(state);
    return this.start(() => {
      const index = Math.max(this.cursor, 0);
      return {
        type: NavigationType.Replace,
        index,
        to: { key: this.entryList[index]?.key ?? this.newKey(), state },
      };
    });
  }

  goBack(): Promise<boolean> {
    return this.go(-1);
  }

  goForward(): Promise<boolean> {
    return this.go(1);
  }

  go(delta: number): Promise<boolean> {
    return this.start(() => this.traversal(this.cursor + delta));
  }

  traverseTo(key: string): Promise<boolean> {
    return this.start(() =>
      this.traversal(this.entryList.findIndex((entry) => entry.key === key)),
    );
  }

  addListener(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    return () => this.removeListener(listener);
  }

  removeListener(listener: NavigationListener): void {
    this.listeners.delete(listener);
  }

  protected commit(
    transition: NavigationTransition<State<TMatcher>>,
  ): boolean | Promise<boolean> {
    return this.platform ? this.platform.commit(transition) : true;
  }

  private traversal(index: number): Intent<State<TMatcher>> | boolean {
    const to = this.entryList[index];
    if (!to || this.cursor === -1) return false;
    if (index === this.cursor) return true;
    const type =
      index < this.cursor ? NavigationType.Back : NavigationType.Forward;
    return { type, index, to };
  }

  private start(
    intent: () => Intent<State<TMatcher>> | boolean,
  ): Promise<boolean> {
    const pending = this.guarded;
    if (pending === null) {
      const settled =
        this.active === 0
          ? this.launch(intent())
          : this.tail.then(() => this.launch(intent()));
      const done = () => {
        this.active--;
      };
      this.active++;
      this.tail = settled.then(done, done);
      return this.complete(settled);
    }
    const made = intent();
    if (typeof made === "boolean") return Promise.resolve(made);
    this.guarded = null;
    const inherit =
      made.type === NavigationType.Navigate ||
      made.type === NavigationType.Replace;
    const settled = this.run(
      inherit
        ? {
            type: pending.type,
            index: pending.index,
            to: { key: pending.to.key, state: made.to.state },
          }
        : made,
    );
    pending.next = settled;
    return this.complete(settled);
  }

  private launch(
    made: Intent<State<TMatcher>> | boolean,
  ): Promise<Committed<State<TMatcher>> | boolean> {
    return typeof made === "boolean" ? Promise.resolve(made) : this.run(made);
  }

  private async run(
    intent: Intent<State<TMatcher>>,
  ): Promise<Committed<State<TMatcher>> | boolean> {
    const guarded: Guarded<State<TMatcher>> = { ...intent, next: null };
    const from = this.currentEntry;
    this.guarded = guarded;
    let allowed = false;
    try {
      allowed = await this.checkGuards(guarded.to.state, from?.state ?? null);
    } finally {
      if (this.guarded === guarded) this.guarded = null;
    }
    if (guarded.next) return guarded.next.then(() => false);
    if (!allowed) return false;
    let finish!: (applied: boolean) => void;
    const finished = new Promise<boolean>((resolve) => (finish = resolve));
    const { type, index, to } = guarded;
    const transition = { type, index, to, from, finished };
    let applied = false;
    try {
      applied = (await this.commit(transition)) && this.apply(transition);
    } finally {
      if (!applied) finish(false);
    }
    return applied && { transition, finish };
  }

  private async complete(
    settled: Promise<Committed<State<TMatcher>> | boolean>,
  ): Promise<boolean> {
    const committed = await settled;
    if (typeof committed === "boolean") return committed;
    const { type, from, to } = committed.transition;
    void this.notifyListeners(type, from?.state ?? null, to.state).finally(() =>
      committed.finish(true),
    );
    return true;
  }

  private apply(t: NavigationTransition<State<TMatcher>>): boolean {
    if (t.index > this.entryList.length) return false;
    if (t.type === NavigationType.Back || t.type === NavigationType.Forward) {
      if (this.entryList[t.index]?.key !== t.to.key) return false;
    } else if (t.type === NavigationType.Navigate) {
      this.entryList.length = t.index;
    }
    this.entryList[t.index] = t.to;
    this.cursor = t.index;
    return true;
  }

  private newKey(): string {
    return `${this.keyPrefix}-${++this.keyCounter}`;
  }

  private assertRoute(state: IRouteState | null): void {
    if (state && !this.router.getRoute(state.id)) {
      throw new Error(`Route ${state.id} not found`);
    }
  }

  private async notifyListeners(
    type: NavigationType,
    from: IRouteState | null,
    to: IRouteState | null,
  ): Promise<void> {
    await Promise.all(
      Array.from(this.listeners, async (listener) => {
        try {
          await listener(type, from, to);
        } catch (error) {
          console.error("Navigation listener failed", error);
        }
      }),
    );
  }

  private async checkGuards(
    to: IRouteState | null,
    from: IRouteState | null,
  ): Promise<boolean> {
    if (from) {
      for (const route of this.router.getRouteTree(from.id).reverse()) {
        if ((await route.canDeactivate?.(to, from)) === false) return false;
      }
    }
    if (to) {
      for (const route of this.router.getRouteTree(to.id)) {
        if ((await route.canActivate?.(to, from)) === false) return false;
      }
    }
    return true;
  }
}
