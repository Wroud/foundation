import { injectable, inject, multiInject, c } from "inversify";

@enotherDecorator()
@injectable()
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
    private readonly noType,
    @inject("D") private readonly d: D,
    @multiInject("E") private readonly e: E[],
  ) {}
}
