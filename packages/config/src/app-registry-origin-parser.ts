import type { AppOrigin } from "./app-registry-types";
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
} from "./app-registry-field-parsers";

export function parseOrigin(value: unknown, context: string): AppOrigin {
  const record = asObjectRecord(value, `${context} origin`);
  const kind = requireOneOf(
    record,
    "kind",
    ["in-repo-cloud-run", "external-https", "static-gcs-bucket"] as const,
    `${context} origin`,
  );
  switch (kind) {
    case "in-repo-cloud-run":
      rejectUnknownKeys(
        record,
        [
          "kind",
          "cloudRunServiceName",
          "appPackageName",
          "appDirectoryName",
          "buildProfile",
          "nonSecretEnvironment",
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
        appPackageName: requireString(
          record,
          "appPackageName",
          `${context} origin`,
        ),
        appDirectoryName: requireString(
          record,
          "appDirectoryName",
          `${context} origin`,
        ),
        buildProfile: requireOneOf(
          record,
          "buildProfile",
          ["static-spa", "dynamic-service"] as const,
          `${context} origin`,
        ),
        nonSecretEnvironment: requireStringMap(
          record,
          "nonSecretEnvironment",
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
