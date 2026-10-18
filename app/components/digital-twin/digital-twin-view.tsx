"use client";

import {
  Box,
  ChevronDown,
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Thermometer,
  Waves,
  Activity,
  Gauge,
  Battery,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MOTOR_COMPONENTS,
  type MotorComponentId,
} from "../../../lib/digital-twin";
import { dataAccess } from "../../../lib/mock-data";
import { Badge, Button } from "../ui/primitives";
import { TwinViewport } from "./twin-viewport";

function ComponentSymbol({ selected }: { selected: boolean }) {
  return (
    <span className="component-symbol" aria-hidden="true">
      <Box size={15} strokeWidth={1.8} />
      {selected && <span />}
    </span>
  );
}

export function DigitalTwinView({
  machineId = "M-001",
}: { machineId?: string } = {}) {
  const [selectedPart, setSelectedPart] =
    useState<MotorComponentId | null>("housing");
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const machine = dataAccess.getMachineById(machineId);
  const selectedComponent =
    MOTOR_COMPONENTS.find((part) => part.id === selectedPart) ??
    MOTOR_COMPONENTS[0];
  const telemetry = useMemo(
    () => dataAccess.getOperationalMetrics(machineId),
    [machineId],
  );
  const sensorReadings = useMemo(
    () => dataAccess.getSensorReadings(machineId),
    [machineId],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      <div className="page-heading twin-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          DIGITAL TWIN
          <Badge className="heading-data-badge" tone="cyan">
            LOCAL 3D MODEL
          </Badge>
        </div>
        <h1>Digital twin</h1>
        <p>
          Explore an illustrative procedural motor model. It is not connected
          to a physical machine, and no live equipment measurements are
          available.
        </p>
      </div>

      <div className="twin-asset-bar">
        <div className="twin-selected-asset">
          <span className="twin-selected-icon" aria-hidden="true">
            <Box size={17} />
          </span>
          <div>
            <span className="twin-asset-label">
              {machine ? "REGISTERED ASSET" : "ILLUSTRATIVE MODEL"}
            </span>
            <strong>
              {machine ? machine.name : "Induction motor assembly"}
            </strong>
            <small>
              {machine
                ? `${machine.id} · ${machine.status.toUpperCase()} · health ${machine.healthScore}`
                : "Local procedural geometry · not a registered asset"}
            </small>
          </div>
        </div>
        <Link className="twin-back-link" href="/fleet">
          <ChevronLeft size={14} aria-hidden="true" />
          Fleet
        </Link>
      </div>

      <div className="twin-main-grid">
        <section
          className="ui-card twin-viewer-card"
          aria-labelledby="twin-model-title"
        >
          <div className="twin-viewer-header">
            <div>
              <div className="panel-kicker">PROCEDURAL · LOCAL</div>
              <h2 className="panel-title" id="twin-model-title">
                Induction motor assembly
              </h2>
            </div>
            <span className="twin-model-dimensions">ILLUSTRATIVE MODEL</span>
          </div>

          <div className="twin-stage">
            <TwinViewport
              autoRotate={autoRotate && !reducedMotion}
              onSelect={setSelectedPart}
              resetToken={resetToken}
              selectedPart={selectedPart}
            />
            <div className="twin-stage-surface" aria-hidden="true" />
          </div>

          <div className="twin-toolbar">
            <span className="twin-interaction-note">
              Orbit: drag or arrow keys · Zoom: scroll or press +/-
            </span>
            <div className="twin-toolbar-actions">
              <Button
                aria-pressed={autoRotate && !reducedMotion}
                className="twin-control-button"
                disabled={reducedMotion}
                onClick={() => setAutoRotate((current) => !current)}
                variant="secondary"
                title={
                  reducedMotion
                    ? "Auto-rotation is disabled by your reduced-motion preference"
                    : undefined
                }
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

        <aside
          className="ui-card twin-components"
          aria-labelledby="twin-components-title"
        >
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
        <section
          className="ui-card twin-component-info"
          aria-labelledby="component-info-title"
        >
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
            <span>ILLUSTRATIVE MATERIAL</span>
            <strong>{selectedComponent.material}</strong>
          </div>
        </section>

        <section
          className="ui-card twin-measurements"
          aria-labelledby="twin-telemetry-title"
        >
          <div className="twin-panel-heading">
            <div>
              <div className="panel-kicker">OPERATING METRICS</div>
              <h2 className="panel-title" id="twin-telemetry-title">
                Simulated telemetry
              </h2>
            </div>
            <Badge tone="cyan">SIMULATED</Badge>
          </div>
          <div className="twin-measurement-grid">
              <div className="twin-measurement">
                <span>
                  <Thermometer size={12} strokeWidth={1.6} />
                  TEMPERATURE
                </span>
                <strong>
                  {telemetry.temperature.data[telemetry.temperature.data.length - 1]?.value.toFixed(1)}<small> °C</small>
                </strong>
                <span className="twin-measurement-source">{telemetry.temperature.trend}</span>
              </div>
              <div className="twin-measurement">
                <span>
                  <Waves size={12} strokeWidth={1.6} />
                  VIBRATION
                </span>
                <strong>
                  {telemetry.vibration.data[telemetry.vibration.data.length - 1]?.value.toFixed(2)}<small> mm/s</small>
                </strong>
                <span className="twin-measurement-source">{telemetry.vibration.trend}</span>
              </div>
              <div className="twin-measurement">
                <span>
                  <Gauge size={12} strokeWidth={1.6} />
                  RPM
                </span>
                <strong>
                  {telemetry.rpm.data[telemetry.rpm.data.length - 1]?.value.toFixed(0)}<small> RPM</small>
                </strong>
                <span className="twin-measurement-source">{telemetry.rpm.trend}</span>
              </div>
              <div className="twin-measurement">
                <span>
                  <Activity size={12} strokeWidth={1.6} />
                  PRESSURE
                </span>
                <strong>
                  {telemetry.pressure.data[telemetry.pressure.data.length - 1]?.value.toFixed(1)}<small> bar</small>
                </strong>
                <span className="twin-measurement-source">{telemetry.pressure.trend}</span>
              </div>
              <div className="twin-measurement">
                <span>
                  <Battery size={12} strokeWidth={1.6} />
                  CURRENT
                </span>
                <strong>
                  {telemetry.current.data[telemetry.current.data.length - 1]?.value.toFixed(1)}<small> A</small>
                </strong>
                <span className="twin-measurement-source">{telemetry.current.trend}</span>
              </div>
            </div>
        </section>
      </div>

      <section className="ui-card twin-sensor-readings">
        <div className="twin-panel-heading">
          <div>
            <div className="panel-kicker">SIMULATED SENSOR READINGS</div>
            <h2 className="panel-title">Recent sensor data</h2>
          </div>
          <Badge tone="cyan">SIMULATED</Badge>
        </div>
        <div className="twin-sensor-list">
          {sensorReadings.length > 0 ? (
            sensorReadings.slice(-10).reverse().map((reading) => (
              <div
                key={reading.id}
                className="twin-sensor-item"
              >
                <span className="twin-sensor-time">
                  {new Date(reading.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="twin-sensor-value">
                  {reading.value.toFixed(2)} <span className="twin-sensor-unit">{reading.unit}</span>
                </span>
                <span
                  className={`twin-sensor-status tone-${
                    reading.status === "normal" ? "green" : reading.status === "warning" ? "amber" : "red"
                  }`}
                >
                  {reading.status.toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="twin-sensor-item twin-sensor-empty">
              <span>No sensor readings available</span>
            </div>
          )}
        </div>
      </section>

      <div className="twin-disclaimer" role="note">
        <span>
          This model is a static, locally rendered illustration. Camera
          auto-rotation does not represent machine motion or a live sensor
          connection.
        </span>
      </div>
    </>
  );
}
