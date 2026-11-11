export default {
  async fetch(request, environment) {
    const incomingUrl = new URL(request.url);
    const mountPath = environment.APPLICATION_MOUNT_PATH;
    if (!mountPath || !mountPath.startsWith("/") || !mountPath.endsWith("/")) {
      return new Response("Application mount is not configured", {
        status: 503,
      });
    }
    if (mountPath !== "/" && incomingUrl.pathname === mountPath.slice(0, -1)) {
      incomingUrl.pathname += "/";
      return new Response(null, {
        status: 308,
        headers: { Location: incomingUrl.toString() },
      });
    }
    if (!incomingUrl.pathname.startsWith(mountPath)) {
      return new Response("Application path not found", { status: 404 });
    }
    const assetUrl = new URL(incomingUrl);
    const assetPath = incomingUrl.pathname.slice(mountPath.length - 1);
    assetUrl.pathname = assetPath === "/" ? "/index.html" : assetPath;
    return environment.ASSETS.fetch(new Request(assetUrl, request));
  },
};
