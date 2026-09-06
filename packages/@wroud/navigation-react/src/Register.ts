import type { INavigation } from "@wroud/navigation";

export interface Register {}

export type RegisteredNavigation = Register extends {
  navigation: infer TNavigation extends INavigation;
}
  ? TNavigation
  : INavigation;
