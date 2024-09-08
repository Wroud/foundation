import { Bumper } from "conventional-recommended-bump";

export class RestrictEmptyCommits extends Bumper {
  loadPreset(preset) {
    this.preset = preset;

    this.whatBump = async (commits) => {
      const { whatBump } = await this.getPreset();

      return whatBump(commits);
    };

    this.tagGetter = async () => {
      const { tags } = await this.getPreset();

      return this.getLastSemverTag(tags);
    };

    this.commitsGetter = async function* commitsGetter() {
      const { commits, parser } = await this.getPreset();

      yield* this.getCommits(commits, parser);
    };

    return this;
  }
  bump(whatBump = this.whatBump) {
    return super.bump((commits) => {
      if (commits.length === 0) {
        return null;
      }
      return whatBump(commits);
    });
  }
}
