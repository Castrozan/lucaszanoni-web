const READABLE_METHODS = new Set(["GET", "HEAD"]);
const FORBIDDEN_KEY_CHARACTERS = /[\\\u0000-\u001f\u007f]/;
const SAFETY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "sandbox allow-scripts",
};

export async function respondToSnapshotDataRequest(
  request,
  environment,
  mountPath,
) {
  const dataPathPrefix = `${mountPath}data/`;
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith(dataPathPrefix)) {
    return null;
  }
  if (!READABLE_METHODS.has(request.method)) {
    return textResponse(405, "Snapshot data supports GET and HEAD only", {
      Allow: "GET, HEAD",
    });
  }
  const snapshotKey = decodeSnapshotKey(pathname.slice(dataPathPrefix.length));
  if (snapshotKey === null) {
    return textResponse(400, "Invalid snapshot data key");
  }
  return readSnapshotObjectResponse(
    request.method,
    snapshotKey,
    environment.SNAPSHOT_READER,
  );
}

function decodeSnapshotKey(encodedKey) {
  let snapshotKey;
  try {
    snapshotKey = decodeURIComponent(encodedKey);
  } catch {
    return null;
  }
  return isExactStoredKey(snapshotKey) ? snapshotKey : null;
}

function isExactStoredKey(snapshotKey) {
  if (snapshotKey === "" || FORBIDDEN_KEY_CHARACTERS.test(snapshotKey)) {
    return false;
  }
  return snapshotKey
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

async function readSnapshotObjectResponse(method, snapshotKey, snapshotReader) {
  if (typeof snapshotReader?.readSnapshotObject !== "function") {
    return unavailableResponse();
  }
  let snapshotObject;
  try {
    snapshotObject = await snapshotReader.readSnapshotObject(snapshotKey);
  } catch {
    return unavailableResponse();
  }
  if (snapshotObject === null) {
    return textResponse(404, "Snapshot data not found");
  }
  if (!isSnapshotObject(snapshotObject)) {
    return unavailableResponse();
  }
  try {
    return new Response(method === "HEAD" ? null : snapshotObject.body, {
      status: 200,
      headers: {
        ...SAFETY_HEADERS,
        "Content-Type": snapshotObject.contentType,
      },
    });
  } catch {
    return unavailableResponse();
  }
}

function isSnapshotObject(snapshotObject) {
  return (
    typeof snapshotObject === "object" &&
    snapshotObject.body instanceof Uint8Array &&
    typeof snapshotObject.contentType === "string"
  );
}

function unavailableResponse() {
  return textResponse(503, "Snapshot data is unavailable");
}

function textResponse(status, message, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      ...SAFETY_HEADERS,
      ...extraHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
