import assert from "node:assert/strict";
import test from "node:test";
import {
  WorkOrderStateManager,
  type WorkOrder,
  type WorkOrderStatus,
  type WorkOrderPriority,
  type CreateWorkOrderInput,
} from "./work-order-state.ts";
import { dataAccess, MOCK_WORK_ORDERS } from "./mock-data.ts";

function baseState(): WorkOrder[] {
  return [...MOCK_WORK_ORDERS];
}

function freshManager(sessionStore?: Map<string, string>): WorkOrderStateManager {
  if (sessionStore) {
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => sessionStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          sessionStore.set(key, value);
        },
        removeItem: (key: string) => {
          sessionStore.delete(key);
        },
      },
    };
  } else {
    (globalThis as { window?: unknown }).window = undefined;
  }
  return new WorkOrderStateManager(baseState(), dataAccess.getMachineById);
}

function validInput(overrides: Partial<CreateWorkOrderInput> = {}): CreateWorkOrderInput {
  return {
    machineId: "M-001",
    title: "Routine inspection",
    description: "Inspect machine.",
    notes: "None.",
    status: "open",
    priority: "medium",
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString(),
    technician: "John Miller",
    ...overrides,
  };
}

test("initial state mirrors simulated mock data", () => {
  const manager = freshManager();
  const summary = manager.getSummary();
  assert.equal(summary.total, 4);
  assert.equal(summary.byStatus.open, 2);
  assert.equal(summary.byStatus["in-progress"], 1);
  assert.equal(summary.byStatus.completed, 1);
  assert.equal(summary.byStatus.cancelled, 0);
  assert.equal(summary.byPriority.critical, 1);
  assert.equal(summary.byPriority.high, 1);
  assert.equal(summary.byPriority.medium, 1);
  assert.equal(summary.byPriority.low, 1);
  assert.equal(summary.byMachine["M-005"], 1);
  assert.equal(summary.byMachine["M-004"], 1);
  assert.equal(summary.byMachine["M-002"], 1);
  assert.equal(summary.byMachine["M-001"], 1);
});

test("create work order assigns stable id and timestamps", () => {
  const manager = freshManager();
  const before = manager.getWorkOrders().length;

  const created = manager.createWorkOrder(validInput());

  assert.equal(created.id, "WO-005");
  assert.equal(created.machineId, "M-001");
  assert.equal(created.title, "Routine inspection");
  assert.equal(created.status, "open");
  assert.equal(created.createdAt, created.updatedAt);
  assert.ok(new Date(created.createdAt).getTime() > 0);
  assert.equal(manager.getWorkOrders().length, before + 1);
  assert.equal(manager.getSummary().total, 5);
  assert.equal(manager.getSummary().byStatus.open, 3);
});

test("create work order validates machine id and required fields", () => {
  const manager = freshManager();

  assert.throws(() => manager.createWorkOrder(validInput({ machineId: "M-999" })));
  assert.throws(() => manager.createWorkOrder(validInput({ title: "" })));
  assert.throws(() => manager.createWorkOrder(validInput({ scheduledDate: "not-a-date" })));
  assert.throws(() => manager.createWorkOrder(validInput({ priority: "urgent" as WorkOrderPriority })));
  assert.throws(() => manager.createWorkOrder(validInput({ status: "archived" as WorkOrderStatus })));

  // No new work order created after validation failures.
  assert.equal(manager.getWorkOrders().length, 4);
});

test("update work order modifies fields and bumps updatedAt", () => {
  const manager = freshManager();
  const original = manager.getWorkOrderById("WO-001")!;
  const originalUpdatedAt = original.updatedAt;

  const updated = manager.updateWorkOrder("WO-001", {
    status: "completed",
    technician: "Lisa Anderson",
    notes: "Finished ahead of schedule.",
  });

  assert.ok(updated);
  assert.equal(updated.status, "completed");
  assert.equal(updated.technician, "Lisa Anderson");
  assert.equal(updated.notes, "Finished ahead of schedule.");
  assert.equal(updated.id, "WO-001");
  assert.equal(updated.createdAt, original.createdAt);
  assert.notEqual(updated.updatedAt, originalUpdatedAt);
  assert.equal(updated.updatedAt > originalUpdatedAt, true);

  const stored = manager.getWorkOrderById("WO-001")!;
  assert.equal(stored.status, "completed");
});

test("status transitions are tracked", () => {
  const manager = freshManager();
  manager.updateWorkOrder("WO-002", { status: "in-progress" });
  assert.equal(manager.getWorkOrderById("WO-002")!.status, "in-progress");
  manager.updateWorkOrder("WO-002", { status: "completed" });
  assert.equal(manager.getWorkOrderById("WO-002")!.status, "completed");

  const summary = manager.getSummary();
  assert.equal(summary.byStatus["in-progress"], 1);
  assert.equal(summary.byStatus.completed, 2);
});

test("update nonexistent work order returns undefined", () => {
  const manager = freshManager();
  assert.equal(manager.updateWorkOrder("WO-999", { title: "x" }), undefined);
});

test("machine association filters work orders correctly", () => {
  const manager = freshManager();
  const m5 = manager.getWorkOrdersByMachine("M-005");
  assert.equal(m5.length, 1);
  assert.equal(m5[0].id, "WO-001");

  const allM001 = manager.getWorkOrders({ machineId: "M-001" });
  assert.equal(allM001.length, 1);
  assert.equal(allM001[0].id, "WO-004");
});

test("search and filter work orders", () => {
  const manager = freshManager();

  const byPriority = manager.getWorkOrders({ priority: "critical" });
  assert.equal(byPriority.length, 1);
  assert.equal(byPriority[0].id, "WO-001");

  const byStatus = manager.getWorkOrders({ status: "open" });
  assert.equal(byStatus.length, 2);

  const search = manager.getWorkOrders({ search: "alignment" });
  assert.equal(search.length, 1);
  assert.equal(search[0].id, "WO-002");

  const combined = manager.getWorkOrders({
    machineId: "M-004",
    status: "open",
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, "WO-002");
});

test("delete work order removes it", () => {
  const manager = freshManager();
  assert.equal(manager.deleteWorkOrder("WO-003"), true);
  assert.equal(manager.getWorkOrderById("WO-003"), undefined);
  assert.equal(manager.getWorkOrders().length, 3);
  assert.equal(manager.deleteWorkOrder("WO-003"), false);
});

test("work order state persists across instances via localStorage", () => {
  const store = new Map<string, string>();
  const manager1 = freshManager(store);
  manager1.createWorkOrder(validInput({ title: "Persisted work order" }));
  manager1.updateWorkOrder("WO-001", { status: "cancelled" });

  const manager2 = freshManager(store);
  manager2.loadPersisted();
  assert.equal(manager2.getWorkOrderById("WO-001")!.status, "cancelled");
  assert.ok(manager2.getWorkOrders().some((w) => w.title === "Persisted work order"));
  assert.equal(manager2.getSummary().total, 5);
});

test("manager loads without window (SSR-safe)", () => {
  const manager = freshManager();
  assert.equal(manager.getWorkOrders().length, 4);
  assert.equal(manager.getWorkOrderById("WO-001")!.id, "WO-001");
});
