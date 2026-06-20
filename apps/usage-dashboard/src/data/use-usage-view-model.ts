import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UsageAggregationService,
  fetchAllSnapshots,
  type UsageViewModel,
} from "@lucaszanoni-web/snapshot-data";
import {
  LIVE_REFRESH_INTERVAL_MILLISECONDS,
  USAGE_SNAPSHOT_SOURCE,
} from "./usage-snapshot-source";

const usageAggregationService = new UsageAggregationService();

export interface UsageDashboardState {
  viewModel: UsageViewModel | null;
  errorMessage: string | null;
  isLoading: boolean;
  lastUpdatedLabel: string | null;
}

export function useUsageViewModel(): UsageDashboardState {
  const usageSnapshotsQuery = useQuery({
    queryKey: ["usage-snapshots", USAGE_SNAPSHOT_SOURCE.snapshotsBucket],
    queryFn: () => fetchAllSnapshots(USAGE_SNAPSHOT_SOURCE),
    refetchInterval: LIVE_REFRESH_INTERVAL_MILLISECONDS,
  });

  const viewModel = useMemo<UsageViewModel | null>(() => {
    if (!usageSnapshotsQuery.data) {
      return null;
    }
    return usageAggregationService.buildUsageViewModel(
      usageSnapshotsQuery.data,
    );
  }, [usageSnapshotsQuery.data]);

  const lastUpdatedLabel = usageSnapshotsQuery.dataUpdatedAt
    ? new Date(usageSnapshotsQuery.dataUpdatedAt).toLocaleTimeString("en-US")
    : null;

  return {
    viewModel,
    errorMessage:
      usageSnapshotsQuery.error instanceof Error
        ? usageSnapshotsQuery.error.message
        : usageSnapshotsQuery.error
          ? "failed to load usage snapshots"
          : null,
    isLoading: usageSnapshotsQuery.isLoading,
    lastUpdatedLabel,
  };
}
