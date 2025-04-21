import { useNode } from "../hooks/useNode.js";
import { useState, useRef, useEffect } from "react";
import { Loader } from "../svg/Loader.js";
import { PlaygroundRoutes } from "@wroud/playground";
import { useNavigation } from "../hooks/useNavigation.js";
interface IIframeViewProps {
  nodeId: string | null;
  preview?: boolean;
}

export function IframeView({ nodeId, preview = false }: IIframeViewProps) {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const node = useNode(nodeId);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument?.readyState === "complete") {
      setLoading(false);
    }
  }, []);

  if (node === null || nodeId === null) {
    return (
      <div>
        <h1>404</h1>
        <p>Node not found</p>
      </div>
    );
  }

  const url =
    navigation.router.matcher?.stateToUrl({
      id: preview ? PlaygroundRoutes.preview : PlaygroundRoutes.isolated,
      params: { story: nodeId.slice(1).split("/") },
    }) ?? null;

  if (url === null) {
    return (
      <div>
        <h1>404</h1>
        <p>Node not found</p>
      </div>
    );
  }
  return (
    <div className="twp:relative twp:h-full twp:w-full">
      <iframe
        ref={iframeRef}
        src={url}
        onLoad={() => setLoading(false)}
        className="twp:h-full twp:w-full"
      />
      {loading && (
        <div className="twp:absolute twp:inset-0 twp:flex twp:items-center twp:justify-center twp:bg-white/50 twp:dark:bg-gray-900/50">
          <Loader />
        </div>
      )}
    </div>
  );
}
