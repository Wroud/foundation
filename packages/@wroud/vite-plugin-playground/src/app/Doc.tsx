import { useDoc } from "@wroud/playground-react/views";
import { Template } from "./pages/Template.js";

interface Props {
  activeDocId: string | null;
}

export function Doc({ activeDocId }: Props) {
  const doc = useDoc(activeDocId);

  let Component = doc?.component ?? Template;
  return <Component {...doc?.props} />;
}
