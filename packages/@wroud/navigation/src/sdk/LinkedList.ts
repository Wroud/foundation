export interface ILinkedListNode<T> {
  value: T;
  back: ILinkedListNode<T> | null;
  next: ILinkedListNode<T> | null;
}

export class LinkedList<T> {
  get size() {
    return this.length;
  }

  get first() {
    return this.head?.value;
  }

  get last() {
    return this.tail?.value;
  }

  private head: ILinkedListNode<T> | null = null;
  private tail: ILinkedListNode<T> | null = null;
  private length = 0;

  constructor(elements: T[] = []) {
    for (const element of elements) {
      this.push(element);
    }
  }

  setHead(head: ILinkedListNode<T> | null) {
    this.head = head;
    if (this.head) {
      this.head.back = null;
    }
    this.length = 0;

    this.tail = head;

    while (this.tail?.next) {
      this.tail.next.back = this.tail;
      this.tail = this.tail.next;
      this.length += 1;
    }
  }

  get(index: number) {
    if (index < 0 || index >= this.length) {
      return null;
    }

    let current = this.head;
    let i = 0;

    while (current && i < index) {
      current = current.next;
      i += 1;
    }

    return current?.value;
  }

  set(index: number, value: T) {
    this.assertIndexInBounds(index);

    let current = this.head;
    let i = 0;

    while (current && i < index) {
      current = current.next;
      i += 1;
    }

    if (current) {
      current.value = value;
    }
  }

  add(index: number, value: T) {
    this.assertIndexInBounds(index);

    if (index === 0) {
      this.head = { value, next: this.head, back: null };
      if (this.head.next) {
        this.head.next.back = this.head;
      }
      this.length += 1;
      return;
    }

    if (index === this.length) {
      this.push(value);
      return;
    }

    let current = this.head;
    let i = 0;

    while (current && i < index - 1) {
      current = current.next;
      i += 1;
    }

    if (!current) {
      return;
    }

    const node: ILinkedListNode<T> = {
      value,
      next: current.next,
      back: current,
    };
    current.next = node;
    if (node.next) {
      node.next.back = node;
    }
    this.length += 1;
  }

  push(value: T) {
    const node: ILinkedListNode<T> = { value, next: null, back: this.tail };

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail!.next = node;
      this.tail = node;
    }

    this.length += 1;
  }

  remove(value: T) {
    let current = this.head;
    let previous: ILinkedListNode<T> | null = null;

    while (current) {
      if (current.value === value) {
        if (previous) {
          previous.next = current.next;
        } else {
          this.head = current.next;
        }

        if (current.next) {
          current.next.back = previous;
        }

        if (current === this.tail) {
          this.tail = previous;
        }

        this.length -= 1;
        return;
      }

      previous = current;
      current = current.next;
    }
  }

  removeFrom(index: number) {
    this.assertIndexInBounds(index);

    if (index === 0) {
      this.head = null;
      this.tail = null;
      this.length = 0;
      return;
    }

    let current = this.head;
    let i = 0;

    while (current && i < index - 1) {
      current = current.next;
      i += 1;
    }

    if (current) {
      current.next = null;
      this.tail = current;
      this.length = index;
    }
  }

  removeFirst() {
    if (!this.head) {
      return;
    }

    const value = this.head.value;
    this.head = this.head.next;

    if (this.head) {
      this.head.back = null;
    } else {
      this.tail = null;
    }

    this.length -= 1;
    return value;
  }

  removeLast() {
    if (!this.tail) {
      return;
    }

    const value = this.tail.value;
    this.tail = this.tail.back;

    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }

    this.length -= 1;
    return value;
  }

  forEach(callback: (value: T) => void) {
    let current = this.head;

    while (current) {
      callback(current.value);
      current = current.next;
    }
  }

  /**
   * Serialize the linked list into a plain object.
   */
  toJSON(): ILinkedListNode<T> | null {
    const head = this.head;

    if (!head) {
      return null;
    }

    let current: ILinkedListNode<T> = { ...head, back: null };

    while (current.next) {
      current.next = { ...current.next, back: null };
      current = current.next;
    }

    return head;
  }

  toArray() {
    const array = [];
    let current = this.head;

    while (current) {
      array.push(current.value);
      current = current.next;
    }

    return array;
  }

  private assertIndexInBounds(index: number) {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds");
    }
  }
}
