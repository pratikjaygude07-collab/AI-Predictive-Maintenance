// Frontend-only alert state, persisted for the current browser session (sessionStorage).
// All alert data is simulated until a real detection backend is connected.

import type { Alert } from "@/lib/mock-data";

export type Severity = "low" | "medium" | "high" | "critical";
export type AckFilter = "all" | "acknowledged" | "unacknowledged";

export type AlertStateEntry = {
  acknowledged: boolean;
  snoozed: boolean;
  snoozedUntil?: string; // ISO string; alert is snoozed until this time
};

export type AlertState = Record<string, AlertStateEntry>;

export type AlertSummary = {
  total: number;
  acknowledged: number;
  unacknowledged: number;
  snoozed: number;
  bySeverity: Record<Severity, number>;
};

const SESSION_KEY = "mainai:alert-state";

function isStateEntry(value: unknown): value is AlertStateEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.acknowledged === "boolean" &&
    typeof entry.snoozed === "boolean" &&
    (entry.snoozedUntil === undefined || typeof entry.snoozedUntil === "string")
  );
}

function loadState(): AlertState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const state: AlertState = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isStateEntry(value)) {
        state[key] = value;
      }
    }
    return state;
  } catch {
    return {};
  }
}

function persist(state: AlertState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/private-mode errors; state remains in memory for the session.
  }
}

function now(): number {
  return Date.now();
}

function isSnoozed(entry: AlertStateEntry, nowMs: number): boolean {
  if (!entry.snoozed) return false;
  if (!entry.snoozedUntil) return true;
  return nowMs < new Date(entry.snoozedUntil).getTime();
}

export class AlertStateManager {
  private baseAlerts: Alert[];
  private state: AlertState;
  private lastSerialized: string | null = null;

  constructor(baseAlerts: Alert[]) {
    this.baseAlerts = baseAlerts;
    this.state = loadState();
    this.lastSerialized = JSON.stringify(this.state);

    // Seed state for every base alert so every alert has a persisted entry.
    for (const alert of baseAlerts) {
      if (!(alert.id in this.state)) {
        this.state[alert.id] = {
          acknowledged: alert.acknowledged,
          snoozed: alert.snoozed,
          snoozedUntil: alert.snoozedUntil,
        };
      }
    }
    this.persistIfChanged();
  }

  private entry(id: string): AlertStateEntry {
    return this.state[id] ?? { acknowledged: false, snoozed: false };
  }

  private applyState(alert: Alert): Alert {
    const entry = this.entry(alert.id);
    return {
      ...alert,
      acknowledged: entry.acknowledged,
      snoozed: entry.snoozed,
      snoozedUntil: entry.snoozedUntil,
    };
  }

  private persistIfChanged(): void {
    const next = JSON.stringify(this.state);
    if (next === this.lastSerialized) return;
    this.lastSerialized = next;
    persist(this.state);
  }

  getAlerts(options?: {
    machineId?: string;
    severity?: Severity | "all";
    acknowledgement?: AckFilter;
  }): Alert[] {
    const { machineId, severity = "all", acknowledgement = "all" } = options ?? {};

    return this.baseAlerts
      .filter((a) => (machineId ? a.machineId === machineId : true))
      .filter((a) => {
        const entry = this.entry(a.id);
        if (severity !== "all" && a.severity !== severity) return false;
        if (acknowledgement === "acknowledged" && !entry.acknowledged) return false;
        if (acknowledgement === "unacknowledged" && entry.acknowledged) return false;
        return true;
      })
      .map((a) => this.applyState(a));
  }

  getActiveAlerts(options?: {
    machineId?: string;
    severity?: Severity | "all";
  }): Alert[] {
    const nowMs = now();
    const { machineId, severity = "all" } = options ?? {};

    return this.baseAlerts
      .filter((a) => (machineId ? a.machineId === machineId : true))
      .filter((a) => {
        const entry = this.entry(a.id);
        if (entry.acknowledged) return false;
        if (isSnoozed(entry, nowMs)) return false;
        if (severity !== "all" && a.severity !== severity) return false;
        return true;
      })
      .map((a) => this.applyState(a));
  }

  getCriticalAlertsCount(): number {
    const nowMs = now();
    return this.baseAlerts.reduce((count, a) => {
      if (a.severity !== "critical") return count;
      const entry = this.entry(a.id);
      if (entry.acknowledged) return count;
      if (isSnoozed(entry, nowMs)) return count;
      return count + 1;
    }, 0);
  }

  getSummary(): AlertSummary {
    const nowMs = now();
    const summary: AlertSummary = {
      total: this.baseAlerts.length,
      acknowledged: 0,
      unacknowledged: 0,
      snoozed: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    };

    for (const alert of this.baseAlerts) {
      const entry = this.entry(alert.id);
      summary.bySeverity[alert.severity] += 1;
      if (entry.acknowledged) summary.acknowledged += 1;
      else summary.unacknowledged += 1;
      if (isSnoozed(entry, nowMs)) summary.snoozed += 1;
    }

    return summary;
  }

  acknowledgeAlert(id: string): void {
    const entry = this.entry(id);
    entry.acknowledged = true;
    entry.snoozed = false;
    entry.snoozedUntil = undefined;
    this.state[id] = entry;
    this.persistIfChanged();
  }

  snoozeAlert(id: string, until: string): void {
    const entry = this.entry(id);
    entry.snoozed = true;
    entry.snoozedUntil = until;
    this.state[id] = entry;
    this.persistIfChanged();
  }

  unsnoozeAlert(id: string): void {
    const entry = this.entry(id);
    entry.snoozed = false;
    entry.snoozedUntil = undefined;
    this.state[id] = entry;
    this.persistIfChanged();
  }

  getAlertState(id: string): AlertStateEntry {
    return { ...this.entry(id) };
  }
}
