import { useNavigation } from "@wroud/playground-react/views";
import { PlaygroundRoutes } from "@wroud/playground";

export function HomeLink() {
  const navigation = useNavigation();
  const iconUrl =
    navigation.router.matcher?.stateToUrl({
      id: PlaygroundRoutes.assets,
      params: {},
    }) + "logo.svg";

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
      {iconUrl && (
        <img src={iconUrl} alt="Playground" className="twp:w-6 twp:h-6" />
      )}
      <div className="twp:text-sm twp:font-bold">Playground</div>
    </a>
  );
}
