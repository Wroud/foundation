import { Hooks, Plugin } from "@yarnpkg/core";
import { link } from "@wroud/ts-project-linker";

const plugin: Plugin<Hooks> = {
  hooks: {
    afterAllInstalled: async (project, options) => {
      await link(
        {
          immutable: options.immutable,
        },
        ...project.workspaces.map((workspace) => workspace.cwd),
      );
    },
  },
};

export default plugin;
