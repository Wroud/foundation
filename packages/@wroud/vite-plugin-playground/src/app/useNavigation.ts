import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";
import type { IPlaygroundContext } from "./IPlaygroundContext.js";

export function useNavigation() {
  const appContext = useAppContext<IPlaygroundContext>();

  return appContext.navigation;
}
