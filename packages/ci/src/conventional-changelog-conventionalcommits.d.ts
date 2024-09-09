declare module "conventional-changelog-conventionalcommits" {
  export type Preset = import("conventional-changelog-core").Options.Config;

  export default function createPreset(options?: any): Promise<Preset>;
}
