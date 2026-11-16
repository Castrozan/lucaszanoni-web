import { resolve } from "node:path";
import {
  EDGE_ROUTER_SCRIPT_NAME,
  EDGE_SHARED_SECRET_BINDING,
  EDGE_SHARED_SECRET_HEADER_NAME,
  EDGE_WORKER_COMPATIBILITY_DATE,
} from "./edge-production-configuration.mjs";
import { createEdgeRoutingTable } from "./edge-routing-table.mjs";

export const EDGE_WORKER_SECRETS = [EDGE_SHARED_SECRET_BINDING];

export function createEdgeWorkerConfiguration({
  registry,
  workerApplications,
  configuration,
  repositoryDirectory,
}) {
  const routingTable = createEdgeRoutingTable({
    registry,
    workerServiceRoutes: workerApplications.map((application) => ({
      prefix: application.mountPath,
      binding: application.binding,
    })),
    configuration,
  });
  return {
    name: EDGE_ROUTER_SCRIPT_NAME,
    main: resolve(
      repositoryDirectory,
      "deploy/edge-router/edge-router-worker.mjs",
    ),
    compatibility_date: EDGE_WORKER_COMPATIBILITY_DATE,
    compatibility_flags: [],
    workers_dev: false,
    preview_urls: false,
    keep_vars: false,
    vars: {
      EDGE_ROUTES: JSON.stringify(routingTable),
      EDGE_SHARED_SECRET_HEADER_NAME,
    },
    services: workerApplications.map((application) => ({
      binding: application.binding,
      service: application.target.scriptName,
    })),
  };
}
