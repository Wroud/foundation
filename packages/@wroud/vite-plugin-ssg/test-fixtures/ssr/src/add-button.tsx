"use client";

import { useState } from "react";
import { addAndReport, addObject, failAction } from "./actions.js";

export function AddButton() {
  const [reported, setReported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        data-testid="rpc-add"
        onClick={async () => setReported(await addAndReport(3))}
      >
        {reported === null ? "report" : `reported ${reported}`}
      </button>
      <button
        type="button"
        data-testid="rpc-object"
        onClick={async () => setReported(await addObject({ amount: 2 }))}
      >
        object
      </button>
      <button
        type="button"
        data-testid="rpc-fail"
        onClick={async () => {
          try {
            await failAction();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
          }
        }}
      >
        {error ?? "fail"}
      </button>
    </>
  );
}
