/**
 * Default class names for the Tree component
 * These class names match the selectors in Tree.css
 */
export const treeClasses = {
  root: "react-tree-root",
  content: "react-tree-content",
  node: "react-tree-node",
  nodeSelected: "react-tree-node-selected",
  nodeExpanded: "react-tree-node-expanded",
  nodeControl: "react-tree-node-control",
  nodeContent: "react-tree-node-content",
  expandControl: "react-tree-expand-control",
  children: "react-tree-children",
  rootChildren: "react-tree-root-children",
  virtualGap: "react-tree-virtual-gap",
};

/**
 * Get class names combined with optional custom classes
 *
 * @param customClasses - User-provided custom classes
 * @param useDefaultClasses - Whether to include default optimized styles
 * @returns Combined classes object
 */
export function getCombinedClasses(
  customClasses: Record<string, string> | undefined,
  useDefaultClasses: boolean = true,
) {
  if (!useDefaultClasses) {
    return customClasses ?? {};
  }

  // Start with default classes
  const merged = { ...treeClasses };

  // If no custom classes, return defaults
  if (!customClasses) {
    return merged;
  }

  // Combine user classes with defaults
  for (const key in customClasses) {
    const userClass = customClasses[key];

    // Skip empty classes
    if (!userClass) continue;

    // If we have both default and user class, combine them
    if (merged[key as keyof typeof treeClasses]) {
      merged[key as keyof typeof treeClasses] =
        `${merged[key as keyof typeof treeClasses]} ${userClass}`;
    } else {
      // If only user class exists, use it
      (merged as Record<string, string>)[key] = userClass;
    }
  }

  return merged;
}
