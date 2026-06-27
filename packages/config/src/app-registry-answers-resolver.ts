import type { AppAccessModel } from "./app-registry-types";
import type { AppOriginSpec } from "./app-registry-entry-builder";

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
  if (answers.originKind === "external-https") {
    return {
      kind: "external-https",
      originHost: answers.externalOriginHost ?? "",
      pathRewrite: answers.externalPathRewrite ?? "preserve",
      forwardedBasePath: answers.externalForwardedBasePath ?? "",
      trusted: answers.externalTrusted ?? false,
    };
  }
  if (answers.originKind === "static-gcs-bucket") {
    return {
      kind: "static-gcs-bucket",
      bucketName: answers.staticBucketName ?? "",
      objectKeyPrefix: answers.staticObjectKeyPrefix ?? "",
    };
  }
  return {
    kind: "in-repo-cloud-run",
    buildProfile: answers.buildProfile ?? "static-spa",
  };
}
