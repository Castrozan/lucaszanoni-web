import { useUsageViewModel } from "@platform/usage-insights";
import { UsageDashboardPage } from "./UsageDashboardPage";

export function UsageDashboardContainer() {
  const usageDashboardState = useUsageViewModel();
  return <UsageDashboardPage {...usageDashboardState} />;
}
