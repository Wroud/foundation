export interface ISplitViewSashProps<T extends HTMLElement> {
  onDoubleClick: () => void;
  onPointerDown: (event: React.PointerEvent<T>) => void;
  style: {
    cursor: "grab";
    touchAction: "none";
  };
}
