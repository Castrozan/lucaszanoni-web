import { timingSafeEqual } from "node:crypto";

export const PRODUCER_SECRET_HEADER_NAME = "x-ingest-producer-secret";

export function presentedProducerSecretMatches(
  presentedSecret: string | undefined,
  configuredSecret: string | undefined,
): boolean {
  if (
    configuredSecret === undefined ||
    configuredSecret === "" ||
    presentedSecret === undefined
  ) {
    return false;
  }

  const presentedBytes = Buffer.from(presentedSecret, "utf8");
  const configuredBytes = Buffer.from(configuredSecret, "utf8");
  if (presentedBytes.length !== configuredBytes.length) {
    return false;
  }

  return timingSafeEqual(presentedBytes, configuredBytes);
}
