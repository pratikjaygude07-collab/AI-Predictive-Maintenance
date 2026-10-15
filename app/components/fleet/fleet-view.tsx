"use client";

import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  ChevronDown,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  Thermometer,
  Vibrate,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  filterFleetAssets,
  getRequestedAssetId,
  sortAssets,
  type AssetSortKey,
  type DemoAsset,
  type MachineTypeFilter,
  type OperatingStateFilter,
  type StatusFilter,
} from "../../../lib/demo-data";
import { Badge, Button } from "../ui/primitives";

type FleetViewMode = "grid" | "list";

const CONDITION_TONES = {
  operational: "green",
  review: "amber",
  service: "red",
} as const;

const CONDITION_LABELS = {
  operational: "Operational",
  review: "Review",
  service: "Service",
} as const;

const SORT_OPTIONS: { value: AssetSortKey; label: string }[] = [
  { value: "priority", label: "Condition priority" },
  { value: "name", label: "Equipment name" },
  { value: "type", label: "Machine type" },
  { value: "temperature", label: "Temperature" },
  { value: "vibration", label: "Vibration" },
  { value: "load", label: "Operating load" },
  { value: "service", label: "Next service" },
];

function isMachineTypeFilter(value: string): value is MachineTypeFilter {
  return value === "all" || value === "motor" || value === "bearing";
}

function isStatusFilter(value: string): value is StatusFilter {
  return (
    value === "all" ||
    value === "operational" ||
    value === "review" ||
    value === "service"
  );
}

function isOperatingStateFilter(
  value: string,
): value is OperatingStateFilter {
  return value === "all" || value === "running" || value === "standby";
}

