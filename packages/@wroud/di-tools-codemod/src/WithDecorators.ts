import type { Decorator } from "jscodeshift";

export type WithDecorators<T> = T & { decorators?: Decorator[] | null };
