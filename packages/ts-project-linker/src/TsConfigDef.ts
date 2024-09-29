export interface ITsConfigReferenceDef {
  path: string;
}

export interface ITsConfigCompilerOptionsDef {
  noEmit?: boolean;
  composite?: boolean;
}

export interface TsConfigDef {
  compilerOptions?: ITsConfigCompilerOptionsDef;
  references?: ITsConfigReferenceDef[];
}
