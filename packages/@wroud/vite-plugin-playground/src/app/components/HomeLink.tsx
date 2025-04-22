import { useBase } from "@wroud/vite-plugin-ssg/react/components";
import { useNavigation } from "@wroud/playground-react/views";
import { PlaygroundRoutes } from "@wroud/playground";
import logo from "./logo.svg?no-inline";

export function HomeLink() {
  const base = useBase();
  const navigation = useNavigation();
  return (
    <a
      aria-label="Home"
      className="twp:flex twp:items-center twp:gap-2"
      href={
        navigation.router.matcher?.stateToUrl({
          id: PlaygroundRoutes.root,
          params: {},
        }) ?? "#"
      }
      onClick={(e) => {
        e.preventDefault();
        navigation.navigate({
          id: PlaygroundRoutes.root,
          params: {},
        });
      }}
    >
      <img src={base(logo)} alt="Playground" className="twp:w-6 twp:h-6" />
      <div className="twp:text-sm twp:font-bold">Playground</div>
    </a>
  );
}
