import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UsageAggregationService,
  fetchAllSnapshots,
  type UsageViewModel,
  type SnapshotSourceConfiguration,
} from "@platform/snapshot-data";
import { LIVE_REFRESH_INTERVAL_MILLISECONDS } from "./usage-snapshot-source";

const usageAggregationService = new UsageAggregationService();

export interface UsageDashboardState {
  viewModel: UsageViewModel | null;
  errorMessage: string | null;
  isLoading: boolean;
  lastUpdatedLabel: string | null;
}

export function useUsageViewModel(
  source: SnapshotSourceConfiguration,
): UsageDashboardState {
  const usageSnapshotsQuery = useQuery({
    queryKey: ["usage-snapshots", source.snapshotUrl],
    queryFn: () => fetchAllSnapshots(source),
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
