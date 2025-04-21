import { NodeContent } from "./NodeContent.js";
import { IframeView, useNode } from "@wroud/playground-react/views";

interface Props {
  activeNodeId: string | null;
}

export function Content({ activeNodeId }: Props) {
  const node = useNode(activeNodeId);

  return (
    <div className="twp:relative twp:flex twp:flex-col twp:flex-auto twp:overflow-auto">
      {!node || node.type === "doc" ? (
        <NodeContent activeNodeId={activeNodeId} />
      ) : (
        <IframeView nodeId={activeNodeId} />
      )}
    </div>
  );
}
