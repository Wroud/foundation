import { Decorator } from "jscodeshift";

export type WithDecorators<T> = T & { decorators?: Decorator[] | null };
