export interface ICreateConventionalChangelogOptions {
  headlineLevel?: string;
}

export function* createConventionalChangelogHeader(
  version: string,
  compareUrl?: string,
  options: ICreateConventionalChangelogOptions = {},
): Generator<string> {
  const { headlineLevel: hl = "##" } = options;

  yield `${hl} ${version}`;
  yield "";

  if (compareUrl) {
    yield `[Compare changes](${compareUrl})`;
    yield "";
  }
}
