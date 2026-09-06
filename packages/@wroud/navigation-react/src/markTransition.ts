"use client";
import * as React from "react";
import type { NavigationType } from "@wroud/navigation";

type AddTransitionType = (type: string) => void;

const exported = React as unknown as Record<string, unknown>;
const found = [
  exported["addTransitionType"],
  exported["unstable_addTransitionType"],
].find((candidate) => typeof candidate === "function");
const addTransitionType = found ? (found as AddTransitionType) : null;

export function markTransition(type: NavigationType): void {
  addTransitionType?.(`navigation-${type}`);
}
