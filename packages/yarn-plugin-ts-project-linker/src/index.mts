import { Hooks, Plugin } from "@yarnpkg/core";
import { link } from "@wroud/ts-project-linker";
import { npath } from "@yarnpkg/fslib";

const plugin: Plugin<Hooks> = {
  hooks: {
    afterAllInstalled: async (project, options) => {
      await link(
        {
          immutable: options.immutable,
        },
        ...project.workspaces.map((workspace) =>
          npath.fromPortablePath(workspace.cwd),
        ),
      );
    },
  },
};

export default plugin;
