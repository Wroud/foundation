import { describe as testDescribe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { describe } from "./describe.js";
import { story } from "./story.js";
import { fetchStoryById } from "./registry/stories.js";

testDescribe("story", () => {
  test("stores props schema and states in options", () => {
    const props = z.object({ label: z.string() });

    describe("story-props", () => {
      story("Button", (p) => <button>{p.label}</button>, {
        props,
        states: { long: { label: "A very long label" } },
      });
    });

    const registered = fetchStoryById("/story-props/Button");
    expect(registered?.options.props).toBe(props);
    expect(registered?.options.states).toEqual({
      long: { label: "A very long label" },
    });
  });

  test("infers component props from the schema", () => {
    describe("story-types", () => {
      story(
        "Inferred",
        (p) => {
          expectTypeOf(p).toEqualTypeOf<{ label: string; size?: number }>();
          return null;
        },
        { props: z.object({ label: z.string(), size: z.number().optional() }) },
      );

      story("No props", () => null);

      function Button(_: { label: string }) {
        return null;
      }

      story("Component", Button, { props: z.object({ label: z.string() }) });

      // @ts-expect-error
      story("Mismatch", Button, { props: z.object({ label: z.number() }) });

      story("Bad state", Button, {
        props: z.object({ label: z.string() }),
        // @ts-expect-error
        states: { wrong: { label: 1 } },
      });
    });
  });
});
