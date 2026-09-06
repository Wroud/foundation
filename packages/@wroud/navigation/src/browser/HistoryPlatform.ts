import type { INavigation } from "../INavigation.js";
import type { INavigationEntry } from "../INavigationEntry.js";
import type { IRouteState } from "../IRouteState.js";
import { NavigationType } from "../NavigationListener.js";
import { decodePathSegment } from "../pattern-matching/path-utils.js";
import type { Inbound, Platform, Transition } from "./Platform.js";
import { currentUrl, isBrowserAt, readKey } from "./url.js";

const TRAVERSAL_TIMEOUT = 2000;

interface Pending {
  key: string;
  resolve: (arrived: boolean) => void;
  timer: number;
}

interface ScrollPosition {
  x: number;
  y: number;
}

function isTraversal(t: Transition): boolean {
  return t.type === NavigationType.Back || t.type === NavigationType.Forward;
}

function indexOf(
  entries: readonly INavigationEntry<IRouteState>[],
  key: string | null,
): number {
  return key === null ? -1 : entries.findIndex((entry) => entry.key === key);
}

export class HistoryPlatform implements Platform {
  private inbound: Inbound | null;
  private pending: Pending | null;
  private queue: Promise<void>;
  private current: string | null;
  private length: number;
  private scrollRestoration: ScrollRestoration;
  private manual: boolean;
  private latest: Transition | null;
  private settled: Transition | null;
  private readonly stamped: Set<string>;
  private readonly scrollPositions: Map<string, ScrollPosition>;

  constructor(private readonly navigation: INavigation) {
    this.inbound = null;
    this.pending = null;
    this.queue = Promise.resolve();
    this.current = null;
    this.length = 0;
    this.scrollRestoration = "auto";
    this.manual = false;
    this.latest = null;
    this.settled = null;
    this.stamped = new Set();
    this.scrollPositions = new Map();
    this.onPopState = this.onPopState.bind(this);
    this.onHashChange = this.onHashChange.bind(this);
    this.onPageHide = this.onPageHide.bind(this);
    this.onPageShow = this.onPageShow.bind(this);
  }

  get key(): string | null {
    this.observe();
    return this.current;
  }

  knows(key: string): boolean {
    this.observe();
    return this.stamped.has(key);
  }

  attach(inbound: Inbound): void {
    this.inbound = inbound;
    this.length = window.history.length;
    this.scrollRestoration = window.history.scrollRestoration;
    this.manual = false;
    const key = readKey(window.history.state);
    if (key !== null && indexOf(this.navigation.entries, key) !== -1) {
      this.stamp(key);
    }
    window.addEventListener("popstate", this.onPopState);
    window.addEventListener("hashchange", this.onHashChange);
    window.addEventListener("pagehide", this.onPageHide);
    window.addEventListener("pageshow", this.onPageShow);
  }

  detach(): void {
    window.removeEventListener("popstate", this.onPopState);
    window.removeEventListener("hashchange", this.onHashChange);
    window.removeEventListener("pagehide", this.onPageHide);
    window.removeEventListener("pageshow", this.onPageShow);
    window.history.scrollRestoration = this.scrollRestoration;
    this.settlePending();
    this.inbound = null;
    this.current = null;
    this.latest = null;
    this.settled = null;
    this.scrollPositions.clear();
    this.stamped.clear();
  }

  async push(t: Transition, url: string | null): Promise<boolean> {
    this.settlePending();
    this.takeScrollRestoration();
    this.saveScroll(t.from);
    this.restamp();
    window.history.pushState({ key: t.to.key }, "", url ?? undefined);
    this.length = window.history.length;
    this.stamp(t.to.key);
    this.commit(t, () => this.scrollAfterCommit(t.to, true));
    return true;
  }

  async stay(t: Transition, url: string | null): Promise<boolean> {
    this.settlePending();
    const traversal = isTraversal(t);
    const replace = t.type === NavigationType.Replace;
    const at = t.from !== null && this.current === t.from.key;
    if (url !== null || traversal) this.takeScrollRestoration();
    if (!replace) this.saveScroll(t.from);
    if (
      url !== null ||
      !traversal ||
      readKey(window.history.state) !== t.to.key
    ) {
      window.history.replaceState({ key: t.to.key }, "", url ?? undefined);
    }
    this.stamp(t.to.key);
    const scroll =
      url !== null || (replace && at)
        ? () => this.scrollAfterCommit(t.to, !replace)
        : traversal
          ? () => this.restoreScroll(t.to.key)
          : null;
    this.commit(t, scroll);
    return true;
  }

  traverse(t: Transition): Promise<boolean> {
    const from = indexOf(this.navigation.entries, this.key);
    if (from === -1 || this.current === null) return Promise.resolve(false);
    this.takeScrollRestoration();
    this.saveScroll(t.from);
    this.settlePending();
    this.restamp();
    return new Promise<boolean>((resolve) => {
      this.go(t.to.key, t.index - from, (arrived) => {
        if (arrived) this.latest = t;
        resolve(arrived);
      });
    });
  }

  revert(key: string): void {
    const entries = this.navigation.entries;
    const from = indexOf(entries, this.key);
    const to = indexOf(entries, key);
    if (from === -1 || to === -1 || from === to) return;
    this.settlePending();
    this.go(key, to - from, () => {});
  }

