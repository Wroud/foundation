interface IGetTsConfigTemplate {
  target: string;
}
export const getTsConfigTemplate = (
  { target }: IGetTsConfigTemplate = { target: "esnext" },
) => `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "include": [],
  "compilerOptions": {
    "target": "${target}",
    "lib": [
      "esnext"
    ],
    "module": "nodenext",
    "skipLibCheck": true,
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "importHelpers": true,
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "verbatimModuleSyntax": true,
    "checkJs": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    /* Source maps */
    "sourceMap": true,
    /* project references */
    "declarationMap": true
  }
}
`;
