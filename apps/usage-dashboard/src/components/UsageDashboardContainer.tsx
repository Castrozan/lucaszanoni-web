import { useUsageViewModel } from "../data/use-usage-view-model";
import { UsageDashboardPage } from "./UsageDashboardPage";

export function UsageDashboardContainer() {
  const usageDashboardState = useUsageViewModel();
  return <UsageDashboardPage {...usageDashboardState} />;
}
