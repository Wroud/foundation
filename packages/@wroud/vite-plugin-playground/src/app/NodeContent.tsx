import { Template } from "./pages/Template.js";
import { useNode } from "./hooks/useNode.js";
import { Story } from "./Story.js";
import { Doc } from "./Doc.js";
interface Props {
  activeNodeId: string | null;
  preview?: boolean;
}

export function NodeContent({ activeNodeId, preview }: Props) {
  const node = useNode(activeNodeId);

  switch (node?.type) {
    case "story":
      return <Story activeStoryId={activeNodeId} preview={preview} />;
    case "doc":
      return <Doc activeDocId={activeNodeId} />;
    default:
      return <Template />;
  }
}
