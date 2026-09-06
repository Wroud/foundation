"use client";
import { useNavigationContext } from "./NavigationContext.js";
import type { RegisteredNavigation } from "./Register.js";

export function useNavigation(): RegisteredNavigation {
  return useNavigationContext().navigation as RegisteredNavigation;
}
