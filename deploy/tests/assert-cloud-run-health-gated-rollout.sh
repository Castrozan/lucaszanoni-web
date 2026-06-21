#!/bin/sh
set -eu

repository_root=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
rollout_script="$repository_root/deploy/cloud-run/roll-service-onto-image-with-health-gated-traffic-migration.sh"

cloud_run_service_name="lucaszanoni-reports"
candidate_revision_tag="candidate-0a1b2c3d0a1b2c3d0a1b2c3d0a1b2c3d0a1b2c3d"
cloud_run_image_reference="southamerica-east1-docker.pkg.dev/zg-url-shortener-2026/lucaszanoni-web/reports:0a1b2c3d0a1b2c3d0a1b2c3d0a1b2c3d0a1b2c3d"

maximum_combined_traffic_tag_and_service_name_length=46
expected_candidate_revision_tag=$(printf '%s' "$candidate_revision_tag" | cut -c"1-$((maximum_combined_traffic_tag_and_service_name_length - ${#cloud_run_service_name}))" | sed 's/-*$//')

base_temporary_directory=$(mktemp -d)
trap 'rm -rf "$base_temporary_directory"' EXIT

fake_command_directory="$base_temporary_directory/fake-commands"
mkdir -p "$fake_command_directory"

cat >"$fake_command_directory/gcloud" <<'FAKE_GCLOUD'
#!/bin/sh
printf 'gcloud %s\n' "$*" >>"$FAKE_COMMAND_CALL_LOG"
case " $* " in
*" run services describe "*--format=json*)
	cat "$FAKE_DESCRIBE_JSON_PATH"
	;;
*" run services describe "*)
	if [ "$FAKE_SERVICE_EXISTS" = "1" ]; then
		printf '%s\n' "$FAKE_SERVICE_NAME"
	else
		printf 'ERROR: (gcloud.run.services.describe) Cannot find service [%s]: NOT_FOUND\n' "$FAKE_SERVICE_NAME" >&2
		exit 1
	fi
	;;
*" run services update-traffic "*)
	exit 0
	;;
*" run services update "*)
	exit 0
	;;
*)
	printf 'unexpected gcloud invocation: %s\n' "$*" >&2
	exit 2
	;;
esac
FAKE_GCLOUD

cat >"$fake_command_directory/curl" <<'FAKE_CURL'
#!/bin/sh
printf 'curl %s\n' "$*" >>"$FAKE_COMMAND_CALL_LOG"
printf '%s' "$FAKE_HEALTH_STATUS"
FAKE_CURL

chmod +x "$fake_command_directory/gcloud" "$fake_command_directory/curl"

describe_json_fixture_path="$base_temporary_directory/service-description.json"
cat >"$describe_json_fixture_path" <<JSON
{"status":{"traffic":[{"revisionName":"${cloud_run_service_name}-00002-abc","percent":0,"tag":"${expected_candidate_revision_tag}","url":"http://candidate---${cloud_run_service_name}.example.invalid"},{"revisionName":"${cloud_run_service_name}-00001-xyz","percent":100}]}}
JSON

scenario_exit_code=0
scenario_call_log=""

run_rollout_scenario() {
	scenario_label="$1"
	fake_service_exists="$2"
	fake_health_status="$3"

	scenario_call_log="$base_temporary_directory/${scenario_label}-call-log.txt"
	: >"$scenario_call_log"

	set +e
	PATH="$fake_command_directory:$PATH" \
		FAKE_COMMAND_CALL_LOG="$scenario_call_log" \
		FAKE_SERVICE_EXISTS="$fake_service_exists" \
		FAKE_SERVICE_NAME="$cloud_run_service_name" \
		FAKE_HEALTH_STATUS="$fake_health_status" \
		FAKE_DESCRIBE_JSON_PATH="$describe_json_fixture_path" \
		CLOUD_RUN_SERVICE_NAME="$cloud_run_service_name" \
		CLOUD_RUN_IMAGE_REFERENCE="$cloud_run_image_reference" \
		GOOGLE_CLOUD_PROJECT_ID="zg-url-shortener-2026" \
		GOOGLE_CLOUD_REGION="southamerica-east1" \
		CANDIDATE_REVISION_TAG="$candidate_revision_tag" \
		HEALTH_CHECK_MAXIMUM_ATTEMPTS="3" \
		HEALTH_CHECK_RETRY_DELAY_SECONDS="0" \
		sh "$rollout_script" >"$base_temporary_directory/${scenario_label}-stdout.txt" 2>"$base_temporary_directory/${scenario_label}-stderr.txt"
	scenario_exit_code=$?
	set -e
}

first_matching_line_number() {
	grep -nF -e "$1" "$2" | head -1 | cut -d: -f1
}

