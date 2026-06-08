/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import type { INavigation } from "../INavigation.js";
import type { IRouteState } from "../IRouteState.js";
import { NavigationType } from "../NavigationListener.js";

export class BrowserNavigation {
  private ignoreNextPopState: boolean;
  private ignoreNextHashChange: boolean;
  private skipNextHashChange: boolean;
  constructor(private readonly navigation: INavigation) {
    this.ignoreNextPopState = false;
    this.ignoreNextHashChange = false;
    this.skipNextHashChange = false;
    this.popStateHandler = this.popStateHandler.bind(this);
    this.hashChangeHandler = this.hashChangeHandler.bind(this);
    this.handleNavigation = this.handleNavigation.bind(this);
  }

  async registerRoutes(): Promise<void> {
    this.addBrowserNavigation();
    await this.restoreNavigation();
  }

  private addBrowserNavigation() {
    window.addEventListener("popstate", this.popStateHandler);
    window.addEventListener("hashchange", this.hashChangeHandler);
    this.navigation.addListener(this.handleNavigation);
  }

  private async restoreNavigation() {
    await this.popStateHandler();
  }

  private handleNavigation(
    type: NavigationType,
    from: IRouteState | null,
    to: IRouteState | null,
  ) {
    const matcher = this.navigation.router.matcher;
    const url = to ? (matcher?.stateToUrl(to) ?? undefined) : undefined;
    switch (type) {
      case NavigationType.Navigate: {
        if (this.isBrowserAt(to)) {
          window.history.replaceState(to, "", url);
          break;
        }
        if (to?.hash) {
          if (this.isHashOnlyChange(from, to)) {
            this.ignoreNextHashChange = true;
            window.location.hash = to.hash;
            window.history.replaceState(to, "", url);
            break;
          }
          if (this.tryNativeNavigate(url, "push", to)) {
            break;
          }
          window.history.pushState(to, "", url);
          this.applyFragment(to);
          break;
        }
        window.history.pushState(to, "", url);
        break;
      }
      case NavigationType.Replace: {
        if (this.isBrowserAt(to)) {
          window.history.replaceState(to, "", url);
          break;
        }
        if (to?.hash) {
          if (
            !this.isHashOnlyChange(from, to) &&
            this.tryNativeNavigate(url, "replace", to)
          ) {
            break;
          }
          window.history.replaceState(to, "", url);
          this.applyFragment(to);
          break;
        }
        window.history.replaceState(to, "", url);
        break;
      }
      case NavigationType.Back:
        this.ignoreNextPopState = true;
        window.history.back();
        break;
      case NavigationType.Forward:
        this.ignoreNextPopState = true;
        window.history.forward();
        break;
    }
  }

  private async popStateHandler() {
    if (this.ignoreNextPopState) {
      this.ignoreNextPopState = false;
      return;
    }
    this.skipNextHashChange = true;
    queueMicrotask(() => {
      this.skipNextHashChange = false;
    });
    await this.syncFromLocation();
  }

  private hashChangeHandler() {
    if (this.ignoreNextHashChange) {
      this.ignoreNextHashChange = false;
      return;
    }
    if (this.skipNextHashChange) {
      this.skipNextHashChange = false;
      return;
    }
    void this.syncFromLocation();
  }

  private async syncFromLocation() {
    const state = this.navigation.router.matcher?.urlToState(this.currentUrl());

    if (state) {
      await this.navigation.navigate(state);
    }
  }

  private currentUrl(): string {
    return (
      decodeURIComponent(window.location.pathname) +
      window.location.search +
      window.location.hash
    );
  }

  private isBrowserAt(state: IRouteState | null): boolean {
    const matcher = this.navigation.router.matcher;
    if (!matcher || !state) {
      return false;
    }
    const target = matcher.stateToUrl(state);
    if (target == null) {
      return false;
    }
    const current = matcher.urlToState(this.currentUrl());
    return current != null && matcher.stateToUrl(current) === target;
  }

  private isHashOnlyChange(
    from: IRouteState | null,
    to: IRouteState | null,
  ): boolean {
    const matcher = this.navigation.router.matcher;
    if (!matcher || !from || !to) {
      return false;
    }
    return (
      matcher.stateToUrl({ ...from, hash: undefined }) ===
      matcher.stateToUrl({ ...to, hash: undefined })
    );
  }

  private tryNativeNavigate(
    url: string | undefined,
    history: "push" | "replace",
    state: IRouteState | null,
  ): boolean {
    if (url == null) {
      return false;
    }
    const nav = window.navigation;
    if (!nav || typeof nav.navigate !== "function") {
      return false;
    }
    let result: NavigationResult;
    try {
      result = nav.navigate(url, { history, state });
    } catch {
      return false;
    }
    result.committed?.catch(() => {});
    result.finished?.catch(() => {});
    return true;
  }

  private applyFragment(state: IRouteState | null) {
    const hash = state?.hash;
    if (!hash) {
      return;
    }
    if (hash === "#" || hash.toLowerCase() === "#top") {
      window.scrollTo(0, 0);
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const element =
      window.document.getElementById(id) ??
      window.document.getElementsByName(id)[0] ??
      null;

    if (!element) {
      return;
    }

    element.scrollIntoView();
    element.focus({ preventScroll: true });
    if (window.document.activeElement !== element) {
      element.setAttribute("tabindex", "-1");
      element.focus({ preventScroll: true });
    }
  }

  dispose(): void | Promise<void> {
    window.removeEventListener("popstate", this.popStateHandler);
    window.removeEventListener("hashchange", this.hashChangeHandler);
    this.navigation.removeListener(this.handleNavigation);
  }
}
