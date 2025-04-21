import { describe, Link, story } from "@wroud/playground-react";
import { useSplitView } from "./useSplitView.js";
import splitStylesUrl from "./split.stories.css?url";

describe("@wroud/react-split-view", () => {
  story(
    "Horizontal Split (Default)",
    function HorizontalSplitStory() {
      const splitView = useSplitView<HTMLDivElement>();
      return (
        <main className="container">
          <Link rel="stylesheet" href={splitStylesUrl} />
          <div {...splitView.viewProps} className="panel">
            Left Panel
          </div>
          <div {...splitView.sashProps} className="sash" />
          <div className="panel">Right Panel</div>
        </main>
      );
    },
    { preview: true },
  );

  story(
    "Vertical Split",
    function VerticalSplitStory() {
      const splitView = useSplitView<HTMLDivElement>();
      return (
        <main className="container" style={{ flexDirection: "column" }}>
          <Link rel="stylesheet" href={splitStylesUrl} />
          <div {...splitView.viewProps} className="panel">
            Top Panel
          </div>
          <div {...splitView.sashProps} className="sash" />
          <div className="panel">Bottom Panel</div>
        </main>
      );
    },
    { preview: true },
  );

  story(
    "With Sticky Edges (20px)",
    function StickySplitStory() {
      const splitView = useSplitView<HTMLDivElement>({
        sticky: 20,
      });
      return (
        <main className="container">
          <Link rel="stylesheet" href={splitStylesUrl} />
          <div {...splitView.viewProps} className="panel">
            Left Panel (drag near edge to snap)
          </div>
          <div {...splitView.sashProps} className="sash" />
          <div className="panel">Right Panel</div>
        </main>
      );
    },
    { preview: true },
  );

  story(
    "Multiple Splits",
    function MultipleSplitStory() {
      const firstSplit = useSplitView<HTMLDivElement>();
      const secondSplit = useSplitView<HTMLDivElement>();

      return (
        <main className="container">
          <Link rel="stylesheet" href={splitStylesUrl} />
          <div {...firstSplit.viewProps} className="panel">
            Left Panel
          </div>
          <div {...firstSplit.sashProps} className="sash" />
          <div className="panel">
            <div className="container" style={{ flexDirection: "column" }}>
              <div {...secondSplit.viewProps} className="panel">
                Top-Right Panel
              </div>
              <div {...secondSplit.sashProps} className="sash" />
              <div className="panel">Bottom-Right Panel</div>
            </div>
          </div>
        </main>
      );
    },
    { preview: true },
  );
});
