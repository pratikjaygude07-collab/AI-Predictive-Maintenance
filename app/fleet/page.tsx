"use client";

import {
  ChevronDown,
  Filter,
  List,
  Search,
  SlidersHorizontal,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import type { MachineAsset } from "@/lib/mock-data";

type StatusFilter = "all" | "active" | "idle" | "maintenance" | "offline";
type SortField = "name" | "healthScore" | "uptimePercentage" | "lastSeen";
type SortDirection = "asc" | "desc";

type FleetMachineCardProps = {
  machine: MachineAsset;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  expandedId: string | null;
  onOpenDiagnostics: () => void;
};

function FleetMachineCard({
  machine,
  isSelected,
  onSelect,
  onExpand,
  expandedId,
  onOpenDiagnostics,
}: FleetMachineCardProps) {
  const expanded = expandedId === machine.id;
  const statusDot =
    machine.status === "active"
      ? "state-running"
      : machine.status === "idle"
        ? "state-standby"
        : "state-standby";

  return (
    <div
      className={`fleet-asset-card ui-card${isSelected ? " is-selected" : ""}${expanded ? " is-selected" : ""}`}
      onClick={() => onSelect(machine.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(machine.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="fleet-asset-card-top">
        <div className="fleet-asset-symbol">
          {machine.id.split("-")[1]?.[0] ?? "M"}
        </div>
        <code>{machine.id}</code>
        <span className="fleet-machine-type">{machine.type}</span>
      </div>
      <button
        className="fleet-asset-title"
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation();
          onExpand(machine.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            onExpand(machine.id);
          }
        }}
        type="button"
      >
        <span>{machine.name}</span>
        <ChevronDown className="fleet-expand-icon" size={12} />
      </button>
      <div className="fleet-asset-type-line">
        <span>{machine.location}</span>
        <span className="fleet-type-dot" aria-hidden="true" />
        <span>{machine.status.toUpperCase()}</span>
      </div>
      <div className="fleet-asset-state">
        <div className="operating-state">
          <span className={`${statusDot.split(" ")[0]}`} />
          <span>{machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}</span>
        </div>
        <span className="fleet-data-indicator">SIMULATED</span>
      </div>
      <div className="fleet-readings">
        <div className="fleet-reading">
          <span className="fleet-reading-label">
            <Timer size={10} strokeWidth={1.4} />
            UPTIME
          </span>
          <strong>{machine.uptimePercentage.toFixed(1)}<small>%</small></strong>
        </div>
        <div className="fleet-reading">
          <span className="fleet-reading-label">
            <TrendingUp size={10} strokeWidth={1.4} />
            HEALTH
          </span>
          <strong>{machine.healthScore}</strong>
        </div>
        <div className="fleet-reading">
          <span className="fleet-reading-label">
            <Filter size={10} strokeWidth={1.4} />
            LAST SEEN
          </span>
          <strong>
            {new Date(machine.lastSeen).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
        </div>
      </div>
      {expanded && (
        <div className="fleet-asset-detail">
          <div className="fleet-detail-grid">
            <div>
              <span>TYPE</span>
              <strong>{machine.type}</strong>
            </div>
            <div>
              <span>LOCATION</span>
              <strong>{machine.location}</strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong>{machine.status.toUpperCase()}</strong>
            </div>
            <div>
              <span>HEALTH SCORE</span>
              <strong>{machine.healthScore}</strong>
            </div>
            <div>
              <span>UPTIME</span>
              <strong>{machine.uptimePercentage.toFixed(1)}%</strong>
            </div>
            <div>
              <span>COORDINATES</span>
              <strong>
                {machine.latitude.toFixed(4)}, {machine.longitude.toFixed(4)}
              </strong>
            </div>
          </div>
          <button className="fleet-dashboard-link" onClick={(e) => { e.stopPropagation(); onOpenDiagnostics(); }}>
            <SlidersHorizontal size={12} strokeWidth={1.6} />
            Open diagnostics
          </button>
        </div>
      )}
    </div>
  );
}


export default function FleetPage() {
  const [machines, setMachines] = useState<MachineAsset[]>(() =>
    dataService.getMachines(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("healthScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const machineTypes = useMemo(
    () => [...new Set(machines.map((m) => m.type))],
    [machines],
  );

  const filteredMachines = useMemo(() => {
    return machines
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || m.status === statusFilter;
        const matchesType = typeFilter === "all" || m.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const aVal = a[sortField as keyof MachineAsset];
        const bVal = b[sortField as keyof MachineAsset];
        const aStr = typeof aVal === "string" ? String(aVal).toLowerCase() : String(aVal ?? "");
        const bStr = typeof bVal === "string" ? String(bVal).toLowerCase() : String(bVal ?? "");
        if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
        if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [machines, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  const statusCounts = machines.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      <div className="fleet-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          EQUIPMENT REGISTER
        </div>
        <h1>Fleet management</h1>
        <p>
          Browse, search, and filter registered machines. All data is
          simulated until a live equipment backend is connected.
        </p>
      </div>

      <div className="fleet-summary-row">
        <strong>{machines.length}</strong>
        <span className="fleet-summary-divider" aria-hidden="true" />
        <strong>{statusCounts.active ?? 0}</strong>
        <span>ACTIVE</span>
        <span className="fleet-summary-divider" aria-hidden="true" />
        <strong>{statusCounts.maintenance ?? 0}</strong>
        <span>MAINTENANCE</span>
        <span className="fleet-summary-divider" aria-hidden="true" />
        <strong>{statusCounts.offline ?? 0}</strong>
        <span>OFFLINE</span>
      </div>

      <div className="fleet-toolbar">
        <div className="fleet-toolbar-main">
          <div className="fleet-search-wrap">
            <Search size={12} strokeWidth={1.6} />
            <input
              className="fleet-control fleet-search"
              type="search"
              placeholder="Search machines by name, ID, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="fleet-select-wrap">
            <select
              className="fleet-control fleet-select"
              id="fleet-operating-state"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="fleet-select-wrap">
            <select
              className="fleet-control fleet-select"
              id="fleet-machine-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {machineTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button className="fleet-clear-button ui-button button-ghost" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setTypeFilter("all");
          }}>
            Clear filters
          </button>
        </div>
        <div className="fleet-toolbar-secondary">
          <div className="fleet-sort-control">
            <span>Sort by</span>
            <select
              className="fleet-control fleet-sort-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <option value="healthScore">Health score</option>
              <option value="name">Machine name</option>
              <option value="uptimePercentage">Uptime</option>
              <option value="lastSeen">Last seen</option>
            </select>
            <button
              className="fleet-sort-direction"
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              title="Toggle sort direction"
              type="button"
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="fleet-view-toggle">
            <button
              className={`fleet-view-button${viewMode === "grid" ? " is-active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
              type="button"
            >
              <SlidersHorizontal size={12} strokeWidth={1.6} />
            </button>
            <button
              className={`fleet-view-button${viewMode === "list" ? " is-active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
              type="button"
            >
              <List size={12} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>

      <div className="fleet-results-heading">
        <div>
          <h2>{filteredMachines.length} machines</h2>
          <div>
            <span>Showing {filteredMachines.length} of {machines.length} registered assets</span>
          </div>
        </div>
        <div className="fleet-results-note">
          <span>All values simulated</span>
        </div>
      </div>

      <div className={`fleet-inventory ${viewMode === "grid" ? "fleet-grid" : "fleet-list"}`}>
        {filteredMachines.length === 0 ? (
          <div className="fleet-empty-state ui-card">
            <div className="fleet-empty-icon">
              <Search size={24} strokeWidth={1.8} />
            </div>
            <h3>No machines found</h3>
            <p>
              Try adjusting your search or filter criteria to view available
              equipment.
            </p>
            <button className="ui-button button-secondary" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}>
              Reset filters
            </button>
          </div>
        ) : (
          filteredMachines.map((machine) => (
            <FleetMachineCard
              key={machine.id}
              machine={machine}
              isSelected={selectedId === machine.id}
              expandedId={expandedId}
              onSelect={(id) => {
                setSelectedId(id);
                router.push(`/machine/${id}`);
              }}
              onExpand={setExpandedId}
              onOpenDiagnostics={() => router.push("/diagnostics")}
            />
          ))
        )}
      </div>

      <div className="fleet-footer-note">
        <span>
          Machine listing, search, filters, and sorting are fully functional
          using centralized mock data.
        </span>
      </div>
    </>
  );
}
