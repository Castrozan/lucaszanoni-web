import { resolve } from "node:path";
import {
  createDeploymentManifest,
  createPublicBuildEnvironment,
} from "../../packages/config/src/app-registry/deployment-manifest.ts";
import {
  createApplicationWorkerDeployment,
  resolveSnapshotTopology,
} from "./application-worker-configuration.mjs";

export function createSiteDeploymentPlan(
  settings,
  registry,
  repositoryDirectory,
  runtimeConfiguration = {},
) {
  const allowedBindingTypes = new Set([
    "plain_text",
    "secret_text",
    "assets",
    "service",
  ]);
  if (
    settings.bindings.some((binding) => !allowedBindingTypes.has(binding.type))
  ) {
    throw new Error(
      "Unrecognized Worker bindings require inspection before deployment",
    );
  }
  const variables = Object.fromEntries(
    settings.bindings
      .filter((binding) => binding.type === "plain_text")
      .map((binding) => [binding.name, binding.text]),
  );
  if (!variables.EDGE_ROUTES || !settings.compatibility_date) {
    throw new Error(
      "Existing edge routing and compatibility settings are required",
    );
  }
  const routingTable = JSON.parse(variables.EDGE_ROUTES);
  const manifest = createDeploymentManifest(registry);
  const applications = manifest.applications
    .filter((application) => application.target.kind === "cloudflare-worker")
    .map((application) => ({
      ...application,
      binding: `APP_${application.applicationId.replace(/-/g, "_").toUpperCase()}`,
    }));
  const snapshotTopology = resolveSnapshotTopology(
    manifest.applications,
    runtimeConfiguration,
  );
  const bindings = new Set();
  for (const application of applications) {
    if (
      !["static-spa", "worker-service"].includes(
        application.source?.buildProfile,
      )
    ) {
      throw new Error(
        `Application ${application.applicationId} requires a static-spa build adapter or worker-service build adapter`,
      );
    }
    if (application.servingLocation.kind !== "path-prefix") {
      throw new Error(
        `Application ${application.applicationId} requires a subdomain deployment adapter`,
      );
    }
    if (application.target.scriptName === "lucaszanoni-edge-router") {
      throw new Error("Application workers cannot overwrite the edge router");
    }
    const binding = application.binding;
    if (bindings.has(binding))
      throw new Error(`Duplicate application binding ${binding}`);
    bindings.add(binding);
  }
  const mountPaths = new Set(
    applications.map((application) => application.mountPath),
  );
  if (
    (routingTable.workerAssetsPrefixes ?? []).some(
      (route) => !mountPaths.has(route.prefix),
    )
  ) {
    throw new Error(
      "Unowned edge asset routes require inspection before deployment",
    );
  }
  const previousServiceBindings = new Set(
    (routingTable.workerServicePrefixes ?? []).map((route) => route.binding),
  );
  const services = settings.bindings
    .filter(
      (binding) =>
        binding.type === "service" &&
        !previousServiceBindings.has(binding.name),
    )
    .map((binding) => ({
      binding: binding.name,
      service: binding.service,
      ...(binding.environment ? { environment: binding.environment } : {}),
      ...(binding.entrypoint ? { entrypoint: binding.entrypoint } : {}),
    }));
  for (const application of applications) {
    if (
      settings.bindings.some(
        (binding) =>
          binding.name === application.binding &&
          !previousServiceBindings.has(binding.name),
      )
    ) {
      throw new Error(
        `Application binding ${application.binding} collides with an existing binding`,
      );
    }
    services.push({
      binding: application.binding,
      service: application.target.scriptName,
    });
  }
  const registryMountPaths = new Set(
    registry
      .filter(
        (application) => application.servingLocation?.kind !== "subdomain",
      )
      .map((application) => application.mountPath),
  );
  routingTable.retiredPrefixes = [
    ...(routingTable.retiredPrefixes ?? []).filter(
      (route) => !registryMountPaths.has(route.prefix),
    ),
    ...registry
      .filter(
        (application) =>
          application.status === "retired" &&
          application.servingLocation?.kind !== "subdomain",
      )
      .map((application) => ({ prefix: application.mountPath })),
  ];
  routingTable.prefixes = routingTable.prefixes.filter(
    (route) => !mountPaths.has(route.prefix),
  );
  if (mountPaths.has("/")) routingTable.shell = null;
  delete routingTable.workerAssetsPrefixes;
  delete routingTable.staticBucketPrefixes;
  routingTable.workerServicePrefixes = applications.map((application) => ({
    prefix: application.mountPath,
    binding: application.binding,
  }));
  variables.EDGE_ROUTES = JSON.stringify(routingTable);
  const deployments = applications.map((application) =>
    createApplicationWorkerDeployment(
      application,
      settings,
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
    edgeConfiguration: {
      name: "lucaszanoni-edge-router",
      main: resolve(
        repositoryDirectory,
        "infra/modules/cloudflare-edge/edge-router-worker.mjs",
      ),
      compatibility_date: settings.compatibility_date,
      compatibility_flags: settings.compatibility_flags ?? [],
      workers_dev: false,
      preview_urls: false,
      keep_vars: true,
      vars: variables,
      services,
    },
  };
}

export function createApplicationBuildEnvironment(source, environment) {
  return {
    ...environment,
    ...createPublicBuildEnvironment(source, environment),
  };
}
