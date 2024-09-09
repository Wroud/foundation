import type { Preset } from "conventional-changelog-conventionalcommits";
import type { Commit } from "conventional-commits-parser";
import { Bumper } from "conventional-recommended-bump";

export class RestrictEmptyCommits extends Bumper {
  // @ts-ignore
  override loadPreset(preset: Preset) {
    // @ts-ignore
    this.preset = preset;

    // @ts-ignore
    this.whatBump = async (commits: Commit[]) => {
      // @ts-ignore
      const { whatBump } = await this.getPreset();

      return whatBump(commits);
    };

    // @ts-ignore
    this.tagGetter = async () => {
      // @ts-ignore
      const { tags } = await this.getPreset();

      // @ts-ignore
      return this.getLastSemverTag(tags);
    };

    // @ts-ignore
    this.commitsGetter = async function* commitsGetter() {
      // @ts-ignore
      const { commits, parser } = await this.getPreset();

      // @ts-ignore
      yield* this.getCommits(commits, parser);
    };

    return this;
  }
  // @ts-ignore
  bump(whatBump = this.whatBump) {
    return super.bump((commits) => {
      if (commits.length === 0) {
        return null;
      }
      return whatBump(commits);
    });
  }
}
