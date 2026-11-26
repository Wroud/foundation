import { describe, story } from "@wroud/playground-react";
import { useSplitView } from "@wroud/react-split-view";
import { z } from "zod";

describe("@wroud/react-split-view", () => {
  story(
    "Configurable",
    function ConfigurableSplitStory({
      direction,
      sticky,
      first,
      second,
      sashColor,
      showSecond,
    }) {
      const split = useSplitView<HTMLDivElement>({ sticky });
      return (
        <main
          style={{
            display: "flex",
            flexDirection: direction,
            height: "100vh",
            fontFamily: "sans-serif",
          }}
        >
          <div
            {...split.viewProps}
            data-testid="first"
            style={{ flex: 1, overflow: "auto", padding: 16 }}
          >
            {first}
          </div>
          <div
            {...split.sashProps}
            style={{
              ...split.sashProps.style,
              flexBasis: 4,
              background: sashColor,
            }}
          />
          {showSecond && (
            <div data-testid="second" style={{ flex: 1, padding: 16 }}>
              {second}
            </div>
          )}
        </main>
      );
    },
    {
      props: z.object({
        direction: z.enum(["row", "column"]).describe("Flex direction"),
        sticky: z
          .number()
          .min(0)
          .max(200)
          .default(40)
          .meta({ control: "range" })
          .describe("Snap distance in px"),
        first: z.string().default("First panel"),
        second: z.string().default("Second panel"),
        sashColor: z.string().default("#a1a1aa").meta({ format: "color" }),
        showSecond: z.boolean().default(true),
      }),
      states: {
        vertical: { direction: "column", first: "Top", second: "Bottom" },
        single: { showSecond: false },
      },
    },
  );
});
