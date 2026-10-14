import { FleetView } from "../components/fleet/fleet-view";
import { DEMO_ASSETS } from "../../lib/demo-data";

export const metadata = {
  title: "Fleet",
};

export default function FleetPage() {
  return <FleetView assets={DEMO_ASSETS} />;
}
