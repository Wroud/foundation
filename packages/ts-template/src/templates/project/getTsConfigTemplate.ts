interface IGetTsConfigTemplate {
  parentConfig: string;
  target?: string;
}
export const getTsConfigTemplate = ({
  parentConfig,
  target,
}: IGetTsConfigTemplate) => `{
  "extends": "${parentConfig}",
  "compilerOptions": {
    "tsBuildInfoFile": "./lib/.tsbuildinfo",
    "rootDir": "src",
    "rootDirs": [
      "src"
    ],
    "outDir": "lib",${target ? `\n    "target": "${target}",` : ""}
    "incremental": true,
    "composite": true
  },
  "include": [
    "src"
  ]
}
`;
