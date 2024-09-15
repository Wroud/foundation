export const markdownMarkers = {
  header: "<!-- header -->",
  version: (version: string) => `<!-- version:${version} -->`,
  isVersionMarker: (line: string) => line.startsWith("<!-- version:"),
};
