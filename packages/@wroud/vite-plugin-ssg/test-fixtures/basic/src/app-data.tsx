"use client";

import { useAppContext } from "@wroud/vite-plugin-ssg/react/components";

export function AppData() {
  const data = useAppContext<{ base: string; source?: string }>();
  return <p data-testid="app-data">{data.source ?? "none"}</p>;
}
