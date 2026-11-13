import { describe, expect, it } from "vitest";
import { resolveIngestRequestTarget } from "../src/ingest-request-target";

const mountPath = "/ingest/";

describe("resolving what a request is asking the ingest service for", () => {
  it("maps the mounted health path to health", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "GET", "/ingest/livez"),
    ).toStrictEqual({ kind: "health" });
    expect(
      resolveIngestRequestTarget(mountPath, "POST", "/ingest/livez"),
    ).toStrictEqual({ kind: "method-not-allowed" });
  });

  it("decodes the object key of an artifact write", () => {
    expect(
      resolveIngestRequestTarget(
        mountPath,
        "PUT",
        "/ingest/artifacts/reports%2Fa%2Fb.json",
      ),
    ).toStrictEqual({ kind: "artifact", objectKey: "reports/a/b.json" });
  });

  it("refuses to read an artifact path and malformed encodings", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "GET", "/ingest/artifacts/a"),
    ).toStrictEqual({ kind: "method-not-allowed" });
    expect(
      resolveIngestRequestTarget(mountPath, "PUT", "/ingest/artifacts/%E0%A4"),
    ).toStrictEqual({ kind: "not-found" });
    expect(
      resolveIngestRequestTarget(mountPath, "PUT", "/ingest/artifacts/"),
    ).toStrictEqual({ kind: "not-found" });
  });

  it("answers the container health probe outside the mount path", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "GET", "/livez"),
    ).toStrictEqual({ kind: "health" });
  });

  it("reads the topic from the single segment under the mount path", () => {
    expect(
      resolveIngestRequestTarget(
        mountPath,
        "POST",
        "/ingest/dotfiles-test-baseline",
      ),
    ).toStrictEqual({ kind: "ingest", topic: "dotfiles-test-baseline" });
  });

  it("ignores a query string when reading the topic", () => {
    expect(
      resolveIngestRequestTarget(
        mountPath,
        "POST",
        "/ingest/dotfiles-test-baseline",
      ),
    ).toStrictEqual({ kind: "ingest", topic: "dotfiles-test-baseline" });
  });

  it("tolerates a mount path declared without its trailing slash", () => {
    expect(
      resolveIngestRequestTarget(
        "/ingest",
        "POST",
        "/ingest/dotfiles-test-baseline",
      ),
    ).toStrictEqual({ kind: "ingest", topic: "dotfiles-test-baseline" });
  });

  it("refuses a topic segment that hides a nested path", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "POST", "/ingest/a/b"),
    ).toStrictEqual({ kind: "not-found" });
  });

  it("refuses the bare mount path with no topic", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "POST", "/ingest/"),
    ).toStrictEqual({ kind: "not-found" });
  });

  it("refuses a path outside the mount", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "POST", "/engineering/reports/"),
    ).toStrictEqual({ kind: "not-found" });
  });

  it("reports a wrong method on the topic path rather than pretending it is missing", () => {
    expect(
      resolveIngestRequestTarget(
        mountPath,
        "GET",
        "/ingest/dotfiles-test-baseline",
      ),
    ).toStrictEqual({ kind: "method-not-allowed" });
  });

  it("reports a wrong method on the health probe", () => {
    expect(
      resolveIngestRequestTarget(mountPath, "POST", "/livez"),
    ).toStrictEqual({ kind: "method-not-allowed" });
  });
});
