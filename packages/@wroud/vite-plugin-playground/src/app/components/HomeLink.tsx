import { useBase } from "@wroud/vite-plugin-ssg/react/components";
import logo from "./logo.svg?no-inline";

export function HomeLink() {
  const base = useBase();
  return (
    <a
      aria-label="Home"
      href="/"
      className="twp:flex twp:items-center twp:gap-2"
    >
      <img src={base(logo)} alt="Playground" className="twp:w-6 twp:h-6" />
      <div className="twp:text-sm twp:font-bold">Playground</div>
    </a>
  );
}
