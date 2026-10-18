"use client";

import Link from "next/link";
import { use } from "react";
import { dataAccess } from "@/lib/mock-data";
import { DigitalTwinView } from "../../components/digital-twin/digital-twin-view";
import { Badge } from "../../components/ui/primitives";

export default function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const machine = dataAccess.getMachineById(id);
  const notFound = !machine;

  if (notFound) {
    return (
      <div className="main-content">
        <div className="page-heading">
          <div className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true" />
            MACHINE DETAIL
          </div>
          <h1>Machine not found</h1>
          <p>
            No registered machine matches the ID {id}. All data is simulated
            until a live equipment backend is connected.
          </p>
        </div>
        <div className="ui-card" style={{ padding: "24px", marginTop: "24px" }}>
          <p>
            <Link href="/fleet" className="ui-button button-secondary">
              Return to fleet register
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!machine) {
    return null;
  }

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">
          <span className="eyebrow-mark" aria-hidden="true" />
          MACHINE DETAIL
          <Badge tone="cyan">SIMULATED</Badge>
        </div>
        <h1>{machine.name}</h1>
        <p>
          Machine {machine.id} · {machine.type} · {machine.location}. All
          telemetry and sensor readings are simulated until a live backend is
          connected.
        </p>
        <div className="machine-actions">
          <Link
            href={`/work-orders/create`}
            className="ui-button button-secondary"
          >
            Create work order for {machine.id}
          </Link>
        </div>
      </div>

      <DigitalTwinView machineId={machine.id} />
    </>
  );
}
