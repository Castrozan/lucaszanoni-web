const METADATA_SERVER_ACCESS_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

const ACCESS_TOKEN_EXPIRY_SAFETY_MARGIN_MILLISECONDS = 60_000;

interface CachedAccessToken {
  readonly accessToken: string;
  readonly usableUntilEpochMilliseconds: number;
}

interface MetadataServerAccessTokenResponse {
  readonly access_token?: unknown;
  readonly expires_in?: unknown;
}

function readAccessTokenFromResponse(
  payload: MetadataServerAccessTokenResponse,
): CachedAccessToken {
  const accessToken = payload.access_token;
  const expiresInSeconds = payload.expires_in;
  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("the metadata server returned no access token");
  }
  const lifetimeMilliseconds =
    typeof expiresInSeconds === "number" ? expiresInSeconds * 1000 : 0;
  return {
    accessToken,
    usableUntilEpochMilliseconds:
      Date.now() +
      Math.max(
        0,
        lifetimeMilliseconds - ACCESS_TOKEN_EXPIRY_SAFETY_MARGIN_MILLISECONDS,
      ),
  };
}

export function createMetadataServerAccessTokenProvider(): () => Promise<string> {
  let cachedAccessToken: CachedAccessToken | undefined;

  return async function readAccessToken(): Promise<string> {
    if (
      cachedAccessToken !== undefined &&
      Date.now() < cachedAccessToken.usableUntilEpochMilliseconds
    ) {
      return cachedAccessToken.accessToken;
    }

    const response = await fetch(METADATA_SERVER_ACCESS_TOKEN_URL, {
      headers: { "metadata-flavor": "Google" },
    });
    if (!response.ok) {
      throw new Error(
        `the metadata server refused an access token with status ${response.status}`,
      );
    }

    cachedAccessToken = readAccessTokenFromResponse(
      (await response.json()) as MetadataServerAccessTokenResponse,
    );
    return cachedAccessToken.accessToken;
  };
}
