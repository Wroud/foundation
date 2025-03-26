import type { INavigation, IRouteMatcher } from "@wroud/navigation";
import { useAppStartData } from "./AppStartDataContext.js";

export function useNavigation<
  TMatcher extends IRouteMatcher = IRouteMatcher,
>(): INavigation<TMatcher> {
  return useAppStartData().navigation as INavigation<TMatcher>;
}
