import { getCombinedClasses } from "./treeClasses.js";
import type { ITreeClasses } from "./ITreeClasses.js";

/**
 * Hook that combines default and custom classes for the tree
 * @param classes - User-provided custom classes
 * @param useDefaultClasses - Whether to include default optimized styles
 * @returns Combined classes object
 */
export function useClasses(
  classes: ITreeClasses | undefined,
  useDefaultClasses: boolean,
): ITreeClasses {
  return getCombinedClasses(
    classes as Record<string, string> | undefined,
    useDefaultClasses,
  ) as ITreeClasses;
}
