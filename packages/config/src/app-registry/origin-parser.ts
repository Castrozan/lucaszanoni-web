import type { AppOrigin } from "./types.ts";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireBareHostname,
  requireBoolean,
  requireForwardedBasePath,
  requireOneOf,
  requireString,
  requireStringAllowEmpty,
  requireStringMap,
} from "./field-parsers.ts";

export function parseOrigin(value: unknown, context: string): AppOrigin {
  const record = asObjectRecord(value, `${context} origin`);
  const kind = requireOneOf(
    record,
    "kind",
    [
      "cloud-run",
      "cloudflare-worker",
      "external-https",
      "static-gcs-bucket",
    ] as const,
    `${context} origin`,
  );
  switch (kind) {
    case "cloudflare-worker":
      rejectUnknownKeys(record, ["kind", "scriptName"], `${context} origin`);
      return {
        kind,
        scriptName: requireString(record, "scriptName", `${context} origin`),
      };
    case "cloud-run":
      rejectUnknownKeys(
        record,
        [
          "kind",
          "cloudRunServiceName",
          "nonSecretEnvironment",
          "secretEnvironmentReferences",
        ],
        `${context} origin`,
      );
      return {
        kind,
        cloudRunServiceName: requireString(
          record,
          "cloudRunServiceName",
          `${context} origin`,
        ),
        nonSecretEnvironment: requireStringMap(
          record,
          "nonSecretEnvironment",
          `${context} origin`,
        ),
        secretEnvironmentReferences: requireStringMap(
          record,
          "secretEnvironmentReferences",
          `${context} origin`,
        ),
      };
    case "external-https":
      rejectUnknownKeys(
        record,
        ["kind", "originHost", "pathRewrite", "forwardedBasePath", "trusted"],
        `${context} origin`,
      );
      return {
        kind,
        originHost: requireBareHostname(
          record,
          "originHost",
          `${context} origin`,
        ),
        pathRewrite: requireOneOf(
          record,
          "pathRewrite",
          ["preserve", "strip-mount-path"] as const,
          `${context} origin`,
        ),
        forwardedBasePath: requireForwardedBasePath(
          record,
          "forwardedBasePath",
          `${context} origin`,
        ),
        trusted: requireBoolean(record, "trusted", `${context} origin`),
      };
    case "static-gcs-bucket":
      rejectUnknownKeys(
        record,
        ["kind", "bucketName", "objectKeyPrefix"],
        `${context} origin`,
      );
      return {
        kind,
        bucketName: requireString(record, "bucketName", `${context} origin`),
        objectKeyPrefix: requireStringAllowEmpty(
          record,
          "objectKeyPrefix",
          `${context} origin`,
        ),
      };
  }
}
