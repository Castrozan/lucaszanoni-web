import { setTimeout as delay } from "node:timers/promises";

export function createD1QueryClient({
  accountId,
  databaseId,
  apiToken,
  fetch: request = fetch,
}) {
  if (
    !/^[a-f0-9]{32}$/.test(accountId) ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      databaseId,
    ) ||
    !apiToken
  ) {
    throw new Error("Invalid database identity or missing existing credential");
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  return async (sql, parameters = []) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await request(endpoint, {
        method: "POST",
        headers: {
          Authorization: ["Bearer", apiToken].join(" "),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params: parameters }),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 429 && attempt < 2) {
        const retryAfter = response.headers.get("Retry-After");
        const seconds =
          retryAfter !== null && /^\d+$/.test(retryAfter)
            ? Number(retryAfter)
            : NaN;
        if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > 300) {
          throw new Error("D1 rate limit requires an explicit bounded retry");
        }
        await delay(seconds * 1_000);
        continue;
      }
      if (!response.ok)
        throw new Error(`D1 query refused: HTTP ${response.status}`);
      const document = await response.json();
      if (
        !document.success ||
        document.result?.length !== 1 ||
        !document.result[0].success
      ) {
        throw new Error("D1 query did not return one successful result");
      }
      const result = document.result[0];
      for (const value of [result.meta?.rows_read, result.meta?.rows_written]) {
        if (!Number.isSafeInteger(value) || value < 0)
          throw new Error("Missing native D1 statistics");
      }
      return result;
    }
    throw new Error("D1 query attempts exhausted");
  };
}
