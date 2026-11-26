import { describe, story } from "@wroud/playground-react";
import { z } from "zod";

describe("Button", () => {
  story("Default", function DefaultButton() {
    return <button data-testid="default-button">Click me</button>;
  });
  story(
    "Preview",
    function PreviewButton() {
      return <button data-testid="preview-button">Preview</button>;
    },
    { preview: true },
  );
  story(
    "Controlled",
    function ControlledButton({ label, variant, size, disabled }) {
      return (
        <button
          data-testid="controlled-button"
          data-variant={variant}
          disabled={disabled}
          style={{ fontSize: size }}
        >
          {label}
        </button>
      );
    },
    {
      props: z.object({
        label: z.string().default("Controlled label").describe("Button text"),
        variant: z.enum(["primary", "ghost"]),
        size: z.number().min(8).max(48).default(16).meta({ control: "range" }),
        disabled: z.boolean().optional(),
      }),
      states: { disabled: { disabled: true, label: "Disabled" } },
    },
  );
});
