// Frontend-only work order state, persisted in browser localStorage.
// All work order data is simulated until a real maintenance backend is connected.

import type {
  MachineAsset,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/lib/mock-data";

export type {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
};

export type CreateWorkOrderInput = {
  machineId: string;
  title: string;
  description: string;
  notes: string;
  status: WorkOrder["status"];
  priority: WorkOrder["priority"];
  scheduledDate: string;
  technician: string;
};

export type WorkOrderUpdate = Partial<Omit<WorkOrder, "id" | "createdAt">>;

export type WorkOrderSummary = {
  total: number;
  byStatus: Record<WorkOrder["status"], number>;
  byPriority: Record<WorkOrder["priority"], number>;
  byMachine: Record<string, number>;
};

const STORAGE_KEY = "mainai:work-orders";
const ID_PREFIX = "WO-";

function nowISO(): string {
  return new Date().toISOString();
}

function nextId(ids: string[]): string {
  let max = 0;
  for (const id of ids) {
    const match = id.match(/^WO-(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${ID_PREFIX}${String(max + 1).padStart(3, "0")}`;
}

function isWorkOrder(value: unknown): value is WorkOrder {
  if (typeof value !== "object" || value === null) return false;
  const wo = value as Record<string, unknown>;
  return (
    typeof wo.id === "string" &&
    typeof wo.machineId === "string" &&
    typeof wo.title === "string" &&
    typeof wo.description === "string" &&
    typeof wo.notes === "string" &&
    typeof wo.status === "string" &&
    typeof wo.priority === "string" &&
    typeof wo.scheduledDate === "string" &&
    typeof wo.createdAt === "string" &&
    typeof wo.updatedAt === "string" &&
    typeof wo.technician === "string"
  );
}

function loadPersisted(): WorkOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkOrder);
  } catch {
    return [];
  }
}

function persist(workOrders: WorkOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workOrders));
  } catch {
    // Ignore quota/private-mode errors; state remains in memory for the session.
  }
}

export function validateWorkOrderInput(
  input: CreateWorkOrderInput,
  getMachineById: (id: string) => MachineAsset | undefined,
): string[] {
  const errors: string[] = [];

  if (!input.machineId || !getMachineById(input.machineId)) {
    errors.push("A valid machine must be selected.");
  }
  if (!input.title || !input.title.trim()) {
    errors.push("Title is required.");
  }
  if (!input.scheduledDate || isNaN(new Date(input.scheduledDate).getTime())) {
    errors.push("A valid scheduled date is required.");
  }
  if (
    !["low", "medium", "high", "critical"].includes(input.priority ?? "")
  ) {
    errors.push("Priority must be Low, Medium, High, or Critical.");
  }
  if (
    !["open", "in-progress", "completed", "cancelled"].includes(
      input.status ?? "",
    )
  ) {
    errors.push("Status must be Open, In Progress, Completed, or Cancelled.");
  }

  return errors;
}

export class WorkOrderStateManager {
  private baseWorkOrders: WorkOrder[];
  private state: Record<string, WorkOrder>;
  private getMachineById: (id: string) => MachineAsset | undefined;
  private lastSerialized: string | null = null;
  private snapshot: WorkOrder[];
  private snapshotSerialized: string | null = null;

  constructor(
    baseWorkOrders: WorkOrder[],
    getMachineById: (id: string) => MachineAsset | undefined,
  ) {
    this.baseWorkOrders = baseWorkOrders;
    this.getMachineById = getMachineById;
    this.state = {};
    for (const workOrder of baseWorkOrders) {
      this.state[workOrder.id] = { ...workOrder };
    }
    this.lastSerialized = JSON.stringify(Object.values(this.state));
    this.snapshot = Object.values(this.state);
    this.snapshotSerialized = this.lastSerialized;
    // Intentionally do not read localStorage here to avoid SSR hydration mismatches.
    // Call loadPersisted() on the client after mounting.
  }

  private persistIfChanged(): boolean {
    const next = JSON.stringify(Object.values(this.state));
    if (next === this.lastSerialized) return false;
    this.lastSerialized = next;
    this.snapshot = Object.values(this.state);
    this.snapshotSerialized = next;
    persist(Object.values(this.state));
    return true;
  }

  loadPersisted(): boolean {
    const persisted = loadPersisted();
    let changed = false;
    for (const workOrder of persisted) {
      const existing = this.state[workOrder.id];
      this.state[workOrder.id] = existing
        ? { ...existing, ...workOrder }
        : { ...workOrder };
      changed = true;
    }
    return changed && this.persistIfChanged();
  }

  private all(): WorkOrder[] {
    return Object.values(this.state);
  }

  getSnapshot(): WorkOrder[] {
    if (this.snapshotSerialized !== this.lastSerialized) {
      this.snapshot = Object.values(this.state);
      this.snapshotSerialized = this.lastSerialized;
    }
    return this.snapshot;
  }

  getWorkOrders(options?: {
    machineId?: string;
    status?: WorkOrder["status"];
    priority?: WorkOrder["priority"];
    search?: string;
  }): WorkOrder[] {
    const {
      machineId,
      status,
      priority,
      search,
    } = options ?? {};
    const term = (search ?? "").toLowerCase();

    return this.all().filter((w) => {
      if (machineId && w.machineId !== machineId) return false;
      if (status && w.status !== status) return false;
      if (priority && w.priority !== priority) return false;
      if (term) {
        const haystack = [
          w.id,
          w.title,
          w.description,
          w.notes,
          w.technician,
          w.machineId,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  getWorkOrderById(id: string): WorkOrder | undefined {
    return this.state[id] ? { ...this.state[id] } : undefined;
  }

  getWorkOrdersByMachine(machineId: string): WorkOrder[] {
    return this.getWorkOrders({ machineId });
  }

  createWorkOrder(input: CreateWorkOrderInput): WorkOrder {
    const errors = validateWorkOrderInput(input, this.getMachineById);
    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    const now = nowISO();
    const id = nextId(Object.keys(this.state));
    const workOrder: WorkOrder = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.state[id] = workOrder;
    this.persistIfChanged();
    return { ...workOrder };
  }

  updateWorkOrder(id: string, patch: WorkOrderUpdate): WorkOrder | undefined {
    const existing = this.state[id];
    if (!existing) return undefined;

    const updated: WorkOrder = {
      ...existing,
      ...patch,
      id,
      updatedAt: nowISO(),
    };

    // Validate machineId if present in patch.
    if (patch.machineId && !this.getMachineById(patch.machineId)) {
      throw new Error("A valid machine must be selected.");
    }
    if (
      patch.scheduledDate !== undefined &&
      isNaN(new Date(patch.scheduledDate).getTime())
    ) {
      throw new Error("A valid scheduled date is required.");
    }

    this.state[id] = updated;
    this.persistIfChanged();
    return { ...updated };
  }

  deleteWorkOrder(id: string): boolean {
    if (!(id in this.state)) return false;
    delete this.state[id];
    this.persistIfChanged();
    return true;
  }

  getSummary(): WorkOrderSummary {
    const summary: WorkOrderSummary = {
      total: this.all().length,
      byStatus: { open: 0, "in-progress": 0, completed: 0, cancelled: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byMachine: {},
    };

    for (const workOrder of this.all()) {
      summary.byStatus[workOrder.status] += 1;
      summary.byPriority[workOrder.priority] += 1;
      summary.byMachine[workOrder.machineId] =
        (summary.byMachine[workOrder.machineId] ?? 0) + 1;
    }

    return summary;
  }
}
