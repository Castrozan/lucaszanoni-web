import { useEffect, useState } from "react";

const ACCESS_IDENTITY_ENDPOINT = "/cdn-cgi/access/get-identity";

export type OwnerIdentityStatus = "loading" | "authenticated" | "anonymous";

export function isAuthenticatedIdentityPayload(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  const email = (payload as { email?: unknown }).email;
  return typeof email === "string" && email.length > 0;
}

export function useOwnerIdentity(): OwnerIdentityStatus {
  const [status, setStatus] = useState<OwnerIdentityStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(ACCESS_IDENTITY_ENDPOINT, {
      headers: { accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          setStatus("anonymous");
          return;
        }
        const payload = await response.json().catch(() => null);
        setStatus(
          isAuthenticatedIdentityPayload(payload)
            ? "authenticated"
            : "anonymous",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("anonymous");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
