import { readFileSync } from "node:fs";

export function generateAppPipeline(deployMatrix) {
  if (
    !Array.isArray(deployMatrix.include) ||
    deployMatrix.include.length === 0
  ) {
    throw new Error(
      "The deployment registry must contain at least one application",
    );
  }
  const jobs = Object.fromEntries(
    deployMatrix.include.map((application) => [
      `deploy:${application.app_directory_name}`,
      {
        extends: ".deploy-app",
        variables: {
          CLOUD_RUN_SERVICE_NAME: application.service_name,
          APP_PACKAGE_NAME: application.app_package_name,
          APP_DIRECTORY_NAME: application.app_directory_name,
          APP_MOUNT_PATH: application.app_mount_path,
          BUILD_PROFILE: application.build_profile,
        },
      },
    ]),
  );
  return {
    include: [{ local: ".gitlab/ci/deploy-app.yml" }],
    stages: ["deploy"],
    ...jobs,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdout.write(
    JSON.stringify(generateAppPipeline(JSON.parse(readFileSync(0, "utf8")))),
  );
}
