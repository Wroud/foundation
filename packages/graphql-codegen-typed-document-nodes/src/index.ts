import {
  type PluginFunction,
  type Types,
} from "@graphql-codegen/plugin-helpers";
import {
  concatAST,
  type DefinitionNode,
  GraphQLSchema,
  Kind,
  type OperationDefinitionNode,
} from "graphql";
import { TypeScriptDocumentsVisitor } from "./visitor.js";
import type { RawDocumentsConfig } from "@graphql-codegen/visitor-plugin-common";

export const plugin: PluginFunction<
  RawDocumentsConfig,
  Types.ComplexPluginOutput
> = (
  schema: GraphQLSchema,
  rawDocuments: Types.DocumentFile[],
  config: RawDocumentsConfig,
) => {
  const allAst = concatAST(rawDocuments.map((doc) => doc.document!));

  const visitor = new TypeScriptDocumentsVisitor(schema, config);

  const exportConsts = generateExportTypes(allAst.definitions, visitor);
  const content = [...exportConsts].join("\n");

  return {
    content,
  };
};

/**
 * Generates export type definitions for operations and fragments.
 */
function generateExportTypes(
  definitions: readonly DefinitionNode[],
  visitor: TypeScriptDocumentsVisitor,
): string[] {
  const exportTypes: string[] = [];

  for (const def of definitions) {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      const operationNode = def as OperationDefinitionNode;
      const operationName = visitor.getOperationName(operationNode);
      const resultType = visitor.getOperationResultType(operationNode);
      const variablesType = visitor.convertName(resultType, {
        suffix: "Variables",
      });

      exportTypes.push(
        `export type ${operationName}Document = Types.TypedDocumentNode<${resultType}, ${variablesType}>;`,
      );
    } else if (def.kind === Kind.FRAGMENT_DEFINITION) {
      const fragmentName = visitor.getFragmentName(def);
      exportTypes.push(
        `export type ${fragmentName}Doc = Types.TypedDocumentNode<${fragmentName}, void>;`,
      );
    }
  }

  return exportTypes;
}
