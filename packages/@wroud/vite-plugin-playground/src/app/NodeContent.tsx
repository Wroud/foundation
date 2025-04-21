import { Template } from "./pages/Template.js";
import { Story } from "./Story.js";
import { Doc } from "./Doc.js";
import { useNode } from "@wroud/playground-react/views";
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
