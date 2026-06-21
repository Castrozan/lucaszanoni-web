#!/bin/sh
set -eu

repository_root=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
smoke_check_script="$repository_root/deploy/cloudflare/smoke-check-edge-routes.sh"

base_temporary_directory=$(mktemp -d)
trap 'rm -rf "$base_temporary_directory"' EXIT

fake_command_directory="$base_temporary_directory/fake-commands"
mkdir -p "$fake_command_directory"

cat >"$fake_command_directory/curl" <<'FAKE_CURL'
#!/bin/sh
for fake_curl_argument in "$@"; do
	requested_url="$fake_curl_argument"
done
mapped_status=$(awk -F'\t' -v requested_url="$requested_url" '$2 == requested_url { print $1; exit }' "$FAKE_HTTP_STATUS_MAP")
resolved_status="${mapped_status:-000}"
printf '%s' "$resolved_status"
if [ "$resolved_status" = "000" ]; then
	exit 6
fi
FAKE_CURL
chmod +x "$fake_command_directory/curl"

fixture_registry_path="$base_temporary_directory/app-registry.json"
cat >"$fixture_registry_path" <<'FIXTURE_REGISTRY'
[
  { "mountPath": "/", "status": "active", "accessModel": { "kind": "public" } },
  { "mountPath": "/legacy/", "status": "retired", "accessModel": { "kind": "public" } },
  { "mountPath": "/db/", "status": "active", "accessModel": { "kind": "owner-only" } },
  { "mountPath": "/admin/", "status": "active", "accessModel": { "kind": "owner-only" } }
]
FIXTURE_REGISTRY

base_url="https://example.test"
alias_redirect_host="alias.example.test"

scenario_exit_code=0
scenario_output=""

run_smoke_scenario() {
	scenario_label="$1"
	status_map_lines="$2"

	scenario_status_map="$base_temporary_directory/${scenario_label}-status-map.tsv"
	printf '%s\n' "$status_map_lines" >"$scenario_status_map"
	scenario_output="$base_temporary_directory/${scenario_label}-output.txt"

	set +e
	PATH="$fake_command_directory:$PATH" \
		FAKE_HTTP_STATUS_MAP="$scenario_status_map" \
		BASE_URL="$base_url" \
		REGISTRY_PATH="$fixture_registry_path" \
		ALIAS_REDIRECT_HOST="$alias_redirect_host" \
		CURL_COMMAND="curl" \
		sh "$smoke_check_script" >"$scenario_output" 2>&1
	scenario_exit_code=$?
	set -e
}

assert_exit_code() {
	if [ "$1" = "$2" ]; then
		echo "PASS: $3"
	else
		echo "FAIL: $3 (expected exit $1 but observed $2)" >&2
		exit 1
	fi
}

assert_output_contains() {
	if grep -qF -e "$1" "$2"; then
		echo "PASS: $3"
	else
		echo "FAIL: $3 (expected the output to contain '$1')" >&2
		exit 1
	fi
}

assert_output_excludes() {
	if grep -qF -e "$1" "$2"; then
		echo "FAIL: $3 (expected the output to NOT contain '$1')" >&2
		exit 1
	else
		echo "PASS: $3"
	fi
}

healthy_status_map="200	https://example.test/
410	https://example.test/legacy/
302	https://example.test/db/
401	https://example.test/admin/
301	https://alias.example.test/"

echo "--- scenario: every edge route serves its allowed status ---"
run_smoke_scenario "healthy" "$healthy_status_map"
assert_exit_code 0 "$scenario_exit_code" "[healthy] the smoke gate passes when every route serves an allowed status"
assert_output_contains "ALL EDGE ROUTE SMOKE CHECKS PASSED" "$scenario_output" "[healthy] the all-clear line is printed"
assert_output_contains "registry route /db/ served HTTP 302" "$scenario_output" "[healthy] an Access-gated route is healthy on a 302 interactive challenge"
assert_output_contains "registry route /admin/ served HTTP 401" "$scenario_output" "[healthy] an Access-gated route is healthy on a 401 non-interactive challenge"
assert_output_contains "registry route /legacy/ served HTTP 410" "$scenario_output" "[healthy] a retired route is healthy on a 410 Gone"
assert_output_contains "alias host alias.example.test served HTTP 301" "$scenario_output" "[healthy] the alias host is healthy on a 301 redirect"

echo "--- scenario: a public route degraded to 5xx fails the gate ---"
run_smoke_scenario "public-5xx" "502	https://example.test/
410	https://example.test/legacy/
302	https://example.test/db/
302	https://example.test/admin/
301	https://alias.example.test/"
assert_exit_code 1 "$scenario_exit_code" "[public-5xx] the smoke gate fails when a public route serves a 5xx"
assert_output_contains "FAIL: registry route / served HTTP 502" "$scenario_output" "[public-5xx] the degraded public route is named in the failure"
assert_output_contains "::error::" "$scenario_output" "[public-5xx] a workflow error annotation is emitted"

echo "--- scenario: a retired route that fell through to 200 fails the gate ---"
run_smoke_scenario "retired-fellthrough" "200	https://example.test/
200	https://example.test/legacy/
302	https://example.test/db/
302	https://example.test/admin/
301	https://alias.example.test/"
assert_exit_code 1 "$scenario_exit_code" "[retired-fellthrough] the smoke gate fails when a retired route serves 200 instead of 410"
assert_output_contains "FAIL: registry route /legacy/ served HTTP 200" "$scenario_output" "[retired-fellthrough] the retired route masquerading as live is named"
assert_output_contains "PASS: registry route / served HTTP 200" "$scenario_output" "[retired-fellthrough] the healthy public root is still reported PASS alongside the failure"

echo "--- scenario: a broken alias redirect fails the gate ---"
run_smoke_scenario "alias-broken" "200	https://example.test/
410	https://example.test/legacy/
302	https://example.test/db/
302	https://example.test/admin/
200	https://alias.example.test/"
assert_exit_code 1 "$scenario_exit_code" "[alias-broken] the smoke gate fails when the alias serves 200 instead of 301"
assert_output_contains "FAIL: alias host alias.example.test served HTTP 200" "$scenario_output" "[alias-broken] the broken alias redirect is named"

echo "--- scenario: an unreachable route (curl exits non-zero, status 000) fails the gate loudly ---"
run_smoke_scenario "route-unreachable" "000	https://example.test/
410	https://example.test/legacy/
302	https://example.test/db/
401	https://example.test/admin/
301	https://alias.example.test/"
assert_exit_code 1 "$scenario_exit_code" "[route-unreachable] the smoke gate fails when a route is unreachable and curl exits non-zero"
assert_output_contains "FAIL: registry route / served HTTP 000" "$scenario_output" "[route-unreachable] the unreachable route is named with status 000"
assert_output_contains "::error::" "$scenario_output" "[route-unreachable] a workflow error annotation is emitted despite curl's non-zero exit"
assert_output_contains "PASS: registry route /legacy/ served HTTP 410" "$scenario_output" "[route-unreachable] the loop continues past the unreachable route to the remaining routes"

echo "ALL WORKER ROLLOUT SMOKE-GATE ASSERTIONS PASSED"
