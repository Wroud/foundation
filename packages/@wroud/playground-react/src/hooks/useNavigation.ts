import type { IPlaygroundContext } from "@wroud/playground";
import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";

export function useNavigation() {
  const appContext = useAppContext<IPlaygroundContext>();

  return appContext.navigation;
}
