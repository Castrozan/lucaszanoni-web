import type { InferenceAdmissionEnvironment } from "./visitor-inference-admission";
import type { RuntimeModelEnvironment } from "./index";

export type PublicGenerationEnvironment = InferenceAdmissionEnvironment &
  RuntimeModelEnvironment &
  Readonly<{
    APPLICATION_MOUNT_PATH?: string;
    ASSETS: Readonly<{ fetch(request: Request): Promise<Response> }>;
  }>;

export type PublicGenerationHandler = (
  request: Request,
  environment: PublicGenerationEnvironment,
) => Promise<Response>;

export function createPublicGenerationWorker(
  handlersByMountRelativePath: Readonly<
    Record<string, PublicGenerationHandler>
  >,
) {
  const handlers = new Map(Object.entries(handlersByMountRelativePath));
  return {
    async fetch(
      request: Request,
      environment: PublicGenerationEnvironment,
    ): Promise<Response> {
      const mountPath = environment.APPLICATION_MOUNT_PATH;
      if (!mountPath?.startsWith("/") || !mountPath.endsWith("/"))
        return new Response("Application mount is not configured", {
          status: 503,
        });
      const incomingUrl = new URL(request.url);
      if (
        mountPath !== "/" &&
        incomingUrl.pathname === mountPath.slice(0, -1)
      ) {
        incomingUrl.pathname += "/";
        return new Response(null, {
          status: 308,
          headers: { Location: incomingUrl.toString() },
        });
      }
      if (!incomingUrl.pathname.startsWith(mountPath))
        return new Response("Application path not found", { status: 404 });
      const handler = handlers.get(
        incomingUrl.pathname.slice(mountPath.length),
      );
      if (handler) {
        if (request.method !== "POST")
          return new Response("Method not allowed", {
            status: 405,
            headers: { allow: "POST" },
          });
        return handler(request, environment);
      }
      const assetUrl = new URL(incomingUrl);
      const assetPath = incomingUrl.pathname.slice(mountPath.length - 1);
      assetUrl.pathname = assetPath === "/" ? "/index.html" : assetPath;
      return environment.ASSETS.fetch(new Request(assetUrl, request));
    },
  };
}
