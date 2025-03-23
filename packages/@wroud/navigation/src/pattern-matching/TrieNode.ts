import type { NodeType } from "./types.js";

/**
 * TrieNode represents a node in the pattern matching trie
 */
export class TrieNode {
  readonly type: NodeType;
  readonly name: string;
  readonly children: Map<string, TrieNode>;
  paramChild: TrieNode | null;
  wildcardChild: TrieNode | null;
  isEndOfPattern: boolean;
  pattern: string | null;
  parent: TrieNode | null;

  constructor(
    type: NodeType = "static",
    name: string = "",
    parent: TrieNode | null = null,
  ) {
    this.type = type;
    this.name = name;
    this.children = new Map();
    this.paramChild = null;
    this.wildcardChild = null;
    this.isEndOfPattern = false;
    this.pattern = null;
    this.parent = parent;
  }

  /**
   * Mark this node as the end of a pattern
   */
  markAsPatternEnd(pattern: string): this {
    this.isEndOfPattern = true;
    this.pattern = pattern;
    return this;
  }

  /**
   * Get a static child node by segment name
   */
  getStaticChild(segment: string): TrieNode | undefined {
    return this.children.get(segment);
  }

  /**
   * Check if this node has a static child for the given segment
   */
  hasStaticChild(segment: string): boolean {
    return this.children.has(segment);
  }

  /**
   * Add a static child node for the given segment
   */
  addStaticChild(segment: string): TrieNode {
    // Check if child already exists
    const existingChild = this.children.get(segment);
    if (existingChild) {
      return existingChild;
    }

    // Create a new child node with this as parent
    const child = new TrieNode("static", segment, this);
    this.children.set(segment, child);
    return child;
  }

  /**
   * Get or create a parameter child node
   */
  getOrCreateParamChild(paramName: string): TrieNode {
    if (!this.paramChild) {
      this.paramChild = new TrieNode("param", paramName, this);
    }
    return this.paramChild;
  }

  /**
   * Get or create a wildcard child node
   */
  getOrCreateWildcardChild(wildcardName: string): TrieNode {
    if (!this.wildcardChild) {
      this.wildcardChild = new TrieNode("wildcard", wildcardName, this);
    }
    return this.wildcardChild;
  }

  /**
   * Find all patterns that are ancestors of this node
   */
  findAncestorPatterns(): string[] {
    let current = this.parent;
    const ancestors: string[] = [];

    while (current) {
      if (current.isEndOfPattern && current.pattern) {
        ancestors.push(current.pattern);
      }
      current = current.parent;
    }

    return ancestors;
  }
}
