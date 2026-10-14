import { DashboardView } from "../components/dashboard/dashboard-view";
import { getDemoSnapshot } from "../../lib/demo-data";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardView snapshot={getDemoSnapshot()} />;
}
