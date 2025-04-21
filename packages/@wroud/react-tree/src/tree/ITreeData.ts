import type { INode } from "../node/INode.js";
import type { INodeState } from "../node/INodeState.js";

export interface ITreeData {
  rootId: string;

  getNode(id: string): INode;
  getParent?(id: string): string | null;
  getChildren: (node: string) => string[];
  getState(id: string): Readonly<INodeState>;

  updateStateAll(state: Partial<INodeState>): void;
  updateState(id: string, state: Partial<INodeState>): void;

  update?(): Promise<void>;
  load?(nodeId: string, manual: boolean): Promise<void>;
}
