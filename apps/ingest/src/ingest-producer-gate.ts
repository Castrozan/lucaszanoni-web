import { presentedProducerSecretMatches } from "./ingest-producer-authorization";
import { refuse, type IngestResponse } from "./ingest-response";

export function refuseUnauthorizedProducer(
  configuredProducerSecret: string | undefined,
  presentedProducerSecret: string | undefined,
): IngestResponse | undefined {
  if (
    configuredProducerSecret === undefined ||
    configuredProducerSecret === ""
  ) {
    return refuse(
      503,
      "ingest is not accepting writes because no producer secret is configured",
    );
  }
  if (
    !presentedProducerSecretMatches(
      presentedProducerSecret,
      configuredProducerSecret,
    )
  ) {
    return refuse(401, "the presented producer secret is not accepted");
  }
  return undefined;
}
