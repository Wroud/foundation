export class KeyMap {
  private readonly toBase: Map<string, string>;
  private readonly toPlatform: Map<string, string>;

  constructor() {
    this.toBase = new Map();
    this.toPlatform = new Map();
  }

  base(platformKey: string | null | undefined): string | null {
    return platformKey == null ? null : (this.toBase.get(platformKey) ?? null);
  }

  platform(baseKey: string): string | null {
    return this.toPlatform.get(baseKey) ?? null;
  }

  set(platformKey: string, baseKey: string): void {
    const staleBase = this.toBase.get(platformKey);
    if (staleBase !== undefined) this.toPlatform.delete(staleBase);
    const stalePlatform = this.toPlatform.get(baseKey);
    if (stalePlatform !== undefined) this.toBase.delete(stalePlatform);
    this.toBase.set(platformKey, baseKey);
    this.toPlatform.set(baseKey, platformKey);
  }

  prune(live: Set<string>): void {
    for (const [baseKey, platformKey] of this.toPlatform) {
      if (!live.has(baseKey)) {
        this.toPlatform.delete(baseKey);
        this.toBase.delete(platformKey);
      }
    }
  }
}
