import { describe, expect, it } from "vitest";
import {
  buildAuthorizedArtifactPut,
  createHandlerUnderTest,
} from "./ingest-handler-test-harness";
import { createFailingArtifactObjectWriter } from "./ingest-test-doubles";

const rawSnapshot = JSON.stringify({
  schema_version: 1,
  account_label: "acct",
  machine_label: "host",
  model_usage_totals: {},
  daily_model_tokens: [],
  extra: "kept",
});

describe("handling an artifact write", () => {
  it("returns a receipt and hands the original bytes to the writer", async () => {
    const { handleIngestRequest, artifactObjectWriter } =
      createHandlerUnderTest();
    const request = buildAuthorizedArtifactPut(
      "snapshots/acct-host.json",
      rawSnapshot,
    );
    const response = await handleIngestRequest(request);
    expect(response).toStrictEqual({
      statusCode: 202,
      body: {
        objectKey: "snapshots/acct-host.json",
        objectKind: "raw-snapshot",
        contentType: "application/json",
        byteLength: request.body.byteLength,
      },
    });
    expect(artifactObjectWriter.writes).toStrictEqual([
      {
        objectKey: "snapshots/acct-host.json",
        objectKind: "raw-snapshot",
        contentType: "application/json",
        bytes: request.body,
      },
    ]);
  });

  it("gives no receipt when storage fails", async () => {
    const { handleIngestRequest } = createHandlerUnderTest({
      artifactObjectWriter:
        createFailingArtifactObjectWriter("quota exhausted"),
    });
    const response = await handleIngestRequest(
      buildAuthorizedArtifactPut("reports/a.json", "{}"),
    );
    expect(response.statusCode).toBe(502);
    expect(response.body).not.toHaveProperty("byteLength");
  });

  it("writes nothing when the key, content type or raw content is refused", async () => {
    const { handleIngestRequest, artifactObjectWriter } =
      createHandlerUnderTest();
    const refusals = await Promise.all([
      handleIngestRequest(buildAuthorizedArtifactPut("reports/../x", "{}")),
      handleIngestRequest(
        buildAuthorizedArtifactPut("reports/a.json", "{}", null),
      ),
      handleIngestRequest(
        buildAuthorizedArtifactPut("snapshots/acct-host.json", "[]"),
      ),
      handleIngestRequest(
        buildAuthorizedArtifactPut("snapshots/acct-other.json", rawSnapshot),
      ),
    ]);
    expect(refusals.map((response) => response.statusCode)).toStrictEqual([
      400, 400, 400, 400,
    ]);
    expect(artifactObjectWriter.writes).toHaveLength(0);
  });

  it("uses the same authorization rule as topic writes", async () => {
    const { handleIngestRequest, artifactObjectWriter } =
      createHandlerUnderTest();
    const request = buildAuthorizedArtifactPut("reports/a.json", "{}");
    const wrong = await handleIngestRequest({
      ...request,
      presentedProducerSecret: "nope",
    });
    const missing = await handleIngestRequest({
      ...request,
      presentedProducerSecret: undefined,
    });
    const { handleIngestRequest: unconfigured } = createHandlerUnderTest({
      configuredProducerSecret: undefined,
    });
    const unconfiguredResponse = await unconfigured(request);
    expect([
      wrong.statusCode,
      missing.statusCode,
      unconfiguredResponse.statusCode,
    ]).toStrictEqual([401, 401, 503]);
    expect(artifactObjectWriter.writes).toHaveLength(0);
  });
});
