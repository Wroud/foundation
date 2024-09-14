export interface ICreateConventionalChangelogOptions {
  headlineLevel?: string;
}

export function* createChangelogHeader(
  title = "Changelog",
  description = "All notable changes to this project will be documented in this file.",
  options: ICreateConventionalChangelogOptions = {},
): Generator<string> {
  const { headlineLevel: hl = "#" } = options;

  yield `${hl} ${title}`;
  yield "";

  if (description) {
    yield description;
    yield "";
  }
}
