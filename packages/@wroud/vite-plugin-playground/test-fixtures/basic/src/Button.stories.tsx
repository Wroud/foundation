import { describe, story } from "@wroud/playground-react";

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
});