function isAssetSortKey(value: string): value is AssetSortKey {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function ConditionBadge({ asset }: { asset: DemoAsset }) {
  return (
    <Badge tone={CONDITION_TONES[asset.status]}>
      {CONDITION_LABELS[asset.status]}
    </Badge>
  );
}

function OperatingStateBadge({ asset }: { asset: DemoAsset }) {
  return (
    <span
      className={`operating-state state-${asset.operatingState}`}
      aria-label={`Simulated operating state: ${asset.operatingState}`}
    >
      <span aria-hidden="true" />
      {asset.operatingState === "running" ? "Running" : "Standby"}
    </span>
  );
}

function AssetReadings({ asset }: { asset: DemoAsset }) {
  return (
    <div className="fleet-readings" aria-label="Simulated operating readings">
      <div className="fleet-reading">
        <span className="fleet-reading-label">
          <Thermometer size={13} aria-hidden="true" />
          Temperature
        </span>
        <strong>{asset.temperatureC.toFixed(1)} <small>°C</small></strong>
      </div>
      <div className="fleet-reading">
        <span className="fleet-reading-label">
          <Vibrate size={13} aria-hidden="true" />
          Vibration RMS
        </span>
        <strong>{asset.vibrationMmS.toFixed(1)} <small>mm/s</small></strong>
      </div>
      <div className="fleet-reading">
        <span className="fleet-reading-label">Speed</span>
        <strong>{asset.speedRpm.toLocaleString()} <small>rpm</small></strong>
      </div>
    </div>
  );
}

function AssetDetail({
  asset,
  id,
}: {
  asset: DemoAsset;
  id: string;
}) {
  return (
    <div className="fleet-asset-detail" id={id}>
      <div className="fleet-detail-grid">
        <div>
          <span>Equipment type</span>
          <strong>{asset.type}</strong>
        </div>
        <div>
          <span>Site location</span>
          <strong>{asset.location}</strong>
        </div>
        <div>
          <span>Simulated load</span>
          <strong>{asset.loadPercent}%</strong>
        </div>
        <div>
          <span>Next scheduled service</span>
          <strong>{asset.nextService}</strong>
        </div>
      </div>
      <Link
        className="fleet-dashboard-link"
        href={`/dashboard?assetId=${encodeURIComponent(asset.id)}`}
      >
        Review on dashboard
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function FleetView({ assets }: { assets: readonly DemoAsset[] }) {
  const [query, setQuery] = useState("");
  const [machineType, setMachineType] = useState<MachineTypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [operatingState, setOperatingState] =
    useState<OperatingStateFilter>("all");
  const [sortBy, setSortBy] = useState<AssetSortKey>("priority");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<FleetViewMode>("grid");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const assetId = getRequestedAssetId(
      assets,
      new URLSearchParams(window.location.search).get("assetId"),
    );
    if (!assetId) return;

    const timeout = window.setTimeout(() => {
      setSelectedAssetId(assetId);
      setQuery(assetId);
      document
        .getElementById(`fleet-asset-${assetId}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [assets]);

  const filteredAssets = useMemo(
    () =>
      sortAssets(
        filterFleetAssets(assets, {
          query,
          machineType,
          status,
          operatingState,
        }),
        sortBy,
        direction,
      ),
    [assets, direction, machineType, operatingState, query, sortBy, status],
  );

  const hasFilters =
    query.length > 0 ||
    machineType !== "all" ||
    status !== "all" ||
    operatingState !== "all";

  function clearFilters() {
    setQuery("");
    setMachineType("all");
    setStatus("all");
    setOperatingState("all");
  }

  function toggleAsset(assetId: string) {
    setSelectedAssetId((selected) => (selected === assetId ? null : assetId));
  }

  return (
    <>
      <div className="page-heading fleet-page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          PLANT 01 <span className="heading-divider">/</span> EQUIPMENT REGISTER
          <Badge className="heading-data-badge" tone="cyan">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </Badge>
        </div>
        <h1>Fleet management</h1>
        <p>
          Explore the demonstration inventory, compare simulated operating
          readings, and narrow equipment by condition or operating state.
        </p>
        <div className="fleet-summary-row">
          <span>
            <strong>{assets.length}</strong> demo assets
          </span>
          <span className="fleet-summary-divider" aria-hidden="true" />
          <span>
            <strong>
              {assets.filter((asset) => asset.operatingState === "running").length}
            </strong>{" "}
            simulated running
          </span>
          <span className="fleet-summary-divider" aria-hidden="true" />
          <span>
            <strong>{assets.filter((asset) => asset.machineType === "motor").length}</strong>{" "}
            motors
          </span>
        </div>
      </div>

      <section
        aria-label="Equipment inventory controls"
        className="ui-card fleet-toolbar"
      >
        <div className="fleet-toolbar-main">
          <label className="sr-only" htmlFor="fleet-search">
            Search equipment by name, ID, location, or type
          </label>
          <span className="fleet-search-wrap">
            <Search size={15} aria-hidden="true" />
            <input
              autoComplete="off"
              className="fleet-control fleet-search"
              id="fleet-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, ID, location..."
              type="search"
              value={query}
            />
          </span>
          <label className="sr-only" htmlFor="fleet-machine-type">
            Filter by machine type
          </label>
          <span className="fleet-select-wrap">
            <select
              className="fleet-control fleet-select"
              id="fleet-machine-type"
              onChange={(event) => {
                if (isMachineTypeFilter(event.target.value)) {
                  setMachineType(event.target.value);
                }
              }}
              value={machineType}
            >
              <option value="all">All machine types</option>
              <option value="motor">Electric motors</option>
              <option value="bearing">Bearing assemblies</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </span>
          <label className="sr-only" htmlFor="fleet-condition">
            Filter by equipment condition
          </label>
          <span className="fleet-select-wrap">
            <select
              className="fleet-control fleet-select"
              id="fleet-condition"
              onChange={(event) => {
                if (isStatusFilter(event.target.value)) {
                  setStatus(event.target.value);
                }
              }}
              value={status}
            >
              <option value="all">All conditions</option>
              <option value="operational">Operational</option>
              <option value="review">Review</option>
              <option value="service">Service</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </span>
          <label className="sr-only" htmlFor="fleet-operating-state">
            Filter by operating status
          </label>
          <span className="fleet-select-wrap">
            <select
              className="fleet-control fleet-select"
              id="fleet-operating-state"
              onChange={(event) => {
                if (isOperatingStateFilter(event.target.value)) {
                  setOperatingState(event.target.value);
                }
              }}
              value={operatingState}
            >
              <option value="all">All operating states</option>
              <option value="running">Running</option>
              <option value="standby">Standby</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </span>
          {hasFilters && (
            <Button
              className="fleet-clear-button"
              onClick={clearFilters}
              variant="ghost"
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="fleet-toolbar-secondary">
          <div className="fleet-sort-control">
            <SlidersHorizontal size={14} aria-hidden="true" />
            <label className="sr-only" htmlFor="fleet-sort">
              Sort equipment
            </label>
            <span className="fleet-select-wrap">
              <select
                className="fleet-control fleet-sort-select"
                id="fleet-sort"
                onChange={(event) => {
                  if (isAssetSortKey(event.target.value)) {
                    setSortBy(event.target.value);
                  }
                }}
                value={sortBy}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </span>
            <button
              aria-label={`Sort ${direction === "asc" ? "ascending" : "descending"}; activate to reverse`}
              className="fleet-sort-direction"
              onClick={() =>
                setDirection((current) =>
                  current === "asc" ? "desc" : "asc",
                )
              }
              title={`Currently sorting ${direction === "asc" ? "ascending" : "descending"}`}
              type="button"
            >
              {sortBy === "temperature" ||
              sortBy === "vibration" ||
              sortBy === "load" ? (
                direction === "asc" ? (
                  <ArrowUpWideNarrow size={15} aria-hidden="true" />
                ) : (
                  <ArrowDownWideNarrow size={15} aria-hidden="true" />
                )
              ) : direction === "asc" ? (
                <ArrowDownAZ size={15} aria-hidden="true" />
              ) : (
                <ArrowUpAZ size={15} aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="fleet-view-toggle" role="group" aria-label="Inventory view">
            <button
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
              className={`fleet-view-button${viewMode === "grid" ? " is-active" : ""}`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <Grid2X2 size={15} aria-hidden="true" />
            </button>
            <button
              aria-pressed={viewMode === "list"}
              aria-label="List view"
              className={`fleet-view-button${viewMode === "list" ? " is-active" : ""}`}
              onClick={() => setViewMode("list")}
              type="button"
            >
              <List size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <div className="fleet-results-heading" aria-live="polite">
        <div>
          <h2>Equipment inventory</h2>
          <span>
            Showing {filteredAssets.length} of {assets.length} simulated assets
          </span>
        </div>
        <span className="fleet-results-note">
          <span className="simulated-dot" aria-hidden="true" />
          Readings are illustrative, not live telemetry
        </span>
      </div>

      {filteredAssets.length > 0 ? (
        <div
          className={`fleet-inventory fleet-${viewMode}`}
          aria-label={`${viewMode === "grid" ? "Grid" : "List"} of equipment assets`}
        >
          {filteredAssets.map((asset) => {
            const selected = selectedAssetId === asset.id;
            const detailId = `fleet-asset-detail-${asset.id}`;

            return (
              <article
                className={`ui-card fleet-asset-card${selected ? " is-selected" : ""}`}
                id={`fleet-asset-${asset.id}`}
                key={asset.id}
              >
                <div className="fleet-asset-card-top">
                  <span className="fleet-asset-symbol" aria-hidden="true">
                    {asset.machineType === "bearing" ? "BR" : "MT"}
                  </span>
                  <code>{asset.id}</code>
                  <span className="fleet-machine-type">
                    {asset.machineType === "bearing" ? "BEARING" : "MOTOR"}
                  </span>
                  <ConditionBadge asset={asset} />
                </div>

                <button
                  aria-controls={detailId}
                  aria-expanded={selected}
                  className="fleet-asset-title"
                  onClick={() => toggleAsset(asset.id)}
                  type="button"
                >
                  <span>{asset.name}</span>
                  <ChevronDown
                    className="fleet-expand-icon"
                    size={16}
                    aria-hidden="true"
                  />
                </button>
                <div className="fleet-asset-type-line">
                  <span>{asset.type}</span>
                  <span className="fleet-type-dot" aria-hidden="true" />
                  <span>{asset.location}</span>
                </div>

                <div className="fleet-asset-state">
                  <OperatingStateBadge asset={asset} />
                  <span className="fleet-data-indicator">
                    <span className="simulated-dot" aria-hidden="true" />
                    SIMULATED READINGS
                  </span>
                </div>

                <AssetReadings asset={asset} />

                {selected && <AssetDetail asset={asset} id={detailId} />}
              </article>
            );
          })}
        </div>
      ) : (
        <section className="ui-card fleet-empty-state" role="status">
          <span className="fleet-empty-icon" aria-hidden="true">
            <Search size={20} />
          </span>
          <h3>No equipment matches your filters</h3>
          <p>
            Try a different asset name, ID, machine type, condition, or
            operating status.
          </p>
          <Button onClick={clearFilters} variant="secondary">
            Clear filters
          </Button>
        </section>
      )}

      <div className="fleet-footer-note" role="note">
        <span className="simulated-dot" aria-hidden="true" />
        Condition groupings are based on fixed demonstration thresholds.
        MainAI does not provide AI failure forecasts or fault diagnoses.
      </div>
    </>
  );
}
