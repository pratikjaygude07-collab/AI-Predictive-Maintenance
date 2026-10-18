"use client";

import {
  Activity,
  AlertCircle,
  Clock,
  Gauge,
  Play,
  RefreshCw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { dataService, type AckFilter, type Severity } from "@/lib/data-service";
import type { MachineAsset, Alert, MaintenanceRecord } from "@/lib/mock-data";
import { Badge, Button } from "../components/ui/primitives";

type KpiCardProps = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string | number;
  detail: string;
  tone: "neutral" | "cyan" | "green" | "amber" | "red";
};

function KpiCard({ icon: Icon, label, value, detail, tone }: KpiCardProps) {
  return (
    <div className={`kpi-card kpi-${tone}`}>
      <div className="kpi-heading">
        <div className="kpi-icon">
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">{detail}</div>
    </div>
  );
}

type AlertItemProps = {
  alert: Alert;
  machineName: string;
  onAcknowledge: (id: string) => void;
  onSnooze: (id: string, until: string) => void;
  onUnsnooze: (id: string) => void;
};

const SNOOZE_OPTIONS = [
  { label: "1h", hours: 1 },
  { label: "4h", hours: 4 },
  { label: "24h", hours: 24 },
] as const;

function snoozeUntil(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function isSnoozed(alert: Alert): boolean {
  if (!alert.snoozed) return false;
  if (!alert.snoozedUntil) return true;
  return new Date(alert.snoozedUntil) > new Date();
}

function AlertItem({
  alert,
  machineName,
  onAcknowledge,
  onSnooze,
  onUnsnooze,
}: AlertItemProps) {
  const severityColor =
    alert.severity === "critical"
      ? "#fb7185"
      : alert.severity === "high"
        ? "#fbbf24"
        : alert.severity === "medium"
          ? "#3b82f6"
          : "#4ade80";
  const snoozed = isSnoozed(alert);

  return (
    <div className="triage-item">
      <span className="triage-severity" style={{ background: severityColor }} />
      <div className="triage-body">
        <div className="triage-title-row">
          <strong>{alert.message}</strong>
          <Link className="text-link-button" href={`/machine/${alert.machineId}`}>
            View machine
          </Link>
        </div>
        <div className="triage-reading">
          {machineName} <strong>{alert.category}</strong>
        </div>
        <p>
          {new Date(alert.timestamp).toLocaleString("en-US", {
            timeZone: "UTC",
          })} ·
          {alert.acknowledged ? "Acknowledged" : "Unacknowledged"}
          {snoozed ? ` · Snoozed until ${new Date(alert.snoozedUntil!).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}` : ""}
        </p>
        <div className="triage-actions">
          {!alert.acknowledged ? (
            <Button variant="ghost" onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </Button>
          ) : (
            <Badge tone="neutral">Acknowledged</Badge>
          )}
          {snoozed ? (
            <Button variant="ghost" onClick={() => onUnsnooze(alert.id)}>
              Unsnooze
            </Button>
          ) : (
            <>
              {SNOOZE_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant="ghost"
                  onClick={() => onSnooze(alert.id, snoozeUntil(option.hours))}
                >
                  Snooze {option.label}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type MaintenanceItemProps = {
  record: MaintenanceRecord;
  machineName: string;
};

function MaintenanceItem({ record, machineName }: MaintenanceItemProps) {

  return (
    <div className="schedule-item">
      <div className="schedule-date">
        <Timer size={12} strokeWidth={1.6} />
        <span>{new Date(record.date).toLocaleDateString()}</span>
      </div>
      <div>
        <div className="schedule-asset">{machineName}</div>
        <p>{record.description}</p>
        <span className="service-date">
          <Badge tone={record.status === "completed" ? ("green" as const) : ("neutral" as const)}>
            {record.status}
          </Badge>
          <Badge tone="neutral">{record.priority}</Badge>
        </span>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const machines = dataService.getMachines();
  const allAlerts = dataService.getAlerts();
  const maintenance = dataService.getMaintenance();

  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [ackFilter, setAckFilter] = useState<AckFilter>("all");

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (ackFilter === "acknowledged" && !a.acknowledged) return false;
      if (ackFilter === "unacknowledged" && a.acknowledged) return false;
      return true;
    });
  }, [allAlerts, severityFilter, ackFilter]);

  const criticalAlertsCount = dataService.getCriticalAlertsCount();
  const avgHealth = dataService.getAverageHealthScore();
  const avgUptime =
    machines.length > 0
      ? (
          machines.reduce((acc, m) => acc + m.uptimePercentage, 0) /
          machines.length
        ).toFixed(1)
      : "0";

  const conditionCounts = {
    operational: dataService.getActiveMachinesCount(),
    review: machines.filter((m) => m.status === "idle").length,
    service: machines.filter(
      (m) => m.status === "maintenance" || m.status === "offline",
    ).length,
  };
  const total = machines.length;
  const operationalPct = total ? (conditionCounts.operational / total) * 100 : 0;
  const reviewPct = total ? (conditionCounts.review / total) * 100 : 0;
  const servicePct = total ? (conditionCounts.service / total) * 100 : 0;

  const unacknowledgedAlerts = useMemo(
    () =>
      dataService
        .getUnacknowledgedAlerts()
        .filter((a) => severityFilter === "all" || a.severity === severityFilter),
    [severityFilter],
  );
  const upcomingMaintenance = maintenance.filter(
    (m) => m.status === "scheduled" || m.status === "in-progress",
  );

  const machineMetrics = machines.map((m) => ({
    id: m.id,
    name: m.name,
    healthScore: m.healthScore,
    status: m.status,
  }));

  return (
    <>
      <div className="dashboard-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          PLANT MONITORING
        </div>
        <h1>Dashboard</h1>
        <p>
          Plant condition, sensor trends, active alerts, and maintenance
          activity from simulated data. All values are demo readings until a
          live backend is connected.
        </p>
      </div>

      <div className="kpi-grid">
        <KpiCard
          icon={Gauge}
          label="Average Health"
          value={avgHealth}
          detail="Across all registered machines"
          tone={
            avgHealth >= 80 ? ("green" as const) : avgHealth >= 60 ? ("amber" as const) : ("red" as const)
          }

        />
        <KpiCard
          icon={ShieldAlert}
          label="Critical Alerts"
          value={criticalAlertsCount}
          detail={
            criticalAlertsCount > 0 ? "Requires immediate attention" : "All clear"
          }
          tone={
            criticalAlertsCount > 0 ? ("red" as const) : ("green" as const)
          }

        />
        <KpiCard
          icon={Activity}
          label="Fleet Uptime"
          value={`${avgUptime}%`}
          detail="Average operating availability"
          tone={
            parseFloat(avgUptime) >= 90 ? ("green" as const) : ("amber" as const)
          }

        />
        <KpiCard
          icon={RefreshCw}
          label="Upcoming Service"
          value={upcomingMaintenance.length}
          detail="Scheduled and in-progress tasks"
          tone={
            upcomingMaintenance.length > 0 ? ("amber" as const) : ("green" as const)
          }

        />
      </div>

      <div className="overview-strip">
        <section className="fleet-condition ui-card" aria-labelledby="fleet-condition-title">
          <div className="section-heading">
            <div>
              <div className="panel-kicker">FLEET CONDITION</div>
              <h2 className="panel-title" id="fleet-condition-title">
                Machine status distribution
              </h2>
            </div>
            <span className="fleet-total">{total} MACHINES</span>
          </div>
          <div className="condition-bar">
            <div
              className="condition-segment condition-operational"
              style={{ width: `${operationalPct}%` }}
              aria-label={`Operational: ${conditionCounts.operational}`}
            />
            <div
              className="condition-segment condition-review"
              style={{ width: `${reviewPct}%` }}
              aria-label={`Idle/Review: ${conditionCounts.review}`}
            />
            <div
              className="condition-segment condition-service"
              style={{ width: `${servicePct}%` }}
              aria-label={`Service/Offline: ${conditionCounts.service}`}
            />
          </div>
          <div className="condition-legend">
            <div className="condition-legend-item">
              <span className="condition-key" style={{ background: "#42c982" }} />
              <span>Operational</span>
              <strong>{conditionCounts.operational}</strong>
            </div>
            <div className="condition-legend-item">
              <span className="condition-key" style={{ background: "#e5b94b" }} />
              <span>Review</span>
              <strong>{conditionCounts.review}</strong>
            </div>
            <div className="condition-legend-item">
              <span className="condition-key" style={{ background: "#ed7387" }} />
              <span>Service</span>
              <strong>{conditionCounts.service}</strong>
            </div>
          </div>
        </section>

        <section className="overview-note ui-card">
          <div className="overview-note-icon">
            <ShieldAlert size={18} strokeWidth={1.8} />
          </div>
          <div>
            <strong>All data is simulated</strong>
            <p>
              Dashboard metrics, charts, alerts, and maintenance records are
              generated from centralized mock data. Connect a verified backend
              to replace these with live telemetry.
            </p>
          </div>
          <Link
            className="overview-note-arrow"
            href="/fleet"
            aria-label="Open fleet management"
          >
            <Play size={14} />
          </Link>
        </section>
      </div>

      <section className="dashboard-section">
        <div className="trends-section-heading">
          <div>
            <div className="panel-kicker">SENSOR TRENDS</div>
            <div className="section-title">Live sensor readings</div>
          </div>
          <span className="section-note">
            <span className="heading-divider">·</span>
            Simulated telemetry
          </span>
        </div>

        <div className="trend-grid">
          {machineMetrics.map((m) => (
            <div key={m.id} className="trend-card">
              <div className="trend-card-heading">
                <div>
                  <div className="panel-kicker">{m.name}</div>
                  <div className="section-title">Health score</div>
                </div>
                <Badge
                  tone={
                    m.healthScore >= 80
                      ? ("green" as const)
                      : m.healthScore >= 60
                        ? ("amber" as const)
                        : ("red" as const)
                  }
                >
                  {m.healthScore}
                </Badge>
              </div>
              <div className="trend-current">
                <strong>{m.healthScore}</strong>
                <span>{m.status.toUpperCase()}</span>
              </div>
              <div className="trend-figure">
                <svg
                  className="trend-svg"
                  width={100}
                  height={120}
                  viewBox="0 0 100 120"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label={`${m.name} health trend`}
                  role="img"
                >
                  <line
                    className="chart-gridline"
                    x1={20}
                    y1={60}
                    x2={80}
                    y2={60}
                  />
                  <path
                    className="chart-line"
                    d={`M 20 60 L 40 ${60 - (m.healthScore - 50) * 0.4} L 60 ${60 - (m.healthScore - 70) * 0.4} L 80 60`}
                    stroke="var(--accent)"
                  />
                  <circle
                    className="chart-point is-current"
                    cx={80}
                    cy={60}
                    r={3}
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="alert-filter-toolbar">
          <label className="filter-label">Severity</label>
          <select
            className="fleet-control fleet-select"
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter((e.target.value as Severity | "all") ?? "all")
            }
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label className="filter-label">Acknowledgement</label>
          <select
            className="fleet-control fleet-select"
            value={ackFilter}
            onChange={(e) => setAckFilter(e.target.value as AckFilter)}
          >
            <option value="all">All</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="unacknowledged">Unacknowledged</option>
          </select>
          <button
            className="fleet-clear-button ui-button button-ghost"
            onClick={() => {
              setSeverityFilter("all");
              setAckFilter("all");
            }}
          >
            Clear filters
          </button>
          <span className="filter-count">
            {filteredAlerts.length} of {allAlerts.length} alerts
          </span>
        </div>
        <div className="activity-grid">
          <section className="triage-panel ui-card" aria-labelledby="triage-title">
            <div className="triage-panel-heading">
              <div>
                <div className="panel-heading-icon">
                  <AlertCircle size={14} strokeWidth={1.8} />
                </div>
                <div className="panel-kicker">ACTIVE ALERTS</div>
                <h2 className="panel-title" id="triage-title">
                  Unacknowledged alerts
                </h2>
              </div>
              <span className="panel-description">
                {unacknowledgedAlerts.length} requiring attention
              </span>
            </div>
            <ul className="triage-list">
              {unacknowledgedAlerts.slice(0, 5).map((alert) => {
                const machine = machines.find((m) => m.id === alert.machineId);
                return (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    machineName={machine?.name ?? "Unknown"}
                    onAcknowledge={(id) => dataService.acknowledgeAlert(id)}
                    onSnooze={(id, until) => dataService.snoozeAlert(id, until)}
                    onUnsnooze={(id) => dataService.unsnoozeAlert(id)}
                  />
                );
              })}
              {unacknowledgedAlerts.length === 0 && (
                <li className="mini-empty-state">
                  <span>No unacknowledged alerts</span>
                </li>
              )}
            </ul>
            {unacknowledgedAlerts.length > 0 && (
              <div className="triage-disclaimer">
                All alerts shown are simulated until a real detection backend
                is integrated.
              </div>
            )}
          </section>

          <section className="schedule-panel ui-card" aria-labelledby="schedule-title">
            <div className="triage-panel-heading">
              <div>
                <div className="panel-heading-icon">
                  <Clock size={14} strokeWidth={1.8} />
                </div>
                <div className="panel-kicker">MAINTENANCE SCHEDULE</div>
                <h2 className="panel-title" id="schedule-title">
                  Upcoming service tasks
                </h2>
              </div>
              <span className="panel-description">
                {upcomingMaintenance.length} scheduled or in progress
              </span>
            </div>
            <ul className="schedule-list">
              {upcomingMaintenance.slice(0, 5).map((record) => {
                const machine = machines.find((m) => m.id === record.machineId);
                return (
                  <MaintenanceItem
                    key={record.id}
                    record={record}
                    machineName={machine?.name ?? "Unknown"}
                  />
                );
              })}
              {upcomingMaintenance.length === 0 && (
                <li className="mini-empty-state">
                  <span>No upcoming maintenance</span>
                </li>
              )}
            </ul>
          </section>

          <section className="recent-activity-panel ui-card" aria-labelledby="activity-title">
            <div className="triage-panel-heading">
              <div>
                <div className="panel-heading-icon">
                  <Activity size={14} strokeWidth={1.8} />
                </div>
                <div className="panel-kicker">RECENT ACTIVITY</div>
                <h2 className="panel-title" id="activity-title">
                  Machine events
                </h2>
              </div>
              <span className="panel-description">Latest fleet updates</span>
            </div>
            <ul className="recent-activity-list">
              {[...filteredAlerts]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((alert) => {
                  const machine = machines.find((m) => m.id === alert.machineId);
                  return (
                    <li key={alert.id} className="recent-activity-item">
                      <span className="activity-marker" />
                      <div>
                        <p>{alert.message}</p>
                        <span className="activity-time">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="activity-asset">
                          {machine?.name ?? "Unknown machine"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              {filteredAlerts.length === 0 && (
                <li className="mini-empty-state">
                  <span>No recent activity</span>
                </li>
              )}
            </ul>
          </section>
        </div>
      </section>

      <Link className="dashboard-open-fleet-link" href="/fleet" aria-label="View full fleet register">
        View full fleet register <span aria-hidden="true">→</span>
      </Link>
    </>
  );
}
