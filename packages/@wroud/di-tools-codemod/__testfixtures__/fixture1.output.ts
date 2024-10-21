import { c } from "inversify";

import { injectable } from "@wroud/di";

@enotherDecorator()
@injectable(() => [A, B, C, null, D, [E]])
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
    private readonly noType,
    private readonly d: D,
    private readonly e: E[],
  ) {}
}
