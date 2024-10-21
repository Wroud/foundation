import { conventionalChangelogMarkers } from "./conventionalChangelogMarkers.js";

export interface ICreateConventionalChangelogHeaderOptions {
  headlineLevel?: string;
}

export function* createConventionalChangelogHeader(
  version: string,
  compareUrl?: string,
  options: ICreateConventionalChangelogHeaderOptions = {},
): Generator<string> {
  const { headlineLevel: hl = "##" } = options;

  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-CA", {
    year: "numeric",
    day: "2-digit",
    month: "2-digit",
  });

  yield conventionalChangelogMarkers.version(version);
  yield `${hl} ${version} (${formattedDate})`;
  yield "";

  if (compareUrl) {
    yield `[Compare changes](${compareUrl})`;
    yield "";
  }
}
