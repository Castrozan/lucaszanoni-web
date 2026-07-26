import { afterEach, describe, expect, it, vi } from "vitest";
import { createGoogleCloudStorageSnapshotObjectWriter } from "../src/google-cloud-storage-snapshot-object-writer";

const BUCKET_NAME = "a-snapshot-bucket";

function captureUploadRequest() {
  const captured: { url?: string; init?: RequestInit } = {};
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    captured.url = url;
    captured.init = init;
    return new Response("{}", { status: 200 });
  });
  return captured;
}

function partContentTypes(uploadBody: string): readonly string[] {
  return uploadBody
    .split("\r\n")
    .filter((line) => line.toLowerCase().startsWith("content-type:"))
    .map((line) => line.slice(line.indexOf(":") + 1).trim());
}

function uploadedMetadata(uploadBody: string): Record<string, unknown> {
  const metadataLine = uploadBody
    .split("\r\n")
    .find((line) => line.startsWith("{") && line.includes('"name"'));
  return JSON.parse(metadataLine ?? "{}") as Record<string, unknown>;
}

describe("the multipart upload google cloud storage accepts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("declares the same content type in the object part as in the metadata", async () => {
    const captured = captureUploadRequest();
    const writer = createGoogleCloudStorageSnapshotObjectWriter(
      BUCKET_NAME,
      async () => "an-access-token",
    );

    await writer.writeSnapshotObject("snapshots/a-topic/latest.json", "{}");

    const uploadBody = String(captured.init?.body);
    const [metadataPartContentType, objectPartContentType] =
      partContentTypes(uploadBody);
    expect(objectPartContentType).toBe(
      uploadedMetadata(uploadBody)["contentType"],
    );
    expect(metadataPartContentType).toBe("application/json; charset=UTF-8");
  });

  it("still names the object and keeps the snapshot uncacheable", async () => {
    const captured = captureUploadRequest();
    const writer = createGoogleCloudStorageSnapshotObjectWriter(
      BUCKET_NAME,
      async () => "an-access-token",
    );

    await writer.writeSnapshotObject("snapshots/a-topic/latest.json", "{}");

    const metadata = uploadedMetadata(String(captured.init?.body));
    expect(metadata["name"]).toBe("snapshots/a-topic/latest.json");
    expect(metadata["cacheControl"]).toBe("no-store, max-age=0");
  });

  it("carries the reason the bucket gave, not only the status it gave it with", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response('{"error":{"message":"the metadata did not match"}}', {
          status: 400,
        }),
    );
    const writer = createGoogleCloudStorageSnapshotObjectWriter(
      BUCKET_NAME,
      async () => "an-access-token",
    );

    await expect(
      writer.writeSnapshotObject("snapshots/a-topic/latest.json", "{}"),
    ).rejects.toThrow("the metadata did not match");
  });
});
