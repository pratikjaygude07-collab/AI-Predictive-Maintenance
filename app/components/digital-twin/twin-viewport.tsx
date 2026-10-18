"use client";

import dynamic from "next/dynamic";
import WebGL from "three/addons/capabilities/WebGL.js";
import { useEffect, useState } from "react";
import { getViewerMode } from "../../../lib/digital-twin";
import type { MotorComponentId } from "../../../lib/digital-twin";

const MotorScene = dynamic(
  () => import("./motor-scene").then((module) => module.MotorScene),
  {
    ssr: false,
    loading: () => (
      <div className="twin-viewer-status" role="status">
        <span className="twin-status-mark" aria-hidden="true" />
        <span>Preparing local 3D viewer</span>
      </div>
    ),
  },
);

type ViewerStatus = "checking" | "interactive" | "fallback" | "timeout";

export function TwinViewport({
  selectedPart,
  onSelect,
  autoRotate,
  resetToken,
}: {
  selectedPart: MotorComponentId | null;
  onSelect: (id: MotorComponentId) => void;
  autoRotate: boolean;
  resetToken: number;
}) {
  const [status, setStatus] = useState<ViewerStatus>("checking");
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    const checkTimeout = window.setTimeout(() => {
      try {
        setStatus(getViewerMode(WebGL.isWebGL2Available()));
      } catch (error) {
        console.error("Unable to detect local WebGL 2 support.", error);
        setStatus("fallback");
      }
    }, 0);

    return () => window.clearTimeout(checkTimeout);
  }, []);

  useEffect(() => {
    if (status !== "interactive" || viewerReady) return;

    const timeoutId = window.setTimeout(() => {
      setStatus("timeout");
    }, 12_000);

    return () => window.clearTimeout(timeoutId);
  }, [status, viewerReady]);

  if (status === "checking") {
    return (
      <div className="twin-viewer-status" role="status">
        <span className="twin-status-mark" aria-hidden="true" />
        <span>Checking local WebGL support</span>
      </div>
    );
  }

  if (status === "fallback" || status === "timeout") {
    return (
      <div className="twin-fallback" role="status">
        <span className="twin-fallback-icon" aria-hidden="true">
          3D
        </span>
        <strong>
          {status === "timeout"
            ? "Interactive viewer took too long to load"
            : "Interactive 3D view unavailable"}
        </strong>
        <span>
          {status === "timeout"
            ? "This device did not finish starting its local WebGL viewer. Use the component list and descriptions instead."
            : "This browser or device does not support the local WebGL 2 viewer. Use the component list and descriptions instead."}
        </span>
      </div>
    );
  }

  return (
    <div className="twin-canvas-frame">
      <MotorScene
        autoRotate={autoRotate}
        onSelect={onSelect}
        onViewerReady={() => setViewerReady(true)}
        onViewerError={() => setStatus("fallback")}
        resetToken={resetToken}
        selectedPart={selectedPart}
      />
      <div className="viewer-local-tag">
        <span aria-hidden="true" />
        LOCAL PROCEDURAL MODEL
      </div>
      <div className="viewer-controls-hint">
        Drag to orbit <span aria-hidden="true">·</span> Scroll to zoom
      </div>
    </div>
  );
}
