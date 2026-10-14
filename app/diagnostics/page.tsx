import { DiagnosticsView } from "../components/diagnostics/diagnostics-view";
import { DEMO_ASSETS } from "../../lib/demo-data";

export const metadata = {
  title: "Diagnostics",
};

export default function DiagnosticsPage() {
  return <DiagnosticsView assets={DEMO_ASSETS} />;
}
