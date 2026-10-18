"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Edit2,
  Save,
  User,
  X,
} from "lucide-react";
import {
  dataService,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/lib/data-service";
import { Badge } from "../../components/ui/primitives";

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

function dateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

type FormValues = {
  title: string;
  description: string;
  notes: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: string;
  technician: string;
};

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const workOrder = dataService.getWorkOrderById(id) ?? null;
  const notFound = !workOrder;
  const [editMode, setEditMode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialForm: FormValues = workOrder
    ? {
        title: workOrder.title,
        description: workOrder.description,
        notes: workOrder.notes,
        status: workOrder.status,
        priority: workOrder.priority,
        scheduledDate: dateInputValue(workOrder.scheduledDate),
        technician: workOrder.technician,
      }
    : {
        title: "",
        description: "",
        notes: "",
        status: "open",
        priority: "medium",
        scheduledDate: "",
        technician: "",
      };
  const [form, setForm] = useState<FormValues>(initialForm);

  useEffect(() => {
    dataService.loadWorkOrders();
  }, [id]);

  // React hooks must run unconditionally in the same order on every render.
  // Place them before any early returns.
  const handleSave = useCallback(() => {
    if (!workOrder) return;
    setSaveError(null);
    try {
      const updated = dataService.updateWorkOrder(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        status: form.status,
        priority: form.priority,
        scheduledDate: form.scheduledDate
          ? new Date(form.scheduledDate).toISOString()
          : workOrder.scheduledDate,
        technician: form.technician.trim(),
      });
      if (!updated) {
        setSaveError("Work order not found.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        title: updated.title,
        description: updated.description,
        notes: updated.notes,
        status: updated.status,
        priority: updated.priority,
        scheduledDate: dateInputValue(updated.scheduledDate),
        technician: updated.technician,
      }));
      setEditMode(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save.");
    }
  }, [id, form, workOrder, setSaveError, setForm, setEditMode]);

  const handleChange = useCallback(
    (key: keyof FormValues, value: string) => {
      setSaveError(null);
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setSaveError, setForm],
  );

  const statusOptions: WorkOrderStatus[] = [
    "open",
    "in-progress",
    "completed",
    "cancelled",
  ];
  const priorityOptions: WorkOrderPriority[] = ["low", "medium", "high", "critical"];

  if (notFound) {
    return (
      <div className="work-order-detail-page">
        <div className="page-heading">
          <div className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true" />
            MAINTENANCE
          </div>
          <h1>Work order not found</h1>
          <p>
            No work order matches ID {id}. All data is simulated until a live
            maintenance backend is connected.
          </p>
        </div>
        <div className="ui-card" style={{ padding: "24px", marginTop: "24px" }}>
          <p>
            <Link href="/work-orders" className="ui-button button-secondary">
              Return to work orders
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div key={id} className="work-order-detail-page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          MAINTENANCE
        </div>
        <h1>Work Order {workOrder.id}</h1>
        <p>
          Simulated maintenance record for machine{" "}
          <strong>{workOrder.machineId}</strong>. All data is simulated until a
          live maintenance backend is connected.
        </p>
      </div>

      <div className="work-order-detail-grid">
        <div className="detail-section ui-card">
          <div className="section-heading">
            <h2>Work order summary</h2>
          </div>
          <div className="detail-row">
            <span className="detail-label">ID</span>
            <span className="detail-value">{workOrder.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Machine</span>
            <span className="detail-value">{workOrder.machineId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Title</span>
            <span className="detail-value">{workOrder.title}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <Badge tone={STATUS_TONE[workOrder.status]}>
              {STATUS_LABEL[workOrder.status]}
            </Badge>
          </div>
          <div className="detail-row">
            <span className="detail-label">Priority</span>
            <Badge tone={PRIORITY_TONE[workOrder.priority]}>
              {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)}
            </Badge>
          </div>
          <div className="detail-row">
            <span className="detail-label">Scheduled date</span>
            <span className="detail-value">
              <Clock size={12} strokeWidth={1.6} />
              {new Date(workOrder.scheduledDate).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Technician</span>
            <span className="detail-value">
              <User size={12} strokeWidth={1.6} />
              {workOrder.technician || "Unassigned"}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Created</span>
            <span className="detail-value">
              {new Date(workOrder.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Updated</span>
            <span className="detail-value">
              {new Date(workOrder.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="detail-section ui-card">
          <div className="section-heading">
            <h2>Description and notes</h2>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-value">{workOrder.description}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Notes</span>
            <span className="detail-value">{workOrder.notes || "—"}</span>
          </div>
        </div>

        <div className="detail-actions">
          {editMode ? null : (
            <>
              <button
                className="ui-button button-ghost"
                onClick={() => setEditMode(true)}
              >
                <Edit2 size={14} strokeWidth={1.6} /> Edit
              </button>
              <Link
                href="/work-orders"
                className="ui-button button-ghost"
              >
                <ChevronLeft size={14} strokeWidth={1.6} /> Back to work orders
              </Link>
            </>
          )}
        </div>

        {editMode && (
          <div className="detail-section ui-card edit-form">
            <div className="section-heading">
              <h2>Edit work order</h2>
            </div>
            {saveError && (
              <div className="validation-error" role="alert">
                <AlertTriangle size={14} strokeWidth={1.6} />
                <span>{saveError}</span>
              </div>
            )}
            <div className="form-grid">
              <div className="form-field">
                <label>Title <span className="required">*</span></label>
                <input
                  className="fleet-control"
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Machine <span className="required">*</span></label>
                <span className="form-static">{workOrder.machineId}</span>
              </div>
              <div className="form-field">
                <label>Status <span className="required">*</span></label>
                <select
                  className="fleet-control fleet-select"
                  value={form.status}
                  onChange={(e) =>
                    handleChange("status", e.target.value as WorkOrderStatus)
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Priority <span className="required">*</span></label>
                <select
                  className="fleet-control fleet-select"
                  value={form.priority}
                  onChange={(e) =>
                    handleChange("priority", e.target.value as WorkOrderPriority)
                  }
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Scheduled date <span className="required">*</span></label>
                <input
                  className="fleet-control"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => handleChange("scheduledDate", e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Technician</label>
                <input
                  className="fleet-control"
                  type="text"
                  value={form.technician}
                  onChange={(e) => handleChange("technician", e.target.value)}
                  placeholder="e.g. Sarah Chen"
                />
              </div>
              <div className="form-field form-field-full">
                <label>Description</label>
                <textarea
                  className="fleet-control"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-field form-field-full">
                <label>Notes</label>
                <textarea
                  className="fleet-control"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                className="ui-button button-ghost"
                onClick={() => {
                  setEditMode(false);
                  setSaveError(null);
                }}
              >
                <X size={14} strokeWidth={1.6} /> Cancel
              </button>
              <button
                className="ui-button button-primary"
                onClick={handleSave}
              >
                <Save size={14} strokeWidth={1.6} /> Save changes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="work-orders-note">
        <span>
          Editing, assignments, and schedules are simulated. No notifications or
          technician assignments are actually delivered.
        </span>
      </div>
    </div>
  );
}
