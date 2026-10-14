"use client";

import {
  Box,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  RotateCcw,
  RotateCw,
  Thermometer,
  Vibrate,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getRequestedAssetId,
  type DemoAsset,
  type MachineStatus,
} from "../../../lib/demo-data";
import {
  getMachineMeasurements,
  MOTOR_COMPONENTS,
  type MotorComponentId,
} from "../../../lib/digital-twin";
import { Badge, Button } from "../ui/primitives";
import { TwinViewport } from "./twin-viewport";

const STATUS_TONES: Record<MachineStatus, "green" | "amber" | "red"> = {
  operational: "green",
  review: "amber",
  service: "red",
};

const STATUS_LABELS: Record<MachineStatus, string> = {
  operational: "Operational",
  review: "Review",
  service: "Service",
};

function ComponentSymbol({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <span className="component-symbol" aria-hidden="true">
      <Box size={15} strokeWidth={1.8} />
      {selected && <span />}
    </span>
  );
}

function MachineMeasurements({ asset }: { asset: DemoAsset }) {
  const measurements = useMemo(
    () => getMachineMeasurements(asset),
    [asset],
  );

  return (
    <section className="ui-card twin-measurements" aria-labelledby="machine-measurements-title">
      <div className="twin-panel-heading">
        <div>
          <div className="panel-kicker">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </div>
          <h2 className="panel-title" id="machine-measurements-title">
            Operating measurements
          </h2>
        </div>
        <Badge tone={STATUS_TONES[asset.status]}>
          {STATUS_LABELS[asset.status]}
        </Badge>
      </div>

      <div className="twin-measurement-grid">
        {measurements.map((measurement) => (
          <div className="twin-measurement" key={measurement.id}>
            <span>
              {measurement.id === "temperature" ? (
                <Thermometer size={13} aria-hidden="true" />
              ) : measurement.id === "vibration" ? (
                <Vibrate size={13} aria-hidden="true" />
              ) : null}
              {measurement.label}
            </span>
            <strong>
              {measurement.value}
              <small> {measurement.unit}</small>
            </strong>
            <small className="twin-measurement-source">SIMULATED</small>
          </div>
        ))}
      </div>

      <div className="twin-provenance-note">
        <CircleHelp size={14} aria-hidden="true" />
        <span>
          Illustrative asset values from the seeded demo inventory — not live
          sensor telemetry.
        </span>
      </div>
    </section>
  );
}

