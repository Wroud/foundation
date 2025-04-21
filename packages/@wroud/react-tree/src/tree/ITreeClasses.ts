/**
 * Interface for customizing the tree component's CSS classes
 */
export interface ITreeClasses {
  /**
   * Class applied to the root container element
   */
  root?: string;

  /**
   * Class applied to the tree content wrapper
   */
  content?: string;

  /**
   * Class applied to the node element
   */
  node?: string;

  /**
   * Class applied to selected nodes
   */
  nodeSelected?: string;

  /**
   * Class applied to expanded nodes
   */
  nodeExpanded?: string;

  /**
   * Class applied to the node control container
   */
  nodeControl?: string;

  /**
   * Class applied to the node content
   */
  nodeContent?: string;

  /**
   * Class applied to the node icon
   */
  nodeIcon?: string;

  /**
   * Class applied to the expand/collapse control
   */
  expandControl?: string;

  /**
   * Class applied to the expanded state of the expand control
   */
  expandControlExpanded?: string;

  /**
   * Class applied to the children container element
   */
  children?: string;

  /**
   * Class applied to the root children container element
   */
  rootChildren?: string;

  /**
   * Class applied to virtualization gap elements
   */
  virtualGap?: string;
}
