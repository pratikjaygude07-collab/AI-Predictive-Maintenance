import { dataAccess, MOCK_ALERTS, MOCK_WORK_ORDERS } from "@/lib/mock-data";
import {
  AlertStateManager,
  type AckFilter,
  type AlertSummary,
  type Severity,
} from "@/lib/alert-state";
import {
  WorkOrderStateManager,
  type CreateWorkOrderInput,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
  type WorkOrderSummary,
  type WorkOrderUpdate,
} from "@/lib/work-order-state";
import type {
  Alert,
  FaultAnalysis,
  HealthTrendPoint,
  MachineAsset,
  MaintenanceRecord,
  OperationalMetrics,
  SensorReading,
} from "@/lib/mock-data";

export interface DataService {
  getMachines(): MachineAsset[];
  getMachineById(id: string): MachineAsset | undefined;
  getSensorReadings(machineId: string): SensorReading[];
  getOperationalMetrics(machineId: string): OperationalMetrics;
  getHealthTrend(machineId: string): HealthTrendPoint[];
  getFaultAnalyses(machineId?: string): FaultAnalysis[];
  getFaultAnalysisById(id: string): FaultAnalysis | undefined;
  getAlerts(machineId?: string): Alert[];
  getActiveAlerts(machineId?: string): Alert[];
  getUnacknowledgedAlerts(): Alert[];
  acknowledgeAlert(id: string): void;
  snoozeAlert(id: string, until: string): void;
  unsnoozeAlert(id: string): void;
  getAlertSummary(): AlertSummary;
  getMaintenance(machineId?: string): MaintenanceRecord[];
  getMaintenanceById(id: string): MaintenanceRecord | undefined;
  getActiveMachinesCount(): number;
  getMaintenanceCount(): number;
  getUpcomingMaintenanceCount(): number;
  getCriticalAlertsCount(): number;
  getAverageHealthScore(): number;
  loadWorkOrders(): void;
  getWorkOrders(options?: {
    machineId?: string;
    status?: WorkOrder["status"];
    priority?: WorkOrder["priority"];
    search?: string;
  }): WorkOrder[];
  getWorkOrderById(id: string): WorkOrder | undefined;
  getWorkOrdersByMachine(machineId: string): WorkOrder[];
  createWorkOrder(input: CreateWorkOrderInput): WorkOrder;
  updateWorkOrder(id: string, patch: WorkOrderUpdate): WorkOrder | undefined;
  deleteWorkOrder(id: string): boolean;
  getWorkOrderSummary(): WorkOrderSummary;
}

const alertState = new AlertStateManager(MOCK_ALERTS);
const workOrderState = new WorkOrderStateManager(
  MOCK_WORK_ORDERS,
  dataAccess.getMachineById,
);

const subscribers = new Set<() => void>();
const workOrderSubscribers = new Set<() => void>();

function notify(): void {
  for (const subscriber of subscribers) {
    try {
      subscriber();
    } catch {
      // Ignore subscriber errors; other subscribers should still run.
    }
  }
}

function notifyWorkOrders(): void {
  for (const subscriber of workOrderSubscribers) {
    try {
      subscriber();
    } catch {
      // Ignore subscriber errors; other subscribers should still run.
    }
  }
}

export function subscribeDataService(listener: () => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function subscribeWorkOrders(listener: () => void): () => void {
  workOrderSubscribers.add(listener);
  return () => {
    workOrderSubscribers.delete(listener);
  };
}

export function getWorkOrderSnapshot(): WorkOrder[] {
  return workOrderState.getSnapshot();
}

export const mockDataService: DataService = {
  getMachines: () => dataAccess.getMachines(),
  getMachineById: (id) => dataAccess.getMachineById(id),
  getSensorReadings: (machineId) => dataAccess.getSensorReadings(machineId),
  getOperationalMetrics: (machineId) => dataAccess.getOperationalMetrics(machineId),
  getHealthTrend: (machineId) => dataAccess.getHealthTrend(machineId),
  getFaultAnalyses: (machineId) => dataAccess.getFaultAnalyses(machineId),
  getFaultAnalysisById: (id) => dataAccess.getFaultAnalysisById(id),
  getAlerts: (machineId) => alertState.getAlerts({ machineId }),
  getActiveAlerts: (machineId) => alertState.getActiveAlerts({ machineId }),
  getUnacknowledgedAlerts: () => alertState.getActiveAlerts(),
  acknowledgeAlert: (id) => {
    alertState.acknowledgeAlert(id);
    notify();
  },
  snoozeAlert: (id, until) => {
    alertState.snoozeAlert(id, until);
    notify();
  },
  unsnoozeAlert: (id) => {
    alertState.unsnoozeAlert(id);
    notify();
  },
  getAlertSummary: () => alertState.getSummary(),
  getMaintenance: (machineId) => dataAccess.getMaintenance(machineId),
  getMaintenanceById: (id) => dataAccess.getMaintenanceById(id),
  getActiveMachinesCount: () => dataAccess.getActiveMachinesCount(),
  getMaintenanceCount: () => dataAccess.getMaintenanceCount(),
  getUpcomingMaintenanceCount: () => dataAccess.getUpcomingMaintenanceCount(),
  getCriticalAlertsCount: () => alertState.getCriticalAlertsCount(),
  getAverageHealthScore: () => dataAccess.getAverageHealthScore(),
  loadWorkOrders: () => {
    const changed = workOrderState.loadPersisted();
    if (changed) notifyWorkOrders();
  },
  getWorkOrders: (options) => workOrderState.getWorkOrders(options),
  getWorkOrderById: (id) => workOrderState.getWorkOrderById(id),
  getWorkOrdersByMachine: (machineId) =>
    workOrderState.getWorkOrdersByMachine(machineId),
  createWorkOrder: (input) => {
    const created = workOrderState.createWorkOrder(input);
    notifyWorkOrders();
    return created;
  },
  updateWorkOrder: (id, patch) => {
    const updated = workOrderState.updateWorkOrder(id, patch);
    notifyWorkOrders();
    return updated;
  },
  deleteWorkOrder: (id) => {
    const deleted = workOrderState.deleteWorkOrder(id);
    notifyWorkOrders();
    return deleted;
  },
  getWorkOrderSummary: () => workOrderState.getSummary(),
};

export const dataService: DataService = mockDataService;

// Re-export filter and work order types for consumers.
export type {
  Severity,
  AckFilter,
  AlertSummary,
  CreateWorkOrderInput,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderSummary,
  WorkOrderUpdate,
};
