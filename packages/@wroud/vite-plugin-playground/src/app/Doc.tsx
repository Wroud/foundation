import { Template } from "./pages/Template.js";
import { useDoc } from "./hooks/useDoc.js";

interface Props {
  activeDocId: string | null;
}

export function Doc({ activeDocId }: Props) {
  const doc = useDoc(activeDocId);

  let Component = doc?.component ?? Template;
  return <Component {...doc?.props} />;
}
