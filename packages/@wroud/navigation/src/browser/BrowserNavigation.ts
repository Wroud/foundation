/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import type { INavigation } from "../INavigation.js";
import type { IRouteState } from "../IRouteState.js";
import { NavigationType } from "../NavigationListener.js";

export class BrowserNavigation {
  private ignoreNextPopState: boolean;
  constructor(private readonly navigation: INavigation) {
    this.ignoreNextPopState = false;
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
    switch (type) {
      case NavigationType.Navigate:
        window.history.pushState(
          to,
          "",
          this.navigation.router.matcher?.stateToUrl(to),
        );
        break;
      case NavigationType.Replace:
        window.history.replaceState(
          to,
          "",
          this.navigation.router.matcher?.stateToUrl(to),
        );
        break;
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
    const state = this.navigation.router.matcher?.urlToState(
      decodeURIComponent(window.location.pathname) + window.location.search,
    );

    if (state) {
      this.navigation.removeListener(this.handleNavigation);
      await this.navigation.navigate(state);
      this.navigation.addListener(this.handleNavigation);
    }
  }

  private hashChangeHandler() {}

  dispose(): void | Promise<void> {
    window.removeEventListener("popstate", this.popStateHandler);
    window.removeEventListener("hashchange", this.hashChangeHandler);
    this.navigation.removeListener(this.handleNavigation);
  }
}
