"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Thermometer,
  Vibrate,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  filterAssets,
  getTrend,
  getRequestedAssetId,
  type ChartRange,
  type DemoAsset,
  type DemoSnapshot,
  type MachineStatus,
  type StatusFilter,
} from "../../../lib/demo-data";
import { Badge, Button } from "../ui/primitives";
import { MetricChart } from "./metric-chart";

const STATUS_LABELS: Record<MachineStatus, string> = {
  operational: "Operational",
  review: "Review",
  service: "Service",
};

const STATUS_TONES: Record<MachineStatus, "green" | "amber" | "red"> = {
  operational: "green",
  review: "amber",
  service: "red",
};

function isStatusFilter(value: string): value is StatusFilter {
  return (
    value === "all" ||
    value === "operational" ||
    value === "review" ||
    value === "service"
  );
}

function StatusBadge({ status }: { status: MachineStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: "cyan" | "green" | "amber" | "red";
}) {
  return (
    <article className={`ui-card kpi-card kpi-${tone}`}>
      <div className="kpi-heading">
        <span>{label}</span>
        <span className="kpi-icon" aria-hidden="true">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">{detail}</div>
      <div className="kpi-source">SIMULATED DATA</div>
    </article>
  );
}

function FleetCondition({
  assets,
  summary,
}: {
  assets: readonly DemoAsset[];
  summary: DemoSnapshot["summary"];
}) {
  return (
    <section className="ui-card fleet-condition" aria-labelledby="fleet-condition-title">
      <div className="section-heading">
        <div>
          <div className="panel-kicker">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </div>
          <h2 className="panel-title" id="fleet-condition-title">
            Fleet condition
          </h2>
        </div>
        <span className="fleet-total">{assets.length} assets</span>
      </div>

      <div
        className="condition-bar"
        role="img"
        aria-label={`${summary.operational} operational, ${summary.review} for review, ${summary.service} scheduled for service.`}
      >
        {(["operational", "review", "service"] as const).map((status) => (
          <span
            className={`condition-segment condition-${status}`}
            key={status}
            style={{ width: `${(summary[status] / Math.max(assets.length, 1)) * 100}%` }}
          />
        ))}
      </div>

      <div className="condition-legend">
        {(["operational", "review", "service"] as const).map((status) => (
          <div className="condition-legend-item" key={status}>
            <span className={`condition-key condition-${status}`} aria-hidden="true" />
            <span>{STATUS_LABELS[status]}</span>
            <strong>{summary[status]}</strong>
          </div>
        ))}
      </div>

      <p className="panel-footnote">
        Condition groups use illustrative temperature and vibration thresholds.
      </p>
    </section>
  );
}

