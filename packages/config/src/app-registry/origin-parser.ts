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
} from "./field-parsers.ts";

export function parseOrigin(value: unknown, context: string): AppOrigin {
  const record = asObjectRecord(value, `${context} origin`);
  const kind = requireOneOf(
    record,
    "kind",
    ["cloudflare-worker", "external-https", "static-gcs-bucket"] as const,
    `${context} origin`,
  );
  switch (kind) {
    case "cloudflare-worker":
      rejectUnknownKeys(record, ["kind", "scriptName"], `${context} origin`);
      return {
        kind,
        scriptName: requireString(record, "scriptName", `${context} origin`),
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
