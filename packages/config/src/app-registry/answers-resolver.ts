import type { AppAccessModel } from "./types.ts";
import type { AppOriginSpec, AppSourceSpec } from "./entry-builder.ts";

export type AddAppAccessModelChoice = "public" | "owner" | "shared";

export interface AddAppAnswers {
  id: string;
  mountPath: string;
  navigationLabel: string;
  description: string;
  showInCrossSectionNavigation: boolean;
  status: "active" | "retired";
  accessModelChoice: AddAppAccessModelChoice;
  audienceKey?: string;
  originKind: AppOriginSpec["kind"];
  buildProfile?: "static-spa" | "dynamic-service";
  externalOriginHost?: string;
  externalPathRewrite?: "preserve" | "strip-mount-path";
  externalForwardedBasePath?: string;
  externalTrusted?: boolean;
  staticBucketName?: string;
  staticObjectKeyPrefix?: string;
}

export function resolveAccessModel(answers: AddAppAnswers): AppAccessModel {
  if (answers.accessModelChoice === "public") {
    return { environment: "public" };
  }
  if (answers.accessModelChoice === "shared") {
    return {
      environment: "private",
      audience: { kind: "shared", audienceKey: answers.audienceKey ?? "" },
    };
  }
  return { environment: "private", audience: { kind: "owner" } };
}

export function resolveOriginSpec(answers: AddAppAnswers): AppOriginSpec {
  if (answers.originKind === "cloudflare-worker") {
    return { kind: answers.originKind };
  }
  if (answers.originKind === "external-https") {
    return {
      kind: "external-https",
      originHost: answers.externalOriginHost ?? "",
      pathRewrite: answers.externalPathRewrite ?? "preserve",
      forwardedBasePath: answers.externalForwardedBasePath ?? "",
      trusted: answers.externalTrusted ?? false,
    };
  }
  return {
    kind: "static-gcs-bucket",
    bucketName: answers.staticBucketName ?? "",
    objectKeyPrefix: answers.staticObjectKeyPrefix ?? "",
  };
}

export function resolveSourceSpec(
  answers: AddAppAnswers,
): AppSourceSpec | undefined {
  if (answers.buildProfile !== undefined) {
    return { buildProfile: answers.buildProfile };
  }
  if (answers.originKind === "cloudflare-worker") {
    return { buildProfile: "static-spa" };
  }
  return undefined;
}