assert_exit_code() {
	if [ "$1" = "$2" ]; then
		echo "PASS: $3"
	else
		echo "FAIL: $3 (expected exit $1 but observed $2)" >&2
		exit 1
	fi
}

assert_log_contains() {
	if grep -qF -e "$1" "$2"; then
		echo "PASS: $3"
	else
		echo "FAIL: $3 (expected the call log to contain '$1')" >&2
		exit 1
	fi
}

assert_log_excludes() {
	if grep -qF -e "$1" "$2"; then
		echo "FAIL: $3 (expected the call log to NOT contain '$1')" >&2
		exit 1
	else
		echo "PASS: $3"
	fi
}

assert_log_order() {
	earlier_line_number=$(first_matching_line_number "$1" "$3")
	later_line_number=$(first_matching_line_number "$2" "$3")
	if [ -n "$earlier_line_number" ] && [ -n "$later_line_number" ] && [ "$earlier_line_number" -lt "$later_line_number" ]; then
		echo "PASS: $4"
	else
		echo "FAIL: $4 (expected '$1' at line ${earlier_line_number:-none} before '$2' at line ${later_line_number:-none})" >&2
		exit 1
	fi
}

assert_candidate_tag_within_cloud_run_combined_limit() {
	observed_candidate_revision_tag=$(grep -F " run services update " "$1" | sed -n 's/.*--tag \([^ ]*\).*/\1/p' | head -1)
	observed_combined_length=$((${#observed_candidate_revision_tag} + ${#cloud_run_service_name}))
	if [ "$observed_combined_length" -le 46 ]; then
		echo "PASS: $2 (candidate tag plus service name is ${observed_combined_length} characters)"
	else
		echo "FAIL: $2 (candidate tag '${observed_candidate_revision_tag}' plus service '${cloud_run_service_name}' is ${observed_combined_length} characters, over the Cloud Run 46-character combined limit)" >&2
		exit 1
	fi
}

echo "--- scenario: healthy candidate is health-gated then promoted ---"
run_rollout_scenario "healthy" "1" "200"
assert_exit_code 0 "$scenario_exit_code" "[healthy] script exits zero after a successful health-gated migration"
assert_log_contains "--no-traffic" "$scenario_call_log" "[healthy] the candidate revision is deployed with no production traffic"
assert_log_contains "--tag $expected_candidate_revision_tag --quiet" "$scenario_call_log" "[healthy] the candidate revision is deployed under its length-bounded tag"
assert_candidate_tag_within_cloud_run_combined_limit "$scenario_call_log" "[healthy] the candidate tag stays within the Cloud Run combined tag-plus-service limit"
assert_log_contains "curl" "$scenario_call_log" "[healthy] the candidate revision is health-checked"
assert_log_contains "update-traffic" "$scenario_call_log" "[healthy] production traffic is migrated after the health check passes"
assert_log_contains "--remove-tags $expected_candidate_revision_tag --quiet" "$scenario_call_log" "[healthy] the same length-bounded candidate tag is removed after migration"
assert_log_contains "http://candidate---${cloud_run_service_name}.example.invalid/livez" "$scenario_call_log" "[healthy] the health probe targets the jq-resolved candidate URL with the health path"
assert_log_contains "--to-revisions ${cloud_run_service_name}-00002-abc=100" "$scenario_call_log" "[healthy] production traffic migrates to the exact health-checked candidate revision rather than merely the latest"
assert_log_order "--no-traffic" "curl" "$scenario_call_log" "[healthy] the no-traffic deploy precedes the health check"
assert_log_order "curl" "update-traffic" "$scenario_call_log" "[healthy] the health check precedes the traffic migration"

echo "--- scenario: unhealthy candidate never receives production traffic ---"
run_rollout_scenario "unhealthy" "1" "503"
assert_exit_code 1 "$scenario_exit_code" "[unhealthy] script fails when the candidate never becomes healthy"
assert_log_contains "--no-traffic" "$scenario_call_log" "[unhealthy] the candidate revision is still deployed with no traffic"
assert_log_contains "curl" "$scenario_call_log" "[unhealthy] the candidate revision is health-probed"
assert_log_excludes "update-traffic" "$scenario_call_log" "[unhealthy] production traffic is NEVER migrated to an unhealthy candidate (fail closed)"

echo "--- scenario: service not yet provisioned is skipped gracefully ---"
run_rollout_scenario "not-provisioned" "0" "200"
assert_exit_code 0 "$scenario_exit_code" "[not-provisioned] script skips gracefully when the service is not yet provisioned"
assert_log_excludes "--no-traffic" "$scenario_call_log" "[not-provisioned] no candidate revision is deployed"
assert_log_excludes "update-traffic" "$scenario_call_log" "[not-provisioned] no traffic migration is attempted"

echo "ALL CLOUD RUN HEALTH-GATED ROLLOUT ASSERTIONS PASSED"
