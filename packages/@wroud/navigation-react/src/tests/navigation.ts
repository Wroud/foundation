import {
  Navigation,
  Router,
  TriePatternMatching,
  type INavigationPlatform,
  type IRouteState,
  type NavigationTransition,
} from "@wroud/navigation";

export const tick = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

export const settle = async () => {
  for (let i = 0; i < 4; i++) await tick();
};

export const route = (
  id: string,
  extra: Partial<IRouteState> = {},
): IRouteState => ({ id, params: {}, ...extra });

export function settledValue(
  promise: Promise<boolean>,
): Promise<boolean | null> {
  return Promise.race([promise, tick().then(() => null)]);
}

export function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

export function createHarness(routes: string[] = ["/", "/a", "/b"]) {
  const matcher = new TriePatternMatching({ trailingSlash: false });
  const router = new Router({ matcher });
  const navigation = new Navigation(router);
  for (const id of routes) {
    router.addRoute({ id });
  }
  const transitions: NavigationTransition<IRouteState>[] = [];
  const platform: INavigationPlatform<IRouteState> = {
    commit(transition) {
      transitions.push(transition);
      return true;
    },
  };
  navigation.setPlatform(platform);
  const finished = (index: number) => {
    const transition = transitions[index];
    if (!transition) throw new Error(`no transition at ${index}`);
    return settledValue(transition.finished);
  };
  const transition = (index: number) => {
    const found = transitions[index];
    if (!found) throw new Error(`no transition at ${index}`);
    return found;
  };
  const url = (state: IRouteState | null) => {
    if (!state) throw new Error("no state");
    const value = matcher.stateToUrl(state);
    if (value === null) throw new Error(`no url for ${state.id}`);
    return value;
  };
  return { navigation, matcher, transitions, transition, finished, url };
}
