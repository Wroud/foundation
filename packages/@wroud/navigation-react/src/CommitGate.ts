"use client";
import type { INavigation, IRouteState } from "@wroud/navigation";

interface Waiter {
  readonly token: string;
  readonly resolve: () => void;
}

export class CommitGate {
  private readonly navigation: INavigation;
  private readonly mounted: Map<string, number>;
  private waiting: Waiter | null;

  constructor(navigation: INavigation) {
    this.navigation = navigation;
    this.mounted = new Map();
    this.waiting = null;
  }

  tokenOf(state: IRouteState | null): string {
    if (!state) return "";
    return (
      this.navigation.router.matcher?.stateToUrl({
        ...state,
        hash: undefined,
        unknownQuery: undefined,
      }) ?? state.id
    );
  }

  isMounted(token: string): boolean {
    return this.mounted.has(token);
  }

  wait(to: IRouteState | null): Promise<void> | void {
    this.settle();
    if (!to) return;
    const token = this.tokenOf(to);
    if (this.mounted.has(token)) return;
    return new Promise<void>((resolve) => {
      this.waiting = { token, resolve };
    });
  }

  release(): void {
    this.settle();
  }

  mount(token: string): void {
    this.mounted.set(token, (this.mounted.get(token) ?? 0) + 1);
    if (this.waiting?.token === token) this.settle();
  }

  unmount(token: string): void {
    const count = (this.mounted.get(token) ?? 1) - 1;
    if (count > 0) this.mounted.set(token, count);
    else this.mounted.delete(token);
  }

  private settle(): void {
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.resolve();
  }
}
