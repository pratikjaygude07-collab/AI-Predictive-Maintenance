"use client";

import { useEffect } from "react";
import { DataState } from "./components/ui/data-state";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route failed to render.", error);
  }, [error]);

  return (
    <div className="page-heading">
      <div className="eyebrow">
        <span className="eyebrow-mark" aria-hidden="true" />
        APPLICATION STATUS
      </div>
      <h1>Workspace unavailable</h1>
      <p>
        The page could not be displayed. No cached or simulated readings have
        been substituted.
      </p>
      <DataState
        status="error"
        title="Unable to load this page"
        message="An unexpected application error interrupted this request."
        detail={error.digest ? `Reference: ${error.digest}` : undefined}
        actionLabel="Try again"
        onAction={reset}
      />
    </div>
  );
}
