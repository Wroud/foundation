import {
  BaseDocumentsVisitor,
  getConfigValue,
  type ParsedDocumentsConfig,
  type RawDocumentsConfig,
} from "@graphql-codegen/visitor-plugin-common";
import { GraphQLSchema, type OperationDefinitionNode } from "graphql";
import { pascalCase } from "change-case-all";

export class TypeScriptDocumentsVisitor extends BaseDocumentsVisitor {
  constructor(schema: GraphQLSchema, config: RawDocumentsConfig) {
    super(
      config,
      {
        nonOptionalTypename: getConfigValue(config.nonOptionalTypename, false),
        preResolveTypes: getConfigValue(config.preResolveTypes, true),
        mergeFragmentTypes: getConfigValue(config.mergeFragmentTypes, false),
      } as ParsedDocumentsConfig,
      schema,
    );
  }

  getOperationName(operationNode: OperationDefinitionNode): string {
    return this.convertName(operationNode, {
      suffix: this._parsedConfig.operationResultSuffix,
    });
  }

  getOperationResultType(operationNode: OperationDefinitionNode): string {
    const operationType: string = pascalCase(operationNode.operation);
    const operationTypeSuffix = this.getOperationSuffix(
      operationNode,
      operationType,
    );

    return this.convertName(operationNode, {
      suffix: operationTypeSuffix + this._parsedConfig.operationResultSuffix,
    });
  }
}
