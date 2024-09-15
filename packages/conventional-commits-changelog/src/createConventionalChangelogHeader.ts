export interface ICreateConventionalChangelogHeaderOptions {
  headlineLevel?: string;
}

export function* createConventionalChangelogHeader(
  version: string,
  compareUrl?: string,
  options: ICreateConventionalChangelogHeaderOptions = {},
): Generator<string> {
  const { headlineLevel: hl = "##" } = options;

  yield `${hl} ${version}`;
  yield "";

  if (compareUrl) {
    yield `[Compare changes](${compareUrl})`;
    yield "";
  }
}
