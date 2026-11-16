import {
  createDeploymentManifest,
  createPublicBuildEnvironment,
} from "../../packages/config/src/app-registry/deployment-manifest.ts";
import {
  createApplicationWorkerDeployment,
  resolveSnapshotTopology,
} from "./application-worker-configuration.mjs";
import {
  EDGE_ROUTER_SCRIPT_NAME,
  EDGE_WORKER_COMPATIBILITY_DATE,
} from "../edge-router/edge-production-configuration.mjs";
import { createEdgeWorkerConfiguration } from "../edge-router/edge-worker-configuration.mjs";

const EDGE_WORKER_RUNTIME = {
  compatibility_date: EDGE_WORKER_COMPATIBILITY_DATE,
  compatibility_flags: [],
};

export function selectWorkerApplications(registry) {
  return createDeploymentManifest(registry)
    .applications.filter(
      (application) => application.target.kind === "cloudflare-worker",
    )
    .map((application) => ({
      ...application,
      binding: `APP_${application.applicationId.replace(/-/g, "_").toUpperCase()}`,
    }));
}

function assertWorkerApplicationsDeployable(applications) {
  const bindings = new Set();
  for (const application of applications) {
    if (
      !["static-spa", "worker-service", "dynamic-service"].includes(
        application.source?.buildProfile,
      )
    ) {
      throw new Error(
        `Application ${application.applicationId} requires a static-spa build adapter, worker-service build adapter or dynamic-service build adapter`,
      );
    }
    if (application.servingLocation.kind !== "path-prefix") {
      throw new Error(
        `Application ${application.applicationId} requires a subdomain deployment adapter`,
      );
    }
    if (application.target.scriptName === EDGE_ROUTER_SCRIPT_NAME) {
      throw new Error("Application workers cannot overwrite the edge router");
    }
    if (bindings.has(application.binding))
      throw new Error(`Duplicate application binding ${application.binding}`);
    bindings.add(application.binding);
  }
}

export function createSiteDeploymentPlan(
  edgeProductionConfiguration,
  registry,
  repositoryDirectory,
  runtimeConfiguration = {},
) {
  const manifest = createDeploymentManifest(registry);
  const applications = selectWorkerApplications(registry);
  assertWorkerApplicationsDeployable(applications);
  const snapshotTopology = resolveSnapshotTopology(
    manifest.applications,
    runtimeConfiguration,
  );
  const deployments = applications.map((application) =>
    createApplicationWorkerDeployment(
      application,
      EDGE_WORKER_RUNTIME,
      repositoryDirectory,
      snapshotTopology,
    ),
  );
  const isWriter = (deployment) =>
    deployment.applicationId === snapshotTopology?.writerApplicationId;
  return {
    applications: [
      ...deployments.filter(isWriter),
      ...deployments.filter((deployment) => !isWriter(deployment)),
    ],
    edgeConfiguration: createEdgeWorkerConfiguration({
      registry,
      workerApplications: applications,
      configuration: edgeProductionConfiguration,
      repositoryDirectory,
    }),
  };
}

export function createApplicationBuildEnvironment(source, environment) {
  return {
    ...environment,
    ...createPublicBuildEnvironment(source, environment),
  };
}
