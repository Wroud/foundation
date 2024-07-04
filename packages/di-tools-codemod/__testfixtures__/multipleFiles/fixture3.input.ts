/**
 * comment
 */
import { injectable } from "inversify";

@injectable()
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
  ) {}
}
