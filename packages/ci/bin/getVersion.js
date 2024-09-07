#!/usr/bin/env node

import { Bumper } from "conventional-recommended-bump";

class RestrictEmptyCommits extends Bumper {
  bump(whatBump = this.whatBump) {
    return super.bump((commits) => {
      if (commits.length === 0) {
        throw new Error("No commits found");
      }
      return whatBump(commits);
    });
  }
}

const [_, __, preset, tagPrefix, commitPath] = process.argv;

const bumper = new RestrictEmptyCommits(process.cwd())
  .loadPreset(preset)
  .tag({
    prefix: tagPrefix,
  })
  .commits({ path: commitPath });

const recommendation = await bumper.bump();

console.log(recommendation.releaseType);
