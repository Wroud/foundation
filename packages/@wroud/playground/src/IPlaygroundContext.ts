import type { INavigation, TriePatternMatching } from "@wroud/navigation";
import type { IAppContext } from "@wroud/vite-plugin-ssg/app";

export interface IPlaygroundContext extends IAppContext {
  navigation: INavigation<TriePatternMatching>;
}
