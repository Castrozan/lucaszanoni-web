#!/bin/sh
set -eu

base_url="${BASE_URL:?BASE_URL is required}"
registry_path="${REGISTRY_PATH:?REGISTRY_PATH is required}"
alias_redirect_host="${ALIAS_REDIRECT_HOST:-}"
alias_expected_status="${ALIAS_EXPECTED_STATUS:-301}"
curl_command="${CURL_COMMAND:-curl}"
jq_command="${JQ_COMMAND:-jq}"

repository_root=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
expected_edge_routes_program="${EXPECTED_EDGE_ROUTES_JQ_PROGRAM:-$repository_root/deploy/cloudflare/expected-edge-routes-from-registry.jq}"

expected_routes_file=$(mktemp)
trap 'rm -f "$expected_routes_file"' EXIT
"$jq_command" -r -f "$expected_edge_routes_program" "$registry_path" >"$expected_routes_file"

observed_status_for_url() {
	"$curl_command" -s --connect-timeout 5 --max-time 15 -o /dev/null -w '%{http_code}' "$1" || true
}

status_is_allowed() {
	case ",${2}," in
	*",${1},"*) return 0 ;;
	*) return 1 ;;
	esac
}

failing_route_count=0

assert_route_status() {
	route_url="$1"
	allowed_status_set="$2"
	route_label="$3"
	observed_status=$(observed_status_for_url "$route_url")
	if status_is_allowed "$observed_status" "$allowed_status_set"; then
		echo "PASS: $route_label served HTTP $observed_status (allowed: $allowed_status_set)"
	else
		echo "FAIL: $route_label served HTTP $observed_status but only $allowed_status_set is allowed ($route_url)" >&2
		failing_route_count=$((failing_route_count + 1))
	fi
}

tab_character=$(printf '\t')
while IFS="$tab_character" read -r registry_mount_path allowed_status_set; do
	[ -n "$registry_mount_path" ] || continue
	assert_route_status "${base_url}${registry_mount_path}" "$allowed_status_set" "registry route $registry_mount_path"
done <"$expected_routes_file"

if [ -n "$alias_redirect_host" ]; then
	assert_route_status "https://${alias_redirect_host}/" "$alias_expected_status" "alias host ${alias_redirect_host}"
fi

if [ "$failing_route_count" -ne 0 ]; then
	echo "::error::Edge smoke check failed: $failing_route_count edge route(s) did not serve an allowed status after the worker apply; the edge may be degraded for every app. Inspect the FAIL lines above and revert the offending change." >&2
	exit 1
fi

echo "ALL EDGE ROUTE SMOKE CHECKS PASSED"
