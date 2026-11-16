const CLOUDFLARE_API_BASE_URL = "https://api.cloudflare.com/client/v4";

export class CloudflareApiError extends Error {
  constructor(method, path, status, errors) {
    const reasons = (errors ?? [])
      .map((error) => `${error.code}: ${error.message}`)
      .join("; ");
    super(
      `Cloudflare ${method} ${path} failed with HTTP ${status}${reasons ? ` (${reasons})` : ""}`,
    );
    this.status = status;
    this.errorCodes = (errors ?? []).map((error) => error.code);
  }
}

export function createCloudflareApi(apiToken, fetchImplementation = fetch) {
  async function request(method, path, body) {
    const response = await fetchImplementation(
      `${CLOUDFLARE_API_BASE_URL}/${path}`,
      {
        method,
        headers: {
          Authorization: ["Bearer", apiToken].join(" "),
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new CloudflareApiError(
        method,
        path.split("?")[0],
        response.status,
        payload.errors,
      );
    }
    return payload;
  }

  async function listAll(path) {
    const separator = path.includes("?") ? "&" : "?";
    const results = [];
    for (let page = 1; ; page += 1) {
      const payload = await request(
        "GET",
        `${path}${separator}page=${page}&per_page=50`,
      );
      results.push(...payload.result);
      const totalPages = payload.result_info?.total_pages ?? 1;
      if (page >= totalPages || payload.result.length === 0) return results;
    }
  }

  return {
    get: async (path) => (await request("GET", path)).result,
    post: async (path, body) => (await request("POST", path, body)).result,
    listAll,
  };
}