  private go(
    key: string,
    delta: number,
    resolve: (arrived: boolean) => void,
  ): void {
    const pending: Pending = { key, resolve, timer: 0 };
    pending.timer = window.setTimeout(() => {
      if (this.pending !== pending) return;
      this.pending = null;
      resolve(false);
    }, TRAVERSAL_TIMEOUT);
    this.pending = pending;
    window.history.go(delta);
  }

  private settle(pending: Pending, arrived: boolean): void {
    window.clearTimeout(pending.timer);
    pending.resolve(arrived);
  }

  private commit(t: Transition, scroll: (() => void) | null): void {
    this.latest = t;
    void t.finished.then((applied) => {
      this.prune();
      if (!applied || this.latest !== t) return;
      this.settled = t;
      scroll?.();
    });
  }

  private takeScrollRestoration(): void {
    if (this.manual) return;
    this.manual = true;
    window.history.scrollRestoration = "manual";
  }

  private onPageHide(): void {
    window.history.scrollRestoration = this.scrollRestoration;
  }

  private onPageShow(event: PageTransitionEvent): void {
    if (event.persisted && this.manual) {
      window.history.scrollRestoration = "manual";
    }
  }

  private stamp(key: string): void {
    this.current = key;
    this.stamped.add(key);
  }

  private restamp(): void {
    const key = this.current;
    if (key !== null && readKey(window.history.state) !== key) {
      window.history.replaceState({ key }, "");
    }
  }

  private observe(): void {
    const entries = this.navigation.entries;
    const moved = window.history.length !== this.length;
    if (moved) {
      this.length = window.history.length;
      for (const entry of entries.slice(this.navigation.position + 1)) {
        this.stamped.delete(entry.key);
      }
    }
    const current = this.current;
    if (current === null) return;
    const entry = entries[indexOf(entries, current)];
    const at =
      entry !== undefined &&
      (entry.state === null ||
        isBrowserAt(this.navigation.router.matcher, entry.state));
    if ((moved && readKey(window.history.state) !== current) || !at) {
      this.current = null;
    }
  }

  private onPopState(): void {
    this.observe();
    const key = readKey(window.history.state);
    this.current = key !== null && this.stamped.has(key) ? key : null;
    const pending = this.pending;
    if (pending) {
      this.pending = null;
      const arrived = this.current === pending.key;
      this.settle(pending, arrived);
      if (arrived) return;
    }
    this.enqueue();
  }

  private onHashChange(): void {
    if (this.pending === null) this.enqueue();
  }

  private enqueue(): void {
    this.queue = this.queue
      .then(() => this.sync())
      .catch((error: unknown) => {
        console.error("Navigation sync failed", error);
      });
  }

  private async sync(): Promise<void> {
    const inbound = this.inbound;
    const key = this.key;
    const currentKey = this.navigation.currentEntry?.key;
    if (!inbound || key === currentKey) return;
    if (this.pending !== null && this.pending.key === currentKey) return;
    if (key !== this.pending?.key) this.settlePending();
    if (key !== null && indexOf(this.navigation.entries, key) !== -1) {
      await inbound.traverse(key);
    } else {
      await inbound.adopt(currentUrl(), false);
    }
  }

  private settlePending(): void {
    const pending = this.pending;
    if (pending) {
      this.pending = null;
      this.settle(pending, false);
    }
  }

  private prune(): void {
    const live = new Set(this.navigation.entries.map((entry) => entry.key));
    for (const key of this.scrollPositions.keys()) {
      if (!live.has(key)) this.scrollPositions.delete(key);
    }
    for (const key of this.stamped) {
      if (!live.has(key)) this.stamped.delete(key);
    }
  }

  private saveScroll(entry: INavigationEntry<IRouteState> | null): void {
    if (entry && this.settled?.to.key === entry.key) {
      this.scrollPositions.set(entry.key, {
        x: window.scrollX,
        y: window.scrollY,
      });
    }
  }

  private restoreScroll(key: string): void {
    const saved = this.scrollPositions.get(key);
    if (saved) {
      window.scrollTo(saved.x, saved.y);
      return;
    }
    const hash = window.location.hash;
    if (hash) this.applyFragment(hash);
  }

  private scrollAfterCommit(
    entry: INavigationEntry<IRouteState>,
    top: boolean,
  ): void {
    const hash = entry.state?.hash;
    if (hash) this.applyFragment(hash);
    else if (top) window.scrollTo(0, 0);
  }

  private applyFragment(hash: string): void {
    const fragment = hash.slice(1);
    const element =
      this.findFragment(fragment) ??
      this.findFragment(decodePathSegment(fragment));
    if (!element) {
      if (fragment === "" || fragment.toLowerCase() === "top") {
        window.scrollTo(0, 0);
      }
      return;
    }

    element.scrollIntoView();
    element.focus({ preventScroll: true });
    if (window.document.activeElement === element) return;
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
    if (window.document.activeElement === element) {
      element.addEventListener(
        "blur",
        () => element.removeAttribute("tabindex"),
        { once: true },
      );
    } else {
      element.removeAttribute("tabindex");
    }
  }

  private findFragment(fragment: string): HTMLElement | null {
    if (fragment === "") return null;
    const byId = window.document.getElementById(fragment);
    if (byId) return byId;
    for (const named of window.document.getElementsByName(fragment)) {
      if (named.localName === "a") return named;
    }
    return null;
  }
}
