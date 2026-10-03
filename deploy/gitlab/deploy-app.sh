set -eu
: "${APP_PACKAGE_NAME:?}"
: "${APP_DIRECTORY_NAME:?}"
: "${APP_MOUNT_PATH:?}"
: "${CLOUD_RUN_SERVICE_NAME:?}"
case "$BUILD_PROFILE" in
  static-spa) dockerfile=deploy/docker/Dockerfile ;;
  dynamic-service) dockerfile=deploy/docker/dynamic-service.Dockerfile ;;
  *) printf 'Unsupported build profile: %s\n' "$BUILD_PROFILE" >&2; exit 1 ;;
esac
export CLOUD_RUN_IMAGE_REFERENCE="$GOOGLE_CLOUD_REGION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT_ID/lucaszanoni-web/$APP_DIRECTORY_NAME:$CI_COMMIT_SHA"
gcloud auth login --cred-file="$GOOGLE_APPLICATION_CREDENTIALS" --brief --quiet
gcloud auth configure-docker "$GOOGLE_CLOUD_REGION-docker.pkg.dev" --quiet
docker build --file "$dockerfile" \
  --build-arg APP_PACKAGE_NAME="$APP_PACKAGE_NAME" \
  --build-arg APP_DIRECTORY_NAME="$APP_DIRECTORY_NAME" \
  --build-arg APP_MOUNT_PATH="$APP_MOUNT_PATH" \
  --build-arg ATRIUM_BUILD_SHA="$CI_COMMIT_SHA" \
  --build-arg VITE_COCKPIT_GITLAB_BASE_URL="${COCKPIT_GITLAB_BASE_URL:-}" \
  --build-arg VITE_COCKPIT_GITLAB_PROJECT="${COCKPIT_GITLAB_PROJECT:-}" \
  --build-arg VITE_COCKPIT_REAL_COMPUTE="${COCKPIT_REAL_COMPUTE:-}" \
  --build-arg VITE_COCKPIT_WORKSPACE_MACHINES="${COCKPIT_WORKSPACE_MACHINES:-}" \
  --build-arg VITE_ARR_STACK_TAILNET_HOST="${ARR_STACK_TAILNET_HOST:-}" \
  --tag "$CLOUD_RUN_IMAGE_REFERENCE" .
docker push "$CLOUD_RUN_IMAGE_REFERENCE"
export CANDIDATE_REVISION_TAG="candidate-$CI_COMMIT_SHORT_SHA"
sh deploy/cloud-run/roll-service-onto-image-with-health-gated-traffic-migration.sh
