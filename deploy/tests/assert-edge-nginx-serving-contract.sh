#!/bin/sh
set -eu

repository_root=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
correct_edge_secret="edge-authentication-test-secret-0a1b2c3d"
index_marker="edge-authenticated-spa-index-marker"
hashed_asset_marker="edge-authenticated-spa-hashed-asset-marker"
existing_hashed_asset_name="application-bundle-0a1b2c3d.js"

current_nginx_process_id=""
current_work_directory=""

cleanup_current_run() {
	if [ -n "$current_nginx_process_id" ]; then
		kill "$current_nginx_process_id" 2>/dev/null || true
		wait "$current_nginx_process_id" 2>/dev/null || true
	fi
	if [ -n "$current_work_directory" ]; then
		rm -rf "$current_work_directory"
	fi
}
trap cleanup_current_run EXIT

assert_http_status() {
	expected_status="$1"
	description="$2"
	shift 2
	observed_status=$(curl -s -o /dev/null -w '%{http_code}' "$@")
	if [ "$observed_status" != "$expected_status" ]; then
		echo "FAIL: $description expected HTTP $expected_status but observed $observed_status" >&2
		exit 1
	fi
	echo "PASS: $description returned HTTP $expected_status"
}

assert_redirect_location_is_relative() {
	description="$1"
	shift
	observed_location=$(curl -s -o /dev/null -D - "$@" | tr -d '\r' | awk 'tolower($1) == "location:" { print $2 }')
	case "$observed_location" in
	/*)
		echo "PASS: $description returned the relative Location $observed_location"
		;;
	*)
		echo "FAIL: $description expected a relative Location but observed '$observed_location'" >&2
		exit 1
		;;
	esac
}

run_serving_contract_for_mount_path() {
	application_mount_path="$1"
	listen_port="$2"

	current_work_directory=$(mktemp -d)
	document_root="$current_work_directory/document-root"
	mkdir -p "$document_root${application_mount_path}assets"
	printf '%s' "$index_marker" >"$document_root${application_mount_path}index.html"
	printf '%s' "$hashed_asset_marker" >"$document_root${application_mount_path}assets/$existing_hashed_asset_name"

	EDGE_SHARED_SECRET_VALUE="$correct_edge_secret" \
		EDGE_SHARED_SECRET_HEADER_NAME="X-Edge-Auth" \
		PORT="$listen_port" \
		NGINX_DOCUMENT_ROOT="$document_root" \
		APP_INDEX_FALLBACK_PATH="${application_mount_path}index.html" \
		APP_MOUNT_PATH="$application_mount_path" \
		EDGE_NGINX_TEMPLATE_PATH="$repository_root/deploy/nginx/edge-authenticated-spa.conf.template" \
		sh "$repository_root/deploy/nginx/render-edge-authenticated-spa-config.sh" >"$current_work_directory/edge-server.conf"

	cat >"$current_work_directory/nginx.conf" <<NGINX_CONFIGURATION
pid $current_work_directory/nginx.pid;
error_log $current_work_directory/error.log warn;
events {}
http {
    access_log off;
    client_body_temp_path $current_work_directory/client-body-temp;
    proxy_temp_path $current_work_directory/proxy-temp;
    fastcgi_temp_path $current_work_directory/fastcgi-temp;
    uwsgi_temp_path $current_work_directory/uwsgi-temp;
    scgi_temp_path $current_work_directory/scgi-temp;
    include $current_work_directory/edge-server.conf;
}
NGINX_CONFIGURATION

	nginx -p "$current_work_directory" -c "$current_work_directory/nginx.conf" -g 'daemon off;' &
	current_nginx_process_id=$!

	attempts=0
	until curl -fsS -o /dev/null "http://127.0.0.1:$listen_port${application_mount_path}" -H "X-Edge-Auth: $correct_edge_secret" 2>/dev/null; do
		attempts=$((attempts + 1))
		if [ "$attempts" -ge 50 ]; then
			echo "FAIL: nginx did not become ready on port $listen_port for mount path $application_mount_path" >&2
			exit 1
		fi
		sleep 0.1
	done

	base_url="http://127.0.0.1:$listen_port"
	root_request="$base_url${application_mount_path}"
	deep_route="$base_url${application_mount_path}some/client/route"
	existing_asset="$base_url${application_mount_path}assets/$existing_hashed_asset_name"
	missing_asset="$base_url${application_mount_path}assets/missing-bundle-deadbeef.js"
	bare_assets_directory="$base_url${application_mount_path}assets"

	echo "--- edge nginx serving contract for mount path $application_mount_path ---"
	assert_http_status 403 "[$application_mount_path] request without the edge header" "$root_request"
	assert_http_status 403 "[$application_mount_path] request with a wrong edge header value" -H "X-Edge-Auth: wrong-secret" "$root_request"
	assert_http_status 200 "[$application_mount_path] request with the correct edge header" -H "X-Edge-Auth: $correct_edge_secret" "$root_request"
	assert_http_status 200 "[$application_mount_path] deep single-page route falls back to index" -H "X-Edge-Auth: $correct_edge_secret" "$deep_route"
	assert_http_status 403 "[$application_mount_path] deep single-page route without the edge header" "$deep_route"
	assert_http_status 200 "[$application_mount_path] health endpoint is reachable without the edge header" "$base_url/livez"
	assert_http_status 200 "[$application_mount_path] existing hashed asset is served with the correct edge header" -H "X-Edge-Auth: $correct_edge_secret" "$existing_asset"
	assert_http_status 404 "[$application_mount_path] missing hashed asset returns a real not-found instead of the cacheable index fallback" -H "X-Edge-Auth: $correct_edge_secret" "$missing_asset"
	assert_http_status 403 "[$application_mount_path] missing hashed asset still requires the edge header" "$missing_asset"
	assert_redirect_location_is_relative "[$application_mount_path] bare assets directory redirect does not leak the internal scheme or port" -H "X-Edge-Auth: $correct_edge_secret" "$bare_assets_directory"

	served_index_body=$(curl -s -H "X-Edge-Auth: $correct_edge_secret" "$deep_route")
	if [ "$served_index_body" != "$index_marker" ]; then
		echo "FAIL: [$application_mount_path] authenticated single-page fallback did not serve the index document" >&2
		exit 1
	fi
	echo "PASS: [$application_mount_path] authenticated single-page fallback served the index document"

	served_asset_body=$(curl -s -H "X-Edge-Auth: $correct_edge_secret" "$existing_asset")
	if [ "$served_asset_body" != "$hashed_asset_marker" ]; then
		echo "FAIL: [$application_mount_path] authenticated existing hashed asset did not serve the asset document" >&2
		exit 1
	fi
	echo "PASS: [$application_mount_path] authenticated existing hashed asset served the asset document"

	cleanup_current_run
	current_nginx_process_id=""
	current_work_directory=""
}

run_serving_contract_for_mount_path "/reports/" 8094
run_serving_contract_for_mount_path "/" 8095

echo "ALL EDGE NGINX SERVING CONTRACT ASSERTIONS PASSED"