export function DigitalTwinView({ assets }: { assets: readonly DemoAsset[] }) {
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [selectedPart, setSelectedPart] =
    useState<MotorComponentId | null>("housing");
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [urlAssetHandled, setUrlAssetHandled] = useState(false);
  const asset = assets.find((candidate) => candidate.id === assetId) ?? assets[0];
  const selectedComponent =
    MOTOR_COMPONENTS.find((part) => part.id === selectedPart) ??
    MOTOR_COMPONENTS[0];

  useEffect(() => {
    const requestedAssetId = getRequestedAssetId(
      assets,
      new URLSearchParams(window.location.search).get("assetId"),
    );
    if (!requestedAssetId) return;

    const timeout = window.setTimeout(() => {
      setAssetId(requestedAssetId);
      setUrlAssetHandled(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [assets]);

  function selectAsset(nextAssetId: string) {
    setAssetId(nextAssetId);
    setUrlAssetHandled(false);
  }

  return (
    <>
      <div className="page-heading twin-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          PLANT 01 <span className="heading-divider">/</span> DIGITAL TWIN
          <Badge className="heading-data-badge" tone="cyan">
            LOCAL 3D MODEL
          </Badge>
        </div>
        <h1>Digital twin</h1>
        <p>
          Explore a procedural electric motor model and its components. The
          illustration and associated equipment readings are demonstration
          data only.
        </p>
      </div>

      <div className="twin-asset-bar">
        <div className="twin-selected-asset">
          <span className="twin-selected-icon" aria-hidden="true">
            <Box size={17} />
          </span>
          <div>
            <span className="twin-asset-label">SELECTED DEMO ASSET</span>
            <strong>{asset?.name ?? "No demo assets available"}</strong>
            <small>{asset ? `${asset.id} · ${asset.location}` : "No equipment in the demonstration inventory."}</small>
          </div>
        </div>
        <div className="twin-asset-actions">
          {asset && (
            <label className="twin-select-wrap">
              <span className="sr-only">Select a demo machine</span>
              <select
                aria-label="Select a demo machine"
                className="twin-asset-select"
                onChange={(event) => selectAsset(event.target.value)}
                value={asset.id}
              >
                {assets.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.id} · {machine.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          )}
          <Link className="twin-back-link" href={`/fleet${asset ? `?assetId=${encodeURIComponent(asset.id)}` : ""}`}>
            <ChevronLeft size={14} aria-hidden="true" />
            Fleet
          </Link>
        </div>
      </div>

      {asset ? (
        <>
          <div className="twin-main-grid">
            <section className="ui-card twin-viewer-card" aria-labelledby="twin-model-title">
              <div className="twin-viewer-header">
                <div>
                  <div className="panel-kicker">
                    <span className="simulated-dot" aria-hidden="true" />
                    PROCEDURAL · LOCAL
                  </div>
                  <h2 className="panel-title" id="twin-model-title">
                    Induction motor assembly
                  </h2>
                </div>
                <span className="twin-model-dimensions">ILLUSTRATIVE MODEL</span>
              </div>

              <div className="twin-stage">
                <TwinViewport
                  autoRotate={autoRotate}
                  onSelect={setSelectedPart}
                  resetToken={resetToken}
                  selectedPart={selectedPart}
                />
                <div className="twin-stage-surface" aria-hidden="true" />
              </div>

              <div className="twin-toolbar">
                <span className="twin-interaction-note">
                  Orbit / zoom to inspect the procedural model
                </span>
                <div className="twin-toolbar-actions">
                  <Button
                    aria-pressed={autoRotate}
                    className="twin-control-button"
                    onClick={() => setAutoRotate((current) => !current)}
                    variant="secondary"
                  >
                    {autoRotate ? (
                      <RotateCcw size={14} aria-hidden="true" />
                    ) : (
                      <RotateCw size={14} aria-hidden="true" />
                    )}
                    Auto-rotate {autoRotate ? "on" : "off"}
                  </Button>
                  <Button
                    className="twin-control-button"
                    onClick={() => setResetToken((token) => token + 1)}
                    variant="ghost"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    Reset camera
                  </Button>
                </div>
              </div>
            </section>

            <aside className="ui-card twin-components" aria-labelledby="twin-components-title">
              <div className="twin-panel-heading">
                <div>
                  <div className="panel-kicker">MODEL ASSEMBLY</div>
                  <h2 className="panel-title" id="twin-components-title">
                    Components
                  </h2>
                </div>
                <span className="twin-component-count">
                  {MOTOR_COMPONENTS.length} PARTS
                </span>
              </div>
              <p className="twin-components-hint">
                Select a component in the model or this list to inspect it.
              </p>
              <div className="twin-component-list">
                {MOTOR_COMPONENTS.map((part, index) => {
                  const active = selectedPart === part.id;

                  return (
                    <button
                      aria-pressed={active}
                      className={`twin-component-option${active ? " is-active" : ""}`}
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      type="button"
                    >
                      <ComponentSymbol selected={active} />
                      <span className="twin-component-copy">
                        <span className="twin-component-order">
                          COMPONENT {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{part.name}</strong>
                      </span>
                      <ChevronDown
                        className="twin-component-chevron"
                        size={14}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>

          <div className="twin-support-grid">
            <section className="ui-card twin-component-info" aria-labelledby="component-info-title">
              <div className="twin-panel-heading">
                <div>
                  <div className="panel-kicker">SELECTED COMPONENT</div>
                  <h2 className="panel-title" id="component-info-title">
                    {selectedComponent.name}
                  </h2>
                </div>
                <Badge tone="cyan">{selectedComponent.category}</Badge>
              </div>
              <p className="twin-component-description">
                {selectedComponent.description}
              </p>
              <div className="twin-material-row">
                <span>DEMO MATERIAL</span>
                <strong>{selectedComponent.material}</strong>
              </div>
            </section>

            <MachineMeasurements asset={asset} />
          </div>

          <div className="twin-disclaimer" role="note">
            <CircleHelp size={15} aria-hidden="true" />
            <span>
              This digital twin is a static, locally rendered demonstration
              model. Auto-rotate changes only the camera; it does not represent
              a measured machine state or a real-time sensor connection.
            </span>
          </div>
          {urlAssetHandled && (
            <span className="sr-only" role="status">
              Selected {asset.name} from the requested demo asset.
            </span>
          )}
        </>
      ) : (
        <section className="ui-card fleet-empty-state" role="status">
          <Box size={22} aria-hidden="true" />
          <h2>No demo equipment available</h2>
          <p>The digital twin needs a seeded demo asset to display.</p>
        </section>
      )}
    </>
  );
}
