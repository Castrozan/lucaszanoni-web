import {
  createUsageSnapshotSource,
  useUsageViewModel,
} from "@platform/usage-insights";
import { UsageDashboardPage } from "./UsageDashboardPage";

const USAGE_DASHBOARD_SNAPSHOT_SOURCE =
  createUsageSnapshotSource("usage-dashboard");

export function UsageDashboardContainer() {
  const usageDashboardState = useUsageViewModel(
    USAGE_DASHBOARD_SNAPSHOT_SOURCE,
  );
  return <UsageDashboardPage {...usageDashboardState} />;
}
