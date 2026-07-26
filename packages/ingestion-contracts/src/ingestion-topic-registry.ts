import {
  IngestionContractViolationError,
  type IngestionTopicContract,
} from "./ingestion-types";
import { claudeUsageContract } from "./topics/claude-usage/claude-usage-contract";
import { testBaselineContract } from "./topics/test-baseline/test-baseline-contract";
import { testCoverageContract } from "./topics/test-coverage/test-coverage-contract";
import { testQualityContract } from "./topics/test-quality/test-quality-contract";

export const INGESTION_TOPIC_CONTRACTS: readonly IngestionTopicContract<unknown>[] =
  [
    claudeUsageContract,
    testBaselineContract,
    testCoverageContract,
    testQualityContract,
  ];

export function findIngestionTopicContract(
  topic: string,
): IngestionTopicContract<unknown> | undefined {
  return INGESTION_TOPIC_CONTRACTS.find((contract) => contract.topic === topic);
}

export function requireIngestionTopicContract(
  topic: string,
): IngestionTopicContract<unknown> {
  const contract = findIngestionTopicContract(topic);
  if (contract === undefined) {
    throw new IngestionContractViolationError(
      `topic ${topic} is not registered so nothing may be ingested under it`,
    );
  }
  return contract;
}
