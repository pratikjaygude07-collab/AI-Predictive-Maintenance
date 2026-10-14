import { DigitalTwinView } from "../components/digital-twin/digital-twin-view";
import { DEMO_ASSETS } from "../../lib/demo-data";

export const metadata = {
  title: "Digital Twin",
};

export default function MachinePage() {
  return <DigitalTwinView assets={DEMO_ASSETS} />;
}