function DashboardAssetTable({
  assets,
  filteredAssets,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onReset,
  selectedAssetId,
  onAssetSelect,
}: {
  assets: readonly DemoAsset[];
  filteredAssets: readonly DemoAsset[];
  query: string;
  status: StatusFilter;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onReset: () => void;
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string | null) => void;
}) {
  function toggleAsset(assetId: string) {
    onAssetSelect(selectedAssetId === assetId ? null : assetId);
  }

  return (
    <section className="ui-card asset-overview" aria-labelledby="asset-overview-title">
      <div className="asset-overview-heading">
        <div>
          <div className="panel-kicker">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </div>
          <h2 className="panel-title" id="asset-overview-title">
            Asset overview
          </h2>
          <p className="panel-description">
            Select an asset to review its simulated operating readings.
          </p>
        </div>
        <div className="asset-filters">
          <label className="sr-only" htmlFor="dashboard-asset-search">
            Search equipment
          </label>
          <input
            autoComplete="off"
            className="asset-search"
            id="dashboard-asset-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search equipment"
            type="search"
            value={query}
          />
          <label className="sr-only" htmlFor="dashboard-status-filter">
            Filter by condition
          </label>
          <span className="select-wrap">
            <select
              className="asset-status-filter"
              id="dashboard-status-filter"
              onChange={(event) => {
                if (isStatusFilter(event.target.value)) {
                  onStatusChange(event.target.value);
                }
              }}
              value={status}
            >
              <option value="all">All conditions</option>
              <option value="operational">Operational</option>
              <option value="review">Review</option>
              <option value="service">Service</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </span>
          {(query || status !== "all") && (
            <Button
              className="reset-filters"
              onClick={onReset}
              variant="ghost"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {filteredAssets.length > 0 ? (
        <div
          aria-label="Equipment inventory table; scroll horizontally to view additional columns"
          className="table-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="asset-table">
            <thead>
              <tr>
                <th scope="col">Equipment</th>
                <th scope="col">Condition</th>
                <th scope="col">Temperature</th>
                <th scope="col">Vibration RMS</th>
                <th scope="col">Speed</th>
                <th scope="col">Load</th>
                <th scope="col">Next service</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const isExpanded = selectedAssetId === asset.id;

                return (
                  <Fragment key={asset.id}>
                    <tr className="asset-row">
                      <td>
                        <button
                          aria-controls={`asset-detail-${asset.id}`}
                          aria-expanded={isExpanded}
                          className="asset-name-button"
                          onClick={() => toggleAsset(asset.id)}
                          type="button"
                        >
                          <span className="asset-avatar" aria-hidden="true">
                            {asset.type.includes("bearing") ||
                            asset.type.includes("Bearing")
                              ? "BR"
                              : "MT"}
                          </span>
                          <span className="asset-name-stack">
                            <span className="asset-name">{asset.name}</span>
                            <span className="asset-id">
                              {asset.id} · {asset.location}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <StatusBadge status={asset.status} />
                      </td>
                      <td>
                        <span className="table-reading">
                          <Thermometer size={13} aria-hidden="true" />
                          {asset.temperatureC.toFixed(1)}
                          <span>°C</span>
                        </span>
                      </td>
                      <td>
                        <span className="table-reading">
                          <Vibrate size={13} aria-hidden="true" />
                          {asset.vibrationMmS.toFixed(1)}
                          <span>mm/s</span>
                        </span>
                      </td>
                      <td>{asset.speedRpm.toLocaleString()} rpm</td>
                      <td>{asset.loadPercent}%</td>
                      <td className="service-date">{asset.nextService}</td>
                    </tr>
                    {isExpanded && (
                      <tr
                        className="asset-detail-row"
                        id={`asset-detail-${asset.id}`}
                      >
                        <td colSpan={7}>
                          <div className="asset-detail-content">
                            <div className="asset-detail-heading">
                              <strong>{asset.name}</strong>
                              <span>{asset.type}</span>
                            </div>
                            <div className="asset-detail-values">
                              <span>
                                <small>Operating state</small>
                                <strong>
                                  {asset.operatingState === "running"
                                    ? "Running"
                                    : "Standby"}
                                </strong>
                              </span>
                              <span>
                                <small>Temperature · SIMULATED DATA</small>
                                <strong>{asset.temperatureC.toFixed(1)} °C</strong>
                              </span>
                              <span>
                                <small>Vibration · SIMULATED DATA</small>
                                <strong>{asset.vibrationMmS.toFixed(1)} mm/s RMS</strong>
                              </span>
                              <span>
                                <small>Signal triage</small>
                                <strong>
                                  {asset.status === "service"
                                    ? "Schedule review"
                                    : asset.status === "review"
                                      ? "Review"
                                      : "Routine"}
                                </strong>
                              </span>
                            </div>
                            <Link
                              className="dashboard-open-fleet-link"
                              href={`/fleet?assetId=${encodeURIComponent(asset.id)}`}
                            >
                              Open fleet asset
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="asset-empty-state" role="status">
          <span className="empty-state-icon" aria-hidden="true">
            <ClipboardList size={19} />
          </span>
          <strong>No equipment matches these filters</strong>
          <span>Try another name, asset ID, location, or condition.</span>
          <Button onClick={onReset} variant="secondary">
            Clear filters
          </Button>
        </div>
      )}

      <div className="table-footer">
        <span>
          Showing {filteredAssets.length} of {assets.length} demo assets
        </span>
        <span>Units: °C · mm/s RMS · rpm</span>
      </div>
    </section>
  );
}

export function DashboardView({ snapshot }: { snapshot: DemoSnapshot }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [range, setRange] = useState<ChartRange>("24h");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const assetId = getRequestedAssetId(
      snapshot.assets,
      new URLSearchParams(window.location.search).get("assetId"),
    );
    if (!assetId) return;

    const timeout = window.setTimeout(() => {
      setSelectedAssetId(assetId);
      setQuery(assetId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [snapshot.assets]);

  const filteredAssets = useMemo(
    () => filterAssets(snapshot.assets, query, status),
    [snapshot.assets, query, status],
  );
  const temperatureTrend = useMemo(
    () => getTrend("temperature", range, snapshot.assets),
    [range, snapshot.assets],
  );
  const vibrationTrend = useMemo(
    () => getTrend("vibration", range, snapshot.assets),
    [range, snapshot.assets],
  );

  function resetFilters() {
    setQuery("");
    setStatus("all");
  }

  function focusAsset(assetId: string) {
    setStatus("all");
    setQuery(assetId);
    setSelectedAssetId(assetId);
    window.setTimeout(() => {
      document
        .getElementById("asset-overview-title")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          PLANT 01 <span className="heading-divider">/</span> SHIFT A
          <Badge className="heading-data-badge" tone="cyan">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </Badge>
        </div>
        <h1>Dashboard</h1>
        <p>
          A steady view of the demo fleet — operating condition, illustrative
          signal trends, and the planned maintenance queue.
        </p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          detail="Across electric motors and rotating assets"
          icon={Activity}
          label="Assets monitored"
          value={String(snapshot.assets.length).padStart(2, "0")}
        />
        <KpiCard
          detail="Within illustrative operating thresholds"
          icon={Check}
          label="Operational"
          tone="green"
          value={`${snapshot.summary.operational} / ${snapshot.assets.length}`}
        />
        <KpiCard
          detail="For routine signal and condition review"
          icon={ArrowUpRight}
          label="Review recommended"
          tone="amber"
          value={String(snapshot.summary.review).padStart(2, "0")}
        />
        <KpiCard
          detail="In the simulated maintenance schedule"
          icon={CalendarDays}
          label="Upcoming service"
          tone="red"
          value={String(snapshot.maintenance.length).padStart(2, "0")}
        />
      </div>

      <div className="overview-strip">
        <FleetCondition assets={snapshot.assets} summary={snapshot.summary} />
        <div className="overview-note ui-card">
          <span className="overview-note-icon" aria-hidden="true">
            <Activity size={16} />
          </span>
          <div>
            <strong>Illustrative maintenance triage</strong>
            <p>
              Priority labels use deterministic demo thresholds. They are not
              AI forecasts, fault diagnoses, failure probabilities, or
              remaining-life estimates.
            </p>
          </div>
          <ArrowDownRight className="overview-note-arrow" size={16} aria-hidden="true" />
        </div>
      </div>

      <section className="dashboard-section" aria-labelledby="trends-title">
        <div className="section-heading trends-section-heading">
          <div>
            <div className="panel-kicker">SEEDED · REPEATABLE TRENDS</div>
            <h2 className="section-title" id="trends-title">
              Equipment performance
            </h2>
          </div>
          <span className="section-note">
            <span className="simulated-dot" aria-hidden="true" />
            All values are simulated
          </span>
        </div>
        <div className="trend-grid">
          <MetricChart
            metric="temperature"
            onRangeChange={setRange}
            points={temperatureTrend}
            range={range}
            title="Temperature trend"
          />
          <MetricChart
            metric="vibration"
            onRangeChange={setRange}
            points={vibrationTrend}
            range={range}
            title="Vibration trend"
          />
        </div>
      </section>

      <section className="dashboard-section" aria-label="Maintenance and activity">
        <div className="activity-grid">
          <section className="ui-card triage-panel" aria-labelledby="triage-title">
            <div className="section-heading">
              <div>
                <div className="panel-kicker">
                  <span className="simulated-dot" aria-hidden="true" />
                  SIMULATED DATA
                </div>
                <h2 className="panel-title" id="triage-title">
                  Maintenance triage
                </h2>
              </div>
              <Badge tone="amber">{snapshot.alerts.length} to review</Badge>
            </div>
            <p className="panel-description triage-disclaimer">
              Illustrative threshold flags only — not fault diagnoses or AI
              predictions.
            </p>
            {snapshot.alerts.length > 0 ? (
              <ul className="triage-list">
                {snapshot.alerts.map((alert) => (
                  <li className="triage-item" key={alert.id}>
                    <span
                      className={`triage-severity triage-${alert.priority}`}
                      aria-hidden="true"
                    />
                    <div className="triage-body">
                      <div className="triage-title-row">
                        <button
                          className="text-link-button"
                          onClick={() => focusAsset(alert.assetId)}
                          type="button"
                        >
                          {alert.assetName}
                        </button>
                        <Badge
                          tone={alert.priority === "schedule" ? "amber" : "cyan"}
                        >
                          {alert.priority === "schedule"
                            ? "Schedule review"
                            : "Review"}
                        </Badge>
                      </div>
                      <div className="triage-reading">
                        {alert.signal} <strong>{alert.value}</strong>
                      </div>
                      <p>{alert.recommendation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mini-empty-state" role="status">
                <Check size={16} aria-hidden="true" />
                No demo readings currently meet the review thresholds.
              </div>
            )}
          </section>

          <section
            className="ui-card schedule-panel"
            aria-labelledby="schedule-title"
          >
            <div className="section-heading">
              <div>
                <div className="panel-kicker">
                  <span className="simulated-dot" aria-hidden="true" />
                  SIMULATED DATA
                </div>
                <h2 className="panel-title" id="schedule-title">
                  Upcoming maintenance
                </h2>
              </div>
              <CalendarDays size={16} className="panel-heading-icon" aria-hidden="true" />
            </div>
            {snapshot.maintenance.length > 0 ? (
              <ul className="schedule-list">
                {snapshot.maintenance.map((item) => (
                  <li className="schedule-item" key={item.id}>
                    <div className="schedule-date">
                      <CalendarDays size={14} aria-hidden="true" />
                      {item.date}
                    </div>
                    <div>
                      <button
                        className="text-link-button schedule-asset"
                        onClick={() => focusAsset(item.assetId)}
                        type="button"
                      >
                        {item.assetName}
                      </button>
                      <p>{item.task}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mini-empty-state" role="status">
                No maintenance is scheduled in this demo.
              </div>
            )}
          </section>

          <section
            className="ui-card recent-activity-panel"
            aria-labelledby="activity-title"
          >
            <div className="section-heading">
              <div>
                <div className="panel-kicker">
                  <span className="simulated-dot" aria-hidden="true" />
                  SIMULATED DATA
                </div>
                <h2 className="panel-title" id="activity-title">
                  Recent activity
                </h2>
              </div>
              <Clock3 size={16} className="panel-heading-icon" aria-hidden="true" />
            </div>
            {snapshot.activity.length > 0 ? (
              <ul className="recent-activity-list">
                {snapshot.activity.map((item) => (
                  <li className="recent-activity-item" key={item.id}>
                    <span className="activity-marker" aria-hidden="true" />
                    <div>
                      <span className="activity-time">{item.time} · SHIFT A</span>
                      <p>{item.message}</p>
                      <button
                        className="text-link-button activity-asset"
                        onClick={() => focusAsset(item.assetId)}
                        type="button"
                      >
                        {item.assetName}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mini-empty-state" role="status">
                No simulated activity to display.
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="dashboard-section asset-section">
        <DashboardAssetTable
          assets={snapshot.assets}
          filteredAssets={filteredAssets}
          onQueryChange={setQuery}
          onReset={resetFilters}
          onStatusChange={setStatus}
          onAssetSelect={setSelectedAssetId}
          query={query}
          status={status}
          selectedAssetId={selectedAssetId}
        />
      </section>
    </>
  );
}
