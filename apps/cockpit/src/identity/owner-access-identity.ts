export interface OwnerAccessIdentity {
  readonly email: string;
  readonly name: string;
}

const OWNER_ACCESS_IDENTITY_ENDPOINT = "/cdn-cgi/access/get-identity";

export const OWNER_ACCESS_LOGOUT_PATH = "/cdn-cgi/access/logout";

export async function readOwnerAccessIdentity(): Promise<OwnerAccessIdentity | null> {
  try {
    const response = await fetch(OWNER_ACCESS_IDENTITY_ENDPOINT, {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    return parseOwnerAccessIdentity(await response.json());
  } catch {
    return null;
  }
}

function parseOwnerAccessIdentity(
  payload: unknown,
): OwnerAccessIdentity | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const candidate = payload as Record<string, unknown>;
  const email = typeof candidate.email === "string" ? candidate.email : null;
  if (!email) {
    return null;
  }
  const name =
    typeof candidate.name === "string" && candidate.name.length > 0
      ? candidate.name
      : email;
  return { email, name };
}
