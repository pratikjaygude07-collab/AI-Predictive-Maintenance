"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  MapPin,
  Plus,
} from "lucide-react";
import { dataService, type CreateWorkOrderInput, type WorkOrderPriority, type WorkOrderStatus } from "@/lib/data-service";
import type { MachineAsset } from "@/lib/mock-data";

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type FormValues = {
  machineId: string;
  title: string;
  description: string;
  notes: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: string;
  technician: string;
};

export default function CreateWorkOrderPage() {
  const [machines] = useState<MachineAsset[]>(() => dataService.getMachines());
  const [form, setForm] = useState<FormValues>({
    machineId: "",
    title: "",
    description: "",
    notes: "",
    status: "open",
    priority: "medium",
    scheduledDate: "",
    technician: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleChange = useCallback(
    (key: keyof FormValues, value: string) => {
      setSaveError(null);
      setErrors([]);
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const validate = useCallback((): boolean => {
    const nextErrors: string[] = [];
    if (!form.machineId || !machines.some((m) => m.id === form.machineId)) {
      nextErrors.push("A valid machine must be selected.");
    }
    if (!form.title || !form.title.trim()) {
      nextErrors.push("Title is required.");
    }
    if (
      !form.scheduledDate ||
      isNaN(new Date(form.scheduledDate).getTime())
    ) {
      nextErrors.push("A valid scheduled date is required.");
    }
    if (!["low", "medium", "high", "critical"].includes(form.priority)) {
      nextErrors.push("Priority must be Low, Medium, High, or Critical.");
    }
    if (!["open", "in-progress", "completed", "cancelled"].includes(form.status)) {
      nextErrors.push("Status must be Open, In Progress, Completed, or Cancelled.");
    }
    setErrors(nextErrors);
    return nextErrors.length === 0;
  }, [form, machines]);

  const handleSave = useCallback(() => {
    setSaveError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: CreateWorkOrderInput = {
        machineId: form.machineId,
        title: form.title.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        status: form.status,
        priority: form.priority,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        technician: form.technician.trim(),
      };
      const created = dataService.createWorkOrder(input);
      setCreatedId(created.id);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to create work order.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [form, validate]);

  if (createdId) {
    return (
      <div className="work-orders-page">
        <div className="page-heading">
          <div className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true" />
            MAINTENANCE
          </div>
          <h1>Work order created</h1>
          <p>
            Work order <strong>{createdId}</strong> has been created. All data
            is simulated until a live maintenance backend is connected.
          </p>
        </div>
        <div className="ui-card" style={{ padding: "24px", marginTop: "24px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href={`/work-orders/${createdId}`}
              className="ui-button button-primary"
            >
              <MapPin size={14} strokeWidth={1.6} /> View work order
            </Link>
            <Link href="/work-orders" className="ui-button button-ghost">
              <ChevronLeft size={14} strokeWidth={1.6} /> Back to work orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusOptions: WorkOrderStatus[] = [
    "open",
    "in-progress",
    "completed",
    "cancelled",
  ];
  const priorityOptions: WorkOrderPriority[] = ["low", "medium", "high", "critical"];

  return (
    <div className="work-orders-page">
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          MAINTENANCE
        </div>
        <h1>Create work order</h1>
        <p>
          Create a new simulated maintenance work order linked to a registered
          machine. No notifications or technician assignments are actually
          delivered.
        </p>
      </div>

      <div className="ui-card" style={{ marginTop: "24px" }}>
        <div className="section-heading">
          <h2>Work order details</h2>
        </div>
        {errors.length > 0 && (
          <div className="validation-error" role="alert">
            <AlertTriangle size={14} strokeWidth={1.6} />
            <span>{errors.join(" ")}</span>
          </div>
        )}
        {saveError && (
          <div className="validation-error" role="alert">
            <AlertTriangle size={14} strokeWidth={1.6} />
            <span>{saveError}</span>
          </div>
        )}
        <div className="form-grid">
          <div className="form-field">
            <label>Machine <span className="required">*</span></label>
            <select
              className="fleet-control fleet-select"
              value={form.machineId}
              onChange={(e) => handleChange("machineId", e.target.value)}
            >
              <option value="">Select a machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} · {m.name}
                </option>
              ))}
            </select>
            <div className="form-hint">
              {machines.find((m) => m.id === form.machineId) ? (
                <>
                  <MapPin size={12} strokeWidth={1.6} />
                  <span>
                    {machines.find((m) => m.id === form.machineId)?.healthScore}
                    health ·{" "}
                    {machines.find((m) => m.id === form.machineId)?.status}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="form-field">
            <label>Title <span className="required">*</span></label>
            <input
              className="fleet-control"
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Bearing inspection and replacement"
              required
            />
          </div>
          <div className="form-field">
            <label>Status <span className="required">*</span></label>
            <select
              className="fleet-control fleet-select"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value as WorkOrderStatus)}
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
          <Link href="/work-orders" className="ui-button button-ghost">
            <ChevronLeft size={14} strokeWidth={1.6} /> Cancel
          </Link>
          <button
            className="ui-button button-primary"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Creating..." : <><Plus size={14} strokeWidth={1.6} /> Create work order</>}
          </button>
        </div>
      </div>
    </div>
  );
}
