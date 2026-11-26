import { NodeContent } from "./NodeContent.js";
import { useNode } from "@wroud/playground-react/views";
import { StoryView } from "./StoryView.js";

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
        <StoryView nodeId={activeNodeId} />
      )}
    </div>
  );
}
