import { resolve } from "node:path";

export function createApplicationBuildArguments(source) {
  return [
    "--filter",
    source.appPackageName,
    source.buildProfile === "dynamic-service" ? "build:worker" : "build",
  ];
}

export function createApplicationRuntimeProfile(
  application,
  settings,
  repositoryDirectory,
) {
  const applicationDirectory = resolve(
    repositoryDirectory,
    "apps",
    application.source.appDirectoryName,
  );
  const compatibilityFlags = settings.compatibility_flags ?? [];
  if (application.source.buildProfile === "worker-service") {
    return {
      main: resolve(applicationDirectory, "dist/worker.mjs"),
      compatibility_flags: [
        ...new Set([...compatibilityFlags, "nodejs_compat"]),
      ],
    };
  }
  if (application.source.buildProfile === "dynamic-service") {
    return {
      compatibility_date: "2026-10-13",
      main: resolve(
        applicationDirectory,
        "cloudflare/build/.open-next/worker.js",
      ),
      compatibility_flags: [
        ...new Set([
          ...compatibilityFlags,
          "nodejs_compat",
          "global_fetch_strictly_public",
        ]),
      ],
      assets: {
        directory: resolve(
          applicationDirectory,
          "cloudflare/build/.open-next/assets",
        ),
        binding: "ASSETS",
      },
    };
  }
  return {
    main: resolve(
      repositoryDirectory,
      "deploy/cloudflare/static-application-worker.mjs",
    ),
    compatibility_flags: compatibilityFlags,
    assets: {
      directory: resolve(applicationDirectory, "dist"),
      binding: "ASSETS",
      run_worker_first: true,
      html_handling: "none",
      not_found_handling: "single-page-application",
    },
  };
}
