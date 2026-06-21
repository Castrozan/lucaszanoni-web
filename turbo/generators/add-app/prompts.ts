import type { PlopTypes } from "@turbo/gen";
import type { AddAppAnswers } from "@platform/config";

export const addAppPrompts: PlopTypes.PromptQuestion[] = [
  {
    type: "input",
    name: "id",
    message:
      "App id (kebab-case, also the package name suffix and apps/<id> directory)",
    validate: (value: string) =>
      /^[a-z][a-z0-9-]*$/.test(value) ||
      "id must be kebab-case starting with a letter",
  },
  {
    type: "input",
    name: "mountPath",
    message: "Mount path served at the edge (must start and end with /)",
    validate: (value: string) =>
      (value.startsWith("/") && value.endsWith("/")) ||
      "mount path must start and end with a slash",
  },
  {
    type: "input",
    name: "navigationLabel",
    message: "Navigation label shown in cross-section navigation",
    validate: (value: string) =>
      value.trim().length > 0 || "navigation label is required",
  },
  {
    type: "input",
    name: "description",
    message: "One-line description of the app",
    validate: (value: string) =>
      value.trim().length > 0 || "description is required",
  },
  {
    type: "confirm",
    name: "showInCrossSectionNavigation",
    message: "Show this app in the cross-section navigation?",
    default: false,
  },
  {
    type: "list",
    name: "status",
    message: "Lifecycle status",
    choices: ["active", "retired"],
    default: "active",
  },
  {
    type: "list",
    name: "accessModelKind",
    message: "Access model (choose deliberately, there is no safe default)",
    choices: ["public", "owner-only", "shared"],
  },
  {
    type: "input",
    name: "audienceKey",
    message: "Shared audience key (the Access policy audience identifier)",
    when: (answers: AddAppAnswers) => answers.accessModelKind === "shared",
    validate: (value: string) =>
      value.trim().length > 0 || "audience key is required for shared apps",
  },
  {
    type: "list",
    name: "originKind",
    message: "Origin kind",
    choices: (answers: AddAppAnswers) =>
      answers.accessModelKind === "public"
        ? ["in-repo-cloud-run", "external-https", "static-gcs-bucket"]
        : ["in-repo-cloud-run", "external-https"],
    default: "in-repo-cloud-run",
  },
  {
    type: "list",
    name: "buildProfile",
    message: "Build profile",
    choices: ["static-spa", "dynamic-service"],
    default: "static-spa",
    when: (answers: AddAppAnswers) =>
      answers.originKind === "in-repo-cloud-run",
  },
  {
    type: "input",
    name: "externalOriginHost",
    message: "External origin host (bare hostname, no scheme/port/path)",
    when: (answers: AddAppAnswers) => answers.originKind === "external-https",
    validate: (value: string) =>
      (value.length > 0 && !value.includes(":") && !value.includes("/")) ||
      "must be a bare hostname",
  },
  {
    type: "list",
    name: "externalPathRewrite",
    message: "Path rewrite for the external origin",
    choices: ["preserve", "strip-mount-path"],
    default: "preserve",
    when: (answers: AddAppAnswers) => answers.originKind === "external-https",
  },
  {
    type: "input",
    name: "externalForwardedBasePath",
    message:
      "Forwarded base path (empty, or start and end with /; advertises the public prefix to the origin)",
    default: "",
    when: (answers: AddAppAnswers) => answers.originKind === "external-https",
    validate: (value: string) =>
      value.length === 0 ||
      (value.startsWith("/") && value.endsWith("/")) ||
      "must be empty or start and end with a slash",
  },
  {
    type: "confirm",
    name: "externalTrusted",
    message: "Is the external origin trusted to receive the edge auth header?",
    default: false,
    when: (answers: AddAppAnswers) => answers.originKind === "external-https",
  },
  {
    type: "input",
    name: "staticBucketName",
    message: "GCS bucket name",
    when: (answers: AddAppAnswers) =>
      answers.originKind === "static-gcs-bucket",
    validate: (value: string) =>
      value.trim().length > 0 || "bucket name is required",
  },
  {
    type: "input",
    name: "staticObjectKeyPrefix",
    message: "GCS object key prefix (may be empty)",
    default: "",
    when: (answers: AddAppAnswers) =>
      answers.originKind === "static-gcs-bucket",
  },
];
