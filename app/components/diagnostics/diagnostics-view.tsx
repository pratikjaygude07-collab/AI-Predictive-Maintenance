"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getRequestedAssetId,
  type ChartRange,
  type DemoAsset,
} from "../../../lib/demo-data";
import {
  EDUCATIONAL_FAULT_PATTERNS,
  getSimulatedSpectrum,
  getSimulatedTemperatureTrend,
  getSimulatedWaveform,
  type SpectrumSample,
  type VibrationSample,
} from "../../../lib/diagnostics";
import { MetricChart } from "../dashboard/metric-chart";
import { Badge } from "../ui/primitives";

const PLOT = {
  width: 640,
  height: 232,
  left: 55,
  right: 18,
  top: 17,
  bottom: 35,
};

interface PlotPoint {
  x: number;
  y: number;
}

function getPath(points: readonly PlotPoint[]): string {
  return points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

function SignalChart({
  kind,
  waveform,
  spectrum,
  asset,
}: {
  kind: "waveform" | "spectrum";
  waveform: readonly VibrationSample[];
  spectrum: readonly SpectrumSample[];
  asset: DemoAsset;
}) {
  const isWaveform = kind === "waveform";
  const series = isWaveform ? waveform : spectrum;
  const values = isWaveform
    ? waveform.map(({ valueMmS }) => valueMmS)
    : spectrum.map(({ amplitudeMmS }) => amplitudeMmS);
  const minValue = isWaveform ? Math.min(...values) : 0;
  const maxValue = isWaveform
    ? Math.max(...values)
    : Math.max(...values, 0.1);
  const verticalPadding = isWaveform
    ? Math.max((maxValue - minValue) * 0.1, 0.1)
    : maxValue * 0.12;
  const domainMin = isWaveform ? minValue - verticalPadding : 0;
  const domainMax = maxValue + verticalPadding;
  const plotWidth = PLOT.width - PLOT.left - PLOT.right;
  const plotHeight = PLOT.height - PLOT.top - PLOT.bottom;
  const baseline = PLOT.top + plotHeight;
  const points = values.map((value, index) => {
    return {
      x: PLOT.left + (index / Math.max(series.length - 1, 1)) * plotWidth,
      y:
        PLOT.top +
        ((domainMax - value) / (domainMax - domainMin)) * plotHeight,
    };
  });
  const xLabels = isWaveform
    ? [
        "0",
        ((waveform.at(-1)?.timeMs ?? 0) / 2).toFixed(0),
        waveform.at(-1)?.timeMs.toFixed(0) ?? "0",
      ]
    : ["0", "2.5", "5.0", "7.5", "10.0"].map((order) =>
        (Number(order) * (asset.speedRpm / 60)).toFixed(0),
      );
  const yLabels = [0, 1, 2].map((index) =>
    domainMax - (index / 2) * (domainMax - domainMin),
  );
  const chartLabel = isWaveform
    ? `Illustrative simulated vibration waveform for ${asset.name}, ${asset.vibrationMmS.toFixed(1)} millimeters per second RMS base reading.`
    : `Illustrative simulated vibration frequency spectrum for ${asset.name}, amplitude in millimeters per second and frequency in hertz.`;

  return (
    <figure className="diagnostic-plot-figure">
      <svg
        aria-label={chartLabel}
        className="diagnostic-plot"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
      >
        {yLabels.map((value, index) => {
          const y = PLOT.top + (index / 2) * plotHeight;
          return (
            <g key={index}>
              <line
                className="chart-gridline"
                x1={PLOT.left}
                x2={PLOT.width - PLOT.right}
                y1={y}
                y2={y}
              />
              <text
                className="chart-axis-label"
                dominantBaseline="middle"
                textAnchor="end"
                x={PLOT.left - 9}
                y={y}
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        {isWaveform ? (
          <>
            <line
              className="diagnostic-zero-line"
              x1={PLOT.left}
              x2={PLOT.width - PLOT.right}
              y1={
                PLOT.top +
                ((domainMax - 0) / (domainMax - domainMin)) * plotHeight
              }
              y2={
                PLOT.top +
                ((domainMax - 0) / (domainMax - domainMin)) * plotHeight
              }
            />
            <path className="diagnostic-wave-line" d={getPath(points)} />
          </>
        ) : (
          <>
            {points.map((point, index) => (
              <line
                className="diagnostic-spectrum-stem"
                key={index}
                x1={point.x}
                x2={point.x}
                y1={baseline}
                y2={point.y}
              />
            ))}
            <path className="diagnostic-spectrum-line" d={getPath(points)} />
          </>
        )}
        {xLabels.map((label, index) => {
          const position =
            PLOT.left + (index / Math.max(xLabels.length - 1, 1)) * plotWidth;
          return (
            <text
              className="chart-axis-label"
              key={`${label}-${index}`}
              textAnchor={
                index === 0
                  ? "start"
                  : index === xLabels.length - 1
                    ? "end"
                    : "middle"
              }
              x={position}
              y={PLOT.height - 9}
            >
              {label}
            </text>
          );
        })}
        <text
          className="diagnostic-axis-title"
          textAnchor="end"
          x={PLOT.width - PLOT.right}
          y={PLOT.height - 1}
        >
          {isWaveform ? "time · ms" : "frequency · Hz"}
        </text>
      </svg>
      <figcaption className="sr-only">
        Deterministic simulated signal from the selected demo asset. It is not
        recorded sensor telemetry.
      </figcaption>
    </figure>
  );
}

function SignalCard({
  kind,
  asset,
  waveform,
  spectrum,
}: {
  kind: "waveform" | "spectrum";
  asset: DemoAsset;
  waveform: readonly VibrationSample[];
  spectrum: readonly SpectrumSample[];
}) {
  const isWaveform = kind === "waveform";

  return (
    <section
      className="ui-card diagnostics-chart-card"
      aria-labelledby={`diagnostic-${kind}-title`}
    >
      <div className="diagnostics-chart-heading">
        <div>
          <div className="panel-kicker">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </div>
          <h2 className="panel-title" id={`diagnostic-${kind}-title`}>
            {isWaveform ? "Vibration waveform" : "Frequency spectrum"}
          </h2>
        </div>
        <span className="diagnostic-chart-icon" aria-hidden="true">
          {isWaveform ? <Waves size={16} /> : <Activity size={16} />}
        </span>
      </div>
      <p className="diagnostics-chart-description">
        {isWaveform
          ? "Illustrative velocity signal synthesized from the seeded RMS reading."
          : "Discrete Fourier transform of this page's illustrative waveform."}
      </p>
      <SignalChart
        asset={asset}
        kind={kind}
        spectrum={spectrum}
        waveform={waveform}
      />
      <div className="diagnostic-chart-footer">
        <span className="diagnostic-legend-mark" aria-hidden="true" />
        <span>{asset.id} · synthetic signal</span>
        <span className="diagnostic-chart-units">
          {isWaveform ? "velocity · mm/s" : "amplitude · mm/s"}
        </span>
      </div>
    </section>
  );
}

export function DiagnosticsView({
  assets,
}: {
  assets: readonly DemoAsset[];
}) {
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [range, setRange] = useState<ChartRange>("24h");
  const [urlAssetHandled, setUrlAssetHandled] = useState(false);
  const asset = assets.find(({ id }) => id === assetId) ?? assets[0];
  const signals = useMemo(() => {
    if (!asset) return null;
    const waveform = getSimulatedWaveform(asset);
    return {
      waveform,
      spectrum: getSimulatedSpectrum(asset, waveform),
    };
  }, [asset]);
  const temperatureTrend = useMemo(
    () => (asset ? getSimulatedTemperatureTrend(asset, range) : []),
    [asset, range],
  );

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

  return (
    <>
      <div className="page-heading diagnostics-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          PLANT 01 <span className="heading-divider">/</span> DIAGNOSTICS
          <Badge className="diagnostics-demo-badge" tone="cyan">
            ILLUSTRATIVE
          </Badge>
        </div>
        <h1>Signal diagnostics</h1>
        <p>
          Explore reproducible example signals and general vibration-pattern
          references. This demonstration does not diagnose equipment.
        </p>
      </div>

      <section className="ui-card diagnostics-asset-bar" aria-label="Diagnostic asset selection">
        <div className="diagnostics-asset-heading">
          <span className="diagnostic-chart-icon" aria-hidden="true">
            <Activity size={17} />
          </span>
          <div>
            <span className="twin-asset-label">SELECTED DEMO ASSET</span>
            <strong>{asset?.name ?? "No demo assets available"}</strong>
            <small>
              {asset
                ? `${asset.id} · ${asset.location}`
                : "There are no assets in the seeded inventory."}
            </small>
          </div>
        </div>
        {asset && (
          <div className="diagnostics-asset-actions">
            <label className="twin-select-wrap">
              <span className="sr-only">Select equipment for illustrative diagnostics</span>
              <select
                aria-label="Select equipment for illustrative diagnostics"
                className="twin-asset-select"
                onChange={(event) => {
                  setAssetId(event.target.value);
                  setUrlAssetHandled(false);
                }}
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
            <Link
              className="diagnostics-twin-link"
              href={`/machine?assetId=${encodeURIComponent(asset.id)}`}
            >
              Digital twin <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="ui-card diagnostics-model-status" aria-labelledby="diagnostics-model-title">
        <span className="diagnostics-model-icon" aria-hidden="true">
          <BrainCircuit size={18} />
        </span>
        <div>
          <div className="panel-kicker">ANALYTICS CONNECTION</div>
          <h2 id="diagnostics-model-title">ML Model: Not Connected</h2>
          <p>
            No model inference or automated condition diagnosis is available in
            this software-only demonstration.
          </p>
        </div>
        <Badge tone="neutral">NOT CONNECTED</Badge>
      </section>

      {asset && signals ? (
        <>
          <div className="diagnostics-signal-grid">
            <SignalCard
              asset={asset}
              kind="waveform"
              spectrum={signals.spectrum}
              waveform={signals.waveform}
            />
            <SignalCard
              asset={asset}
              kind="spectrum"
              spectrum={signals.spectrum}
              waveform={signals.waveform}
            />
          </div>

          <div className="diagnostics-lower-grid">
            <MetricChart
              metric="temperature"
              onRangeChange={setRange}
              points={temperatureTrend}
              range={range}
              seriesLabel={`${asset.id} · simulated`}
              title="Asset temperature trend"
            />
            <section
              className="ui-card fault-reference-card"
              aria-labelledby="fault-reference-title"
            >
              <div className="diagnostics-chart-heading">
                <div>
                  <div className="panel-kicker">
                    <BookOpen size={12} aria-hidden="true" />
                    EDUCATIONAL REFERENCE
                  </div>
                  <h2 className="panel-title" id="fault-reference-title">
                    Common pattern examples
                  </h2>
                </div>
                <span className="fault-reference-icon" aria-hidden="true">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <p className="fault-reference-intro">
                These simplified descriptions are not measured patterns or
                findings for the selected asset.
              </p>
              <div className="fault-pattern-list">
                {EDUCATIONAL_FAULT_PATTERNS.map((pattern, index) => (
                  <article className="fault-pattern" key={pattern.id}>
                    <span className="fault-pattern-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{pattern.name}</h3>
                      <p className="fault-pattern-summary">{pattern.pattern}</p>
                      <p className="fault-pattern-context">{pattern.context}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="fault-reference-note">
                <CircleHelp size={14} aria-hidden="true" />
                <span>
                  Vibration signatures are context-dependent. Confirm any
                  concern with qualified personnel and site procedures.
                </span>
              </div>
            </section>
          </div>

          <div className="twin-disclaimer" role="note">
            <CircleHelp size={15} aria-hidden="true" />
            <span>
              All plotted signals and temperature history are deterministic
              simulation samples, not live sensor data. No fault diagnosis,
              prediction, confidence score, or remaining-life estimate is
              generated.
            </span>
          </div>
          {urlAssetHandled && (
            <span className="sr-only" role="status">
              Selected {asset.name} from the requested demo asset.
            </span>
          )}
        </>
      ) : (
        <section className="ui-card diagnostics-empty-state" role="status">
          <Activity size={22} aria-hidden="true" />
          <h2>No demo equipment available</h2>
          <p>
            Diagnostic examples require an asset from the seeded demonstration
            inventory.
          </p>
        </section>
      )}
    </>
  );
}
