import assert from "node:assert/strict";
import test from "node:test";
import { AlertStateManager } from "./alert-state.ts";
import type { Alert } from "./mock-data.ts";
import { MOCK_ALERTS } from "./mock-data.ts";

function byId(alerts: Alert[]): Map<string, Alert> {
  return new Map(alerts.map((a) => [a.id, a]));
}

function freshManager(sessionStore?: Map<string, string>): AlertStateManager {
  if (sessionStore) {
    (globalThis as { window?: unknown }).window = {
      sessionStorage: {
        getItem: (key: string) => sessionStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          sessionStore.set(key, value);
        },
      },
    };
  } else {
    (globalThis as { window?: unknown }).window = undefined;
  }
  return new AlertStateManager([...MOCK_ALERTS]);
}

test("alert manager initial state mirrors simulated mock data", () => {
  const manager = freshManager();
  const summary = manager.getSummary();
  assert.equal(summary.total, 6);
  assert.equal(summary.unacknowledged, 4);
  assert.equal(summary.acknowledged, 2);
  assert.equal(summary.snoozed, 0);
  assert.equal(summary.bySeverity.critical, 1);
  assert.equal(summary.bySeverity.high, 1);
  assert.equal(summary.bySeverity.medium, 2);
  assert.equal(summary.bySeverity.low, 2);
  assert.equal(manager.getCriticalAlertsCount(), 1);
});

test("acknowledgeAlert marks an alert acknowledged and removes it from active set", () => {
  const manager = freshManager();
  const activeBefore = manager.getActiveAlerts();
  assert.ok(activeBefore.some((a) => a.id === "A-001"));

  manager.acknowledgeAlert("A-001");

  const a1 = byId(manager.getAlerts()).get("A-001")!;
  assert.equal(a1.acknowledged, true);
  assert.equal(a1.snoozed, false);
  assert.equal(manager.getActiveAlerts().some((a) => a.id === "A-001"), false);
  assert.equal(manager.getCriticalAlertsCount(), 0);
  assert.equal(manager.getSummary().acknowledged, 3);
  assert.equal(manager.getSummary().unacknowledged, 3);
});

test("snoozeAlert hides an alert from the active set until it expires", () => {
  const manager = freshManager();
  const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  manager.snoozeAlert("A-002", until);

  const a2 = byId(manager.getAlerts()).get("A-002")!;
  assert.equal(a2.snoozed, true);
  assert.equal(a2.snoozedUntil, until);
  assert.equal(manager.getActiveAlerts().some((a) => a.id === "A-002"), false);
  assert.equal(manager.getSummary().snoozed, 1);
  // Snoozing a non-critical alert does not change critical count.
  assert.equal(manager.getCriticalAlertsCount(), 1);
});

test("unsnoozeAlert restores an unacknowledged alert to the active set", () => {
  const manager = freshManager();
  manager.snoozeAlert("A-002", new Date(Date.now() + 60 * 60 * 1000).toISOString());
  assert.equal(manager.getActiveAlerts().some((a) => a.id === "A-002"), false);

  manager.unsnoozeAlert("A-002");

  const a2 = byId(manager.getAlerts()).get("A-002")!;
  assert.equal(a2.snoozed, false);
  assert.equal(a2.snoozedUntil, undefined);
  assert.equal(manager.getActiveAlerts().some((a) => a.id === "A-002"), true);
  assert.equal(manager.getSummary().snoozed, 0);
});

test("an alert snoozed into the past is treated as expired", () => {
  const manager = freshManager();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  manager.snoozeAlert("A-002", past);

  assert.equal(manager.getActiveAlerts().some((a) => a.id === "A-002"), true);
  assert.equal(manager.getSummary().snoozed, 0);
});

test("acknowledging a snoozed alert clears the snooze", () => {
  const manager = freshManager();
  manager.snoozeAlert("A-001", new Date(Date.now() + 60 * 60 * 1000).toISOString());
  assert.equal(byId(manager.getAlerts()).get("A-001")!.snoozed, true);

  manager.acknowledgeAlert("A-001");

  const a1 = byId(manager.getAlerts()).get("A-001")!;
  assert.equal(a1.acknowledged, true);
  assert.equal(a1.snoozed, false);
  assert.equal(a1.snoozedUntil, undefined);
});

test("getAlerts filters by severity and acknowledgement status", () => {
  const manager = freshManager();

  const critical = manager.getAlerts({ severity: "critical" });
  assert.equal(critical.length, 1);
  assert.equal(critical[0].id, "A-001");

  const unacknowledged = manager.getAlerts({ acknowledgement: "unacknowledged" });
  assert.equal(unacknowledged.length, 4);
  assert.ok(unacknowledged.every((a) => !a.acknowledged));

  const acknowledged = manager.getAlerts({ acknowledgement: "acknowledged" });
  assert.equal(acknowledged.length, 2);
  assert.ok(acknowledged.every((a) => a.acknowledged));

  const criticalUnacknowledged = manager.getAlerts({
    severity: "critical",
    acknowledgement: "unacknowledged",
  });
  assert.equal(criticalUnacknowledged.length, 1);
});

test("alert state persists across manager instances via sessionStorage", () => {
  const store = new Map<string, string>();

  const manager1 = freshManager(store);
  manager1.acknowledgeAlert("A-001");
  manager1.snoozeAlert("A-002", new Date(Date.now() + 60 * 60 * 1000).toISOString());

  const manager2 = freshManager(store);
  assert.equal(byId(manager2.getAlerts()).get("A-001")!.acknowledged, true);
  assert.equal(byId(manager2.getAlerts()).get("A-002")!.snoozed, true);
  assert.equal(manager2.getActiveAlerts().some((a) => a.id === "A-001"), false);
  assert.equal(manager2.getActiveAlerts().some((a) => a.id === "A-002"), false);
  assert.equal(manager2.getCriticalAlertsCount(), 0);
});
