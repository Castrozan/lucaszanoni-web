#!/bin/sh
set -eu

cloud_run_service_name="${CLOUD_RUN_SERVICE_NAME:?CLOUD_RUN_SERVICE_NAME is required}"
cloud_run_image_reference="${CLOUD_RUN_IMAGE_REFERENCE:?CLOUD_RUN_IMAGE_REFERENCE is required}"
google_cloud_project_id="${GOOGLE_CLOUD_PROJECT_ID:?GOOGLE_CLOUD_PROJECT_ID is required}"
google_cloud_region="${GOOGLE_CLOUD_REGION:?GOOGLE_CLOUD_REGION is required}"
candidate_revision_tag="${CANDIDATE_REVISION_TAG:?CANDIDATE_REVISION_TAG is required}"
health_check_request_path="${HEALTH_CHECK_REQUEST_PATH:-/livez}"
health_check_maximum_attempts="${HEALTH_CHECK_MAXIMUM_ATTEMPTS:-30}"
health_check_retry_delay_seconds="${HEALTH_CHECK_RETRY_DELAY_SECONDS:-2}"
gcloud_command="${GCLOUD_COMMAND:-gcloud}"
curl_command="${CURL_COMMAND:-curl}"

maximum_combined_traffic_tag_and_service_name_length=46
maximum_candidate_revision_tag_length=$((maximum_combined_traffic_tag_and_service_name_length - ${#cloud_run_service_name}))
if [ "${#candidate_revision_tag}" -gt "$maximum_candidate_revision_tag_length" ]; then
	candidate_revision_tag=$(printf '%s' "$candidate_revision_tag" | cut -c"1-${maximum_candidate_revision_tag_length}" | sed 's/-*$//')
fi

describe_cloud_run_service() {
	"$gcloud_command" run services describe "$cloud_run_service_name" \
		--project "$google_cloud_project_id" \
		--region "$google_cloud_region" \
		"$@"
}

existing_service_describe_error="$(describe_cloud_run_service --format='value(metadata.name)' 2>&1 >/dev/null)" && existing_service_describe_status=0 || existing_service_describe_status=$?
if [ "$existing_service_describe_status" -ne 0 ]; then
	if printf '%s' "$existing_service_describe_error" | grep -qiE 'NOT_FOUND|could not be found|does not exist'; then
		echo "::warning::Cloud Run service $cloud_run_service_name is not provisioned yet; deploy-infrastructure (Terraform) must apply before its image can roll. Skipping the image roll for this run."
		exit 0
	fi
	echo "::error::Failed to describe Cloud Run service $cloud_run_service_name: $existing_service_describe_error" >&2
	exit 1
fi

echo "Deploying the candidate revision of $cloud_run_service_name with no production traffic and the tag $candidate_revision_tag."
"$gcloud_command" run services update "$cloud_run_service_name" \
	--project "$google_cloud_project_id" \
	--region "$google_cloud_region" \
	--image "$cloud_run_image_reference" \
	--no-traffic \
	--tag "$candidate_revision_tag" \
	--quiet

service_description_json="$(describe_cloud_run_service --format=json 2>/dev/null || true)"
candidate_revision_url="$(printf '%s' "$service_description_json" | jq -r --arg tag "$candidate_revision_tag" '.status.traffic[] | select(.tag == $tag) | .url' 2>/dev/null || true)"
candidate_revision_name="$(printf '%s' "$service_description_json" | jq -r --arg tag "$candidate_revision_tag" '.status.traffic[] | select(.tag == $tag) | .revisionName' 2>/dev/null || true)"
if [ -z "$candidate_revision_url" ] || [ "$candidate_revision_url" = "null" ] || [ -z "$candidate_revision_name" ] || [ "$candidate_revision_name" = "null" ]; then
	echo "::error::Could not resolve the tagged candidate revision (tag $candidate_revision_tag) on service $cloud_run_service_name; refusing to migrate traffic." >&2
	exit 1
fi

candidate_health_check_url="${candidate_revision_url}${health_check_request_path}"
echo "Health-checking the candidate revision at $candidate_health_check_url before migrating any production traffic."

candidate_revision_is_healthy=0
health_check_attempt_number=1
while [ "$health_check_attempt_number" -le "$health_check_maximum_attempts" ]; do
	observed_health_status="$("$curl_command" -s -o /dev/null -w '%{http_code}' "$candidate_health_check_url" || true)"
	if [ "$observed_health_status" = "200" ]; then
		candidate_revision_is_healthy=1
		break
	fi
	echo "Health-check attempt $health_check_attempt_number observed HTTP $observed_health_status from the candidate revision; retrying."
	health_check_attempt_number=$((health_check_attempt_number + 1))
	sleep "$health_check_retry_delay_seconds"
done

if [ "$candidate_revision_is_healthy" -ne 1 ]; then
	echo "::error::Candidate revision tagged $candidate_revision_tag never became healthy at $candidate_health_check_url; leaving all production traffic on the previously serving revision." >&2
	exit 1
fi

echo "Candidate revision is healthy; migrating all production traffic onto it and removing the candidate tag."
"$gcloud_command" run services update-traffic "$cloud_run_service_name" \
	--project "$google_cloud_project_id" \
	--region "$google_cloud_region" \
	--to-revisions "$candidate_revision_name=100" \
	--remove-tags "$candidate_revision_tag" \
	--quiet
