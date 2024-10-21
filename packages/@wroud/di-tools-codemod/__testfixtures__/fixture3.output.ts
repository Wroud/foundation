/**
 * comment
 */
import { injectable } from "@wroud/di";

@injectable(() => [A, B, C])
export class NotificationService {
  constructor(
    private readonly a: A,
    private readonly b: B,
    private readonly c: C,
  ) {}
}
