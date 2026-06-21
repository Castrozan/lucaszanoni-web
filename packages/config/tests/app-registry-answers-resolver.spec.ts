import { describe, expect, it } from "vitest";
import {
  resolveAccessModel,
  resolveOriginSpec,
  type AddAppAnswers,
} from "../src/app-registry-answers-resolver";
import { buildAppRegistryEntry } from "../src/app-registry-entry-builder";
import { parseAppRegistry } from "../src/app-registry-parser";
import { AppRegistryValidationError } from "../src/app-registry-types";

const baseAnswers: AddAppAnswers = {
  id: "ledger",
  mountPath: "/finance/ledger/",
  navigationLabel: "Ledger",
  description: "Double-entry ledger service.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModelKind: "public",
  originKind: "in-repo-cloud-run",
};

describe("resolveAccessModel", () => {
  it("maps the public access model kind", () => {
    expect(
      resolveAccessModel({ ...baseAnswers, accessModelKind: "public" }),
    ).toEqual({
      kind: "public",
    });
  });

  it("maps the owner-only access model kind", () => {
    expect(
      resolveAccessModel({ ...baseAnswers, accessModelKind: "owner-only" }),
    ).toEqual({ kind: "owner-only" });
  });

  it("carries the shared audience key through", () => {
    expect(
      resolveAccessModel({
        ...baseAnswers,
        accessModelKind: "shared",
        audienceKey: "engineering",
      }),
    ).toEqual({ kind: "shared", audienceKey: "engineering" });
  });

  it("falls back to an empty audience key when a shared key is omitted", () => {
    expect(
      resolveAccessModel({ ...baseAnswers, accessModelKind: "shared" }),
    ).toEqual({ kind: "shared", audienceKey: "" });
  });
});

describe("resolveOriginSpec", () => {
  it("carries an explicit in-repo build profile through", () => {
    expect(
      resolveOriginSpec({
        ...baseAnswers,
        originKind: "in-repo-cloud-run",
        buildProfile: "dynamic-service",
      }),
    ).toEqual({ kind: "in-repo-cloud-run", buildProfile: "dynamic-service" });
  });

  it("falls back to the static-spa build profile when omitted", () => {
    expect(
      resolveOriginSpec({ ...baseAnswers, originKind: "in-repo-cloud-run" }),
    ).toEqual({ kind: "in-repo-cloud-run", buildProfile: "static-spa" });
  });

  it("maps every explicit external-https field", () => {
    expect(
      resolveOriginSpec({
        ...baseAnswers,
        originKind: "external-https",
        externalOriginHost: "status.example.test",
        externalPathRewrite: "strip-mount-path",
        externalForwardedBasePath: "/status/",
        externalTrusted: true,
      }),
    ).toEqual({
      kind: "external-https",
      originHost: "status.example.test",
      pathRewrite: "strip-mount-path",
      forwardedBasePath: "/status/",
      trusted: true,
    });
  });

  it("falls back to every external-https default when fields are omitted", () => {
    expect(
      resolveOriginSpec({ ...baseAnswers, originKind: "external-https" }),
    ).toEqual({
      kind: "external-https",
      originHost: "",
      pathRewrite: "preserve",
      forwardedBasePath: "",
      trusted: false,
    });
  });

  it("maps every explicit static-gcs-bucket field", () => {
    expect(
      resolveOriginSpec({
        ...baseAnswers,
        originKind: "static-gcs-bucket",
        staticBucketName: "lucaszanoni-downloads",
        staticObjectKeyPrefix: "public/",
      }),
    ).toEqual({
      kind: "static-gcs-bucket",
      bucketName: "lucaszanoni-downloads",
      objectKeyPrefix: "public/",
    });
  });

  it("falls back to every static-gcs-bucket default when fields are omitted", () => {
    expect(
      resolveOriginSpec({ ...baseAnswers, originKind: "static-gcs-bucket" }),
    ).toEqual({
      kind: "static-gcs-bucket",
      bucketName: "",
      objectKeyPrefix: "",
    });
  });
});

describe("the answers to registry entry path", () => {
  function entryFromAnswers(answers: AddAppAnswers) {
    return buildAppRegistryEntry({
      id: answers.id,
      mountPath: answers.mountPath,
      navigationLabel: answers.navigationLabel,
      description: answers.description,
      showInCrossSectionNavigation: answers.showInCrossSectionNavigation,
      status: answers.status,
      accessModel: resolveAccessModel(answers),
      origin: resolveOriginSpec(answers),
    });
  }

  it("round-trips a public in-repo app through the parser", () => {
    const entry = entryFromAnswers(baseAnswers);
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("round-trips an owner-only external-https app through the parser", () => {
    const entry = entryFromAnswers({
      ...baseAnswers,
      id: "status-page",
      mountPath: "/status/",
      accessModelKind: "owner-only",
      originKind: "external-https",
      externalOriginHost: "status.example.test",
      externalPathRewrite: "strip-mount-path",
      externalForwardedBasePath: "/status/",
      externalTrusted: true,
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("produces a parser-rejected entry when a shared app omits its audience key", () => {
    const entry = entryFromAnswers({
      ...baseAnswers,
      accessModelKind: "shared",
    });
    expect(entry.accessModel).toEqual({ kind: "shared", audienceKey: "" });
    expect(() => parseAppRegistry([entry])).toThrow(AppRegistryValidationError);
  });
});
