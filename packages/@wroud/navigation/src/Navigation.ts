import type { INavigation } from "./INavigation.js";
import type { INavigationState } from "./INavigationState.js";
import type { IRouteState } from "./IRouteState.js";
import type { IRouter } from "./IRouter.js";
import {
  NavigationType,
  type NavigationListener,
} from "./NavigationListener.js";
import { Router } from "./Router.js";
import { LinkedList } from "./sdk/LinkedList.js";

export class Navigation implements INavigation {
  get state(): IRouteState | null {
    return this.innerState.history.get(this.innerState.position) || null;
  }

  get history(): IRouteState[] {
    return this.innerState.history.toArray();
  }

  get position(): number {
    return this.innerState.position;
  }

  private innerState: INavigationState;
  private readonly listeners: Set<NavigationListener>;
  readonly router: IRouter;

  constructor(router?: IRouter) {
    this.router = router || new Router();
    this.listeners = new Set();
    this.innerState = {
      position: -1,
      history: new LinkedList(),
    };

    this.addListener = this.addListener.bind(this);
    this.getState = this.getState.bind(this);
  }

  /**
   * Get the current navigation state
   */
  getState(): IRouteState | null {
    return this.state;
  }

  /**
   * Set the navigation state and position
   */
  setState(position: number, state?: IRouteState[]) {
    this.innerState = {
      position,
      history: new LinkedList(state || []),
    };
  }

  /**
   * Replace the current state with a new one
   */
  async replace(state: IRouteState | null) {
    if (state) {
      const route = this.router.getRoute(state.id);

      if (!route) {
        throw new Error(`Route ${state.id} not found`);
      }
    }

    if (
      !(await this.canDeactivate(state)) ||
      !(await this.canActivate(state))
    ) {
      return;
    }

    const previousState = this.state;

    if (state) {
      this.innerState.history.set(this.innerState.position, state);
    } else {
      this.innerState.history.setHead(null);
    }

    this.notifyListeners(NavigationType.Replace, previousState, state);
  }

  /**
   * Navigate to a new state
   */
  async navigate(state: IRouteState | null) {
    if (state) {
      const route = this.router.getRoute(state.id);

      if (!route) {
        throw new Error(`Route ${state.id} not found`);
      }
    }

    if (
      !(await this.canDeactivate(state)) ||
      !(await this.canActivate(state))
    ) {
      return;
    }

    const previousState = this.state;
    if (this.innerState.position < this.innerState.history.size - 1) {
      this.innerState.history.removeFrom(this.innerState.position + 1);
    }

    if (state) {
      this.innerState.history.push(state);
    } else {
      this.innerState.history.setHead(null);
    }

    this.innerState.position++;
    this.notifyListeners(NavigationType.Navigate, previousState, state);
  }

  /**
   * Navigate back to the previous state
   */
  async goBack() {
    if (this.position === 0) {
      return;
    }
    const state =
      this.innerState.history.get(this.innerState.position - 1) || null;

    if (
      !(await this.canDeactivate(state)) ||
      !(await this.canActivate(state))
    ) {
      return;
    }

    const previousState = this.state;
    this.innerState.position--;
    this.notifyListeners(NavigationType.Back, previousState, state);
  }

  /**
   * Add a navigation listener
   */
  addListener(listener: NavigationListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a navigation listener
   */
  removeListener(listener: NavigationListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a navigation event
   */
  private notifyListeners(
    type: NavigationType,
    from: IRouteState | null,
    to: IRouteState | null,
  ) {
    for (const listener of this.listeners) {
      listener(type, from, to);
    }
  }

  /**
   * Check if we can deactivate from the current route
   */
  private async canDeactivate(state: IRouteState | null): Promise<boolean> {
    const currentState = this.state;
    if (!currentState) {
      return true;
    }

    const deactivationTree = this.router
      .getRouteTree(currentState.id)
      .reverse();

    for (const route of deactivationTree) {
      if (route.canDeactivate) {
        const result = await route.canDeactivate(state, currentState);

        if (result === false) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if we can activate the target route
   */
  private async canActivate(state: IRouteState | null): Promise<boolean> {
    if (!state) {
      return true;
    }

    const currentState = this.state;
    const activationTree = this.router.getRouteTree(state.id);

    for (const route of activationTree) {
      if (route.canActivate) {
        const result = await route.canActivate(state, currentState || null);

        if (result === false) {
          return false;
        }
      }
    }

    return true;
  }
}
