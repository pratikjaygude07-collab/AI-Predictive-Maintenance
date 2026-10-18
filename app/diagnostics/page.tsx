"use client";

import {
  AlertTriangle,
  Clock,
  Play,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { dataService } from "@/lib/data-service";
import {
  estimateRul,
  riskLabel,
  riskTone,
  type RulEstimate,
} from "@/lib/rul-model";
import type { FaultAnalysis, HealthTrendPoint } from "@/lib/mock-data";
import { Badge, Button } from "../components/ui/primitives";

type SeverityColorMap = Record<string, string>;

const SEVERITY_COLORS: SeverityColorMap = {
  mild: "#4ade80",
  moderate: "#fbbf24",
  severe: "#fb923c",
  critical: "#fb7185",
};

function severityTone(severity: string): "neutral" | "cyan" | "green" | "amber" | "red" {
  switch (severity) {
    case "critical":
      return "red";
    case "severe":
      return "amber";
    case "moderate":
      return "amber";
    case "mild":
      return "green";
    default:
      return "neutral";
  }
}

function FaultSeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge tone={severityTone(severity)}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

function FaultCard({
  fault,
  selected,
  onSelect,
}: {
  fault: FaultAnalysis;
  selected: boolean;
  onSelect: (fault: FaultAnalysis) => void;
}) {
  const color = SEVERITY_COLORS[fault.severity] ?? "#94a3b8";
  const machine = dataService.getMachineById(fault.machineId);
  const confidencePct = Math.round(fault.confidence * 100);

  return (
    <div
      className={`fault-reference-card ui-card${selected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      style={selected ? { outline: "2px solid var(--accent)", outlineOffset: "2px" } : undefined}
      onClick={() => onSelect(fault)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(fault);
        }
      }}
    >
      <div className="fault-reference-icon" aria-hidden="true">
        <AlertTriangle size={16} strokeWidth={1.8} />
      </div>
      <div className="fault-reference-intro">
        <strong>{fault.faultType}</strong> detected on{" "}
        {machine?.name ?? "unknown machine"} ({fault.machineId})
      </div>
      <div className="fault-pattern-list">
        <div className="fault-pattern">
          <span className="fault-pattern-index">1</span>
          <div>
            <h3>Severity</h3>
            <div className="fault-pattern-summary">
              <FaultSeverityBadge severity={fault.severity} />
            </div>
            <p className="fault-pattern-context">
              {fault.description}
            </p>
          </div>
        </div>
        <div className="fault-pattern">
          <span className="fault-pattern-index">2</span>
          <div>
            <h3>Confidence</h3>
            <div className="fault-pattern-summary">
              <span style={{ color }}>{confidencePct}%</span>
            </div>
            <p className="fault-pattern-context">
              Model confidence in this fault classification.
            </p>
          </div>
        </div>
        {fault.predictedFailureAt && (
          <div className="fault-pattern">
            <span className="fault-pattern-index">3</span>
            <div>
              <h3>Predicted failure</h3>
              <div className="fault-pattern-summary">
                <span style={{ color }}>
                  {new Date(fault.predictedFailureAt).toLocaleDateString()}
                </span>
              </div>
              <p className="fault-pattern-context">
                Estimated remaining useful life based on current degradation
                trend.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="fault-reference-note">
        <ShieldAlert size={12} strokeWidth={1.6} />
        <span>
          All fault analysis results are simulated until a real prediction
          backend is integrated.
        </span>
      </div>
    </div>
  );
}

function RecommendationsList({ fault }: { fault: FaultAnalysis }) {
  return (
    <div className="fault-reference-card ui-card">
      <div className="fault-reference-icon" aria-hidden="true">
        <Play size={16} strokeWidth={1.8} />
      </div>
      <div className="fault-reference-intro">
        Maintenance recommendations for <strong>{fault.faultType}</strong>
      </div>
      <ul className="fault-pattern-list">
        {fault.recommendations.map((rec, i) => (
          <li key={i} className="fault-pattern">
            <span className="fault-pattern-index">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="fault-pattern-summary">{rec}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="fault-reference-note">
        <Clock size={12} strokeWidth={1.6} />
        <span>Recommendations are generated from simulated fault data.</span>
      </div>
    </div>
  );
}

function SensorHistoryChart({
  title,
  unit,
  color,
  data,
}: {
  title: string;
  unit: string;
  color: string;
  data: Array<{ timestamp: string; value: number }>;
}) {
  const width = 100;
  const height = 100;
  const padding = 16;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;

  const pathD = data
    .map((point, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * plotWidth;
      const y =
        padding + plotHeight - ((point.value - min) / range) * plotHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  const latest = data[data.length - 1]?.value ?? 0;

  return (
    <div className="diagnostics-chart-card ui-card">
      <div className="diagnostics-chart-heading">
        <div>
          <div className="panel-kicker">SENSOR HISTORY</div>
          <div className="section-title">{title}</div>
        </div>
      </div>
      <div className="diagnostics-chart-description">
        Last 60 minutes of {title.toLowerCase()} readings (simulated).
      </div>
      <div className="diagnostic-plot-figure">
        <svg
          className="diagnostic-plot"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`${title} history chart`}
          role="img"
        >
          <path
            className="diagnostic-wave-line"
            d={pathD}
            stroke={color}
          />
          {data.map((point, i) => (
            <circle
              key={i}
              className="diagnostic-spectrum-stem"
              cx={
                padding + (i / Math.max(data.length - 1, 1)) * plotWidth
              }
              cy={
                padding +
                plotHeight -
                ((point.value - min) / range) * plotHeight
              }
              r={1.5}
              fill={color}
            />
          ))}
        </svg>
      </div>
      <div className="diagnostic-chart-footer">
        <span className="diagnostic-legend-mark" />
        <span>{title}</span>
        <span className="diagnostic-chart-units">
          {latest.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}

function RulForecastChart({
  estimate,
}: {
  estimate: RulEstimate;
}) {
  const width = 220;
  const height = 110;
  const padding = 14;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const values = estimate.forecast.map((p) => p.healthScore);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;

  const pathD = estimate.forecast
    .map((point, index) => {
      const x = padding + (point.day / estimate.forecastHorizonDays) * plotWidth;
      const y =
        padding + plotHeight - ((point.healthScore - min) / range) * plotHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  const latest = estimate.forecast[estimate.forecast.length - 1];

  return (
    <div className="diagnostics-chart-card ui-card">
      <div className="diagnostics-chart-heading">
        <div>
          <div className="panel-kicker">RUL FORECAST</div>
          <div className="section-title">Simulated health degradation</div>
        </div>
      </div>
      <div className="diagnostics-chart-description">
        Illustrative health forecast over {estimate.forecastHorizonDays}
        simulated days. Not a real prediction.
      </div>
      <div className="diagnostic-plot-figure">
        <svg
          className="diagnostic-plot"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Simulated RUL health forecast"
          role="img"
        >
          <path
            className="diagnostic-wave-line"
            d={pathD}
            stroke={
              estimate.riskLevel === "critical"
                ? "#fb7185"
                : estimate.riskLevel === "high"
                  ? "#fbbf24"
                  : estimate.riskLevel === "medium"
                    ? "#3b82f6"
                    : "#4ade80"
            }
          />
          {estimate.forecast.map((point, i) => (
            <circle
              key={i}
              className="diagnostic-spectrum-stem"
              cx={padding + (point.day / estimate.forecastHorizonDays) * plotWidth}
              cy={
                padding +
                plotHeight -
                ((point.healthScore - min) / range) * plotHeight
              }
              r={1.5}
              fill={
                estimate.riskLevel === "critical"
                  ? "#fb7185"
                  : estimate.riskLevel === "high"
                    ? "#fbbf24"
                    : estimate.riskLevel === "medium"
                      ? "#3b82f6"
                      : "#4ade80"
              }
            />
          ))}
        </svg>
      </div>
      <div className="diagnostic-chart-footer">
        <span className="diagnostic-legend-mark" />
        <span>
          Est. {estimate.rulDays.toFixed(0)} days remaining
        </span>
        <span className="diagnostic-chart-units">
          {latest.healthScore.toFixed(0)} health @ day {latest.day}
        </span>
      </div>
    </div>
  );
}

function RulEstimateCard({
  estimate,
  machineName,
}: {
  estimate: RulEstimate;
  machineName: string;
}) {
  return (
    <section className="fault-reference-card ui-card">
      <div className="fault-reference-icon" aria-hidden="true">
        <Clock size={16} strokeWidth={1.8} />
      </div>
      <div className="fault-reference-intro">
        Remaining useful life for <strong>{machineName}</strong>
        ({estimate.machineId})
      </div>
      <div className="fault-pattern-list">
        <div className="fault-pattern">
          <span className="fault-pattern-index">1</span>
          <div>
            <h3>Current health</h3>
            <div className="fault-pattern-summary">
              <Badge tone={riskTone(estimate.riskLevel)}>
                {estimate.currentHealth}
              </Badge>
            </div>
            <p className="fault-pattern-context">
              Current simulated health score (0-100).
            </p>
          </div>
        </div>
        <div className="fault-pattern">
          <span className="fault-pattern-index">2</span>
          <div>
            <h3>Remaining useful life</h3>
            <div className="fault-pattern-summary">
              <span>
                {estimate.rulDays.toFixed(0)} days ·{" "}
                {estimate.rulHours.toFixed(0)} operating hours
              </span>
            </div>
            <p className="fault-pattern-context">
              Estimated until health reaches the {estimate.threshold} maintenance
              threshold.
            </p>
          </div>
        </div>
        <div className="fault-pattern">
          <span className="fault-pattern-index">3</span>
          <div>
            <h3>Maintenance window</h3>
            <div className="fault-pattern-summary">
              <span>
                {new Date(estimate.maintenanceWindow).toLocaleDateString()}
              </span>
            </div>
            <p className="fault-pattern-context">
              Estimated date maintenance is recommended (simulated).
            </p>
          </div>
        </div>
        <div className="fault-pattern">
          <span className="fault-pattern-index">4</span>
          <div>
            <h3>Risk level</h3>
            <div className="fault-pattern-summary">
              <Badge tone={riskTone(estimate.riskLevel)}>
                {riskLabel(estimate.riskLevel)}
              </Badge>
            </div>
            <p className="fault-pattern-context">
              Degradation rate:{" "}
              {estimate.degradationRatePerDay.toFixed(2)} health points/day.
            </p>
          </div>
        </div>
      </div>
      <div className="fault-reference-note">
        <ShieldAlert size={12} strokeWidth={1.6} />
        <span>
          SIMULATED — NOT REAL AI PREDICTIONS. This illustrative estimate uses a
          fixed reference time and a deterministic, machine-specific degradation
          rate. It is not trained on live telemetry and should not be used for
          actual maintenance decisions.
        </span>
      </div>
    </section>
  );
}

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const machineId = searchParams.get("machineId");
  const selectedMachine = machineId
    ? dataService.getMachineById(machineId)
    : undefined;

  const [selectedFault, setSelectedFault] = useState<FaultAnalysis | null>(null);

  const faults = machineId && selectedMachine
    ? dataService.getFaultAnalyses(machineId)
    : dataService.getFaultAnalyses();

  const activeFault = selectedFault && faults.some((f) => f.id === selectedFault.id)
    ? selectedFault
    : null;

  if (machineId && !selectedMachine) {
    return (
      <>
        <div className="diagnostics-page-heading">
          <div className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true" />
            CONDITION ANALYSIS
          </div>
          <h1>Diagnostics</h1>
          <p>Machine not found in the simulated fleet data.</p>
        </div>
        <div className="diagnostics-empty-state">
          <h2>Unknown machine</h2>
          <p>No simulated machine matches ID {machineId}.</p>
        </div>
      </>
    );
  }

  const machineHealthTrends: Record<string, HealthTrendPoint[]> = {};
  const allMachineIds = [...new Set(faults.map((f) => f.machineId))];
  allMachineIds.forEach((id) => {
    machineHealthTrends[id] = dataService.getHealthTrend(id);
  });

  const criticalFaults = faults.filter(
    (f) => f.severity === "critical" || f.severity === "severe",
  );
  const avgConfidence =
    faults.length > 0
      ? Math.round(
          (faults.reduce((acc, f) => acc + f.confidence, 0) / faults.length) *
            100,
        )
      : 0;

  return (
    <>
      <div className="diagnostics-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          CONDITION ANALYSIS
        </div>
        <h1>Diagnostics</h1>
        <p>
          Machine fault analysis, predictive maintenance results, and sensor
          history visualization. All predictive results are clearly labeled as
          simulated until a real prediction backend is implemented.
        </p>
      </div>

      <div className="diagnostics-asset-bar">
        <div className="diagnostics-asset-heading">
          <div>
            <div className="panel-kicker">ANALYSIS SUBJECT</div>
             <strong>
               {selectedMachine
                 ? `${selectedMachine.name} (${selectedMachine.id})`
                 : "Fleet-wide fault analysis"}
             </strong>
            <small>All registered machines · simulated data</small>
          </div>
        </div>
        <div className="diagnostics-asset-actions">
          <Button
            className="twin-select-wrap"
            onClick={() => {
              setSelectedFault(null);
            }}
            variant="secondary"
          >
            <RefreshCw size={12} strokeWidth={1.6} />
            Refresh analysis
          </Button>
          <Link className="diagnostics-twin-link" href="/machine">
            Open digital twin <Play size={10} strokeWidth={1.6} />
          </Link>
        </div>
      </div>

      <div className="diagnostics-model-status">
        <div className="diagnostics-model-icon" aria-hidden="true">
          <ShieldAlert size={16} strokeWidth={1.8} />
        </div>
        <div>
          <h2>System health overview</h2>
          <p>
            {faults.length} fault patterns detected across the fleet.
            {criticalFaults.length} require immediate attention.
          </p>
        </div>
        <div>
          <Badge tone={avgConfidence >= 80 ? "green" : "amber"}>
            {avgConfidence}% AVG CONFIDENCE
          </Badge>
        </div>
      </div>

      <div className="diagnostics-signal-grid">
        {faults.length > 0 ? (
          faults.slice(0, 2).map((fault) => {
            const readings = dataService.getSensorReadings(fault.machineId);
            return (
              <SensorHistoryChart
                key={fault.id}
                title={fault.faultType}
                unit="units"
                color={SEVERITY_COLORS[fault.severity] ?? "#22d3ee"}
                data={readings}
              />
            );
          })
        ) : (
          <div className="diagnostics-empty-state">
            <h2>No fault data</h2>
            <p>No fault analysis results are available at this time.</p>
          </div>
        )}
      </div>

      <div className="diagnostics-lower-grid">
        <section className="fault-reference-card ui-card">
          <div className="fault-reference-icon" aria-hidden="true">
            <TrendingDown size={16} strokeWidth={1.8} />
          </div>
          <div className="fault-reference-intro">
            Fault severity distribution across analyzed machines
          </div>
          <div className="fault-pattern-list">
            {["critical", "severe", "moderate", "mild"].map((sev) => {
              const count = faults.filter((f) => f.severity === sev).length;
              return (
                <div key={sev} className="fault-pattern">
                  <span className="fault-pattern-index">
                    {sev.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>{sev.charAt(0).toUpperCase() + sev.slice(1)}</h3>
                    <div className="fault-pattern-summary">
                      <FaultSeverityBadge severity={sev} />
                    </div>
                    <p className="fault-pattern-context">
                      {count} machine{count !== 1 ? "s" : ""} affected
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fault-reference-note">
            <AlertTriangle size={12} strokeWidth={1.6} />
            <span>
              Severity classifications are simulated until a real inference
              service is connected.
            </span>
          </div>
        </section>

        <section className="fault-reference-card ui-card">
          <div className="fault-reference-icon" aria-hidden="true">
            <TrendingUp size={16} strokeWidth={1.8} />
          </div>
          <div className="fault-reference-intro">
            Machine health trends (14-day simulated)
          </div>
          <div className="fault-pattern-list">
            {allMachineIds.map((id) => {
              const machine = dataService.getMachineById(id);
              const trend = machineHealthTrends[id];
              const latest = trend[trend.length - 1]?.score ?? 0;
              return (
                <div key={id} className="fault-pattern">
                  <span className="fault-pattern-index">{id}</span>
                  <div>
                    <h3>{machine?.name ?? id}</h3>
                    <div className="fault-pattern-summary">
                      <span style={{ color: latest >= 80 ? "#4ade80" : "#fb7185" }}>
                        {latest}
                      </span>
                    </div>
                    <p className="fault-pattern-context">
                      Current health score (simulated)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fault-reference-note">
            <Clock size={12} strokeWidth={1.6} />
            <span>Health trends are simulated until a real backend is connected.</span>
          </div>
        </section>
      </div>

      {selectedMachine && (
        <div className="diagnostics-lower-grid">
          <section className="fault-reference-card ui-card" style={{ gridColumn: "1 / -1" }}>
            <div className="fault-reference-intro">
              Remaining useful life (RUL) estimate for{" "}
              <strong>{selectedMachine.name} ({selectedMachine.id})</strong>
            </div>
            {(() => {
              const estimate = estimateRul({
                machineId: selectedMachine.id,
                currentHealth: selectedMachine.healthScore,
              });
              return (
                <>
                  <RulEstimateCard
                    estimate={estimate}
                    machineName={selectedMachine.name}
                  />
                  <RulForecastChart estimate={estimate} />
                </>
              );
            })()}
            <div className="fault-reference-note">
              <AlertTriangle size={12} strokeWidth={1.6} />
              <span>
                RUL estimates are illustrative and simulated. They are not
                trained AI/ML predictions and should not drive real maintenance
                decisions.
              </span>
            </div>
          </section>
        </div>
      )}

      <div className="diagnostics-lower-grid">
        {faults.length > 0 ? (
          faults.map((fault) => (
            <FaultCard
              key={fault.id}
              fault={fault}
              selected={activeFault?.id === fault.id}
              onSelect={setSelectedFault}
            />
          ))
        ) : (
          <div className="diagnostics-empty-state">
            <h2>No fault analysis available</h2>
            <p>No fault patterns have been detected in the simulated data.</p>
          </div>
        )}
      </div>

      <div className="diagnostics-lower-grid">
        {activeFault ? (
          <RecommendationsList fault={activeFault} />
        ) : (
          <section className="fault-reference-card ui-card">
            <div className="fault-reference-icon" aria-hidden="true">
              <Play size={16} strokeWidth={1.8} />
            </div>
            <div className="fault-reference-intro">
              Select a fault above to view detailed maintenance recommendations
            </div>
            <div className="fault-reference-note">
              <span>Click any fault card to expand its recommendations.</span>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
export default function DiagnosticsPage() {
  return (
    <Suspense fallback={<div>Loading diagnostics...</div>}>
      <DiagnosticsContent />
    </Suspense>
  );
}