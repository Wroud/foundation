import { NodeContent } from "../NodeContent.js";

interface Props {
  activeNodeId: string | null;
  preview?: boolean;
}

export function Isolation({ activeNodeId, preview }: Props) {
  return <NodeContent activeNodeId={activeNodeId} preview={preview} />;
}
