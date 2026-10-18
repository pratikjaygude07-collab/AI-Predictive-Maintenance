"use client";

import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  dataService,
  getWorkOrderSnapshot,
  subscribeWorkOrders,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/lib/data-service";
import type { MachineAsset } from "@/lib/mock-data";
import { Badge } from "../components/ui/primitives";

const STATUS_TONE: Record<WorkOrderStatus, "neutral" | "cyan" | "green" | "amber" | "red"> = {
  open: "neutral",
  "in-progress": "cyan",
  completed: "green",
  cancelled: "neutral",
};

const PRIORITY_TONE: Record<WorkOrderPriority, "neutral" | "cyan" | "green" | "amber" | "red"> = {
  low: "green",
  medium: "neutral",
  high: "amber",
  critical: "red",
};

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function WorkOrdersPage() {
  const [machines] = useState<MachineAsset[]>(() => dataService.getMachines());
  const workOrders = useSyncExternalStore(
    subscribeWorkOrders,
    getWorkOrderSnapshot,
    getWorkOrderSnapshot,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | "all">("all");

  useEffect(() => {
    dataService.loadWorkOrders();
  }, []);

  const filtered = useMemo(() => {
    return workOrders.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (priorityFilter !== "all" && w.priority !== priorityFilter) return false;
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
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
  }, [workOrders, statusFilter, priorityFilter, searchQuery]);

  const summary = dataService.getWorkOrderSummary();

  return (
    <div className="work-orders-page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          MAINTENANCE
        </div>
        <h1>Work Orders</h1>
        <p>
          Track, create, and edit maintenance work orders linked to registered
          machines. All records are simulated until a live maintenance backend
          is connected.
        </p>
      </div>

      <div className="work-orders-summary-row">
        <div className="summary-stat">
          <span className="summary-label">Total</span>
          <span className="summary-value">{summary.total}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Open</span>
          <span className="summary-value">{summary.byStatus.open}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">In Progress</span>
          <span className="summary-value">{summary.byStatus["in-progress"]}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Completed</span>
          <span className="summary-value">{summary.byStatus.completed}</span>
        </div>
      </div>

      <div className="work-orders-toolbar">
        <div className="toolbar-search">
          <Search size={12} strokeWidth={1.6} />
          <input
            className="fleet-control fleet-search"
            type="search"
            placeholder="Search by ID, title, technician, or machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-select">
          <span className="filter-label">Status</span>
          <select
            className="fleet-control fleet-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value as WorkOrderStatus | "all") ?? "all")
            }
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-select">
          <span className="filter-label">Priority</span>
          <select
            className="fleet-control fleet-select"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter((e.target.value as WorkOrderPriority | "all") ?? "all")
            }
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button
          className="fleet-clear-button ui-button button-ghost"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setPriorityFilter("all");
          }}
        >
          Clear filters
        </button>
        <Link
          href="/work-orders/create"
          className="ui-button button-primary"
        >
          <Plus size={14} strokeWidth={1.6} /> Create work order
        </Link>
        <span className="filter-count">
          {filtered.length} of {workOrders.length} work orders
        </span>
      </div>

      <div className="work-orders-list">
        {filtered.length === 0 ? (
          <div className="ui-card empty-state" style={{ padding: "32px 24px", textAlign: "center" }}>
            <AlertTriangle size={26} strokeWidth={1.6} />
            <h3 style={{ marginTop: "10px" }}>No work orders found</h3>
            <p style={{ color: "#8a9aaf", fontSize: "12px", marginTop: "6px" }}>
              Try adjusting your search or filter criteria, or create a new work
              order.
            </p>
          </div>
        ) : (
          filtered.map((workOrder) => {
            const machine = machines.find((m) => m.id === workOrder.machineId);
            return (
              <div key={workOrder.id} className="work-order-card ui-card">
                <div className="work-order-card-header">
                  <div className="work-order-id">{workOrder.id}</div>
                  <Link
                    href={`/machine/${workOrder.machineId}`}
                    className="work-order-machine-link"
                  >
                    {machine?.name ?? "Unknown machine"} (
                    {workOrder.machineId})
                  </Link>
                </div>
                <div className="work-order-title">{workOrder.title}</div>
                <div className="work-order-meta">
                  <Badge tone={STATUS_TONE[workOrder.status]}>
                    {STATUS_LABEL[workOrder.status]}
                  </Badge>
                  <Badge tone={PRIORITY_TONE[workOrder.priority]}>
                    {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)}
                  </Badge>
                  <span className="work-order-scheduled">
                    <Clock size={12} strokeWidth={1.6} />
                    {new Date(workOrder.scheduledDate).toLocaleDateString()}
                  </span>
                  <span className="work-order-technician">
                    {workOrder.technician || "Unassigned"}
                  </span>
                </div>
                <p className="work-order-description">
                  {workOrder.description}
                </p>
                <div className="work-order-card-actions">
                  <Link
                    href={`/work-orders/${workOrder.id}`}
                    className="ui-button button-ghost"
                  >
                    <ChevronRight size={14} strokeWidth={1.6} /> View
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="work-orders-note">
        <span>
          All work orders, assignments, and schedules are simulated. No
          notifications or technician assignments are actually delivered.
        </span>
      </div>
    </div>
  );
}
