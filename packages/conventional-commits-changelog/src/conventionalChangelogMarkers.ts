export const conventionalChangelogMarkers = {
  header: "<!-- header -->",
  version: (version: string) => `<!-- version:${version} -->`,
  changelog: "<!-- changelog -->",
  isVersionMarker: (line: string) => line.startsWith("<!-- version:"),
};
