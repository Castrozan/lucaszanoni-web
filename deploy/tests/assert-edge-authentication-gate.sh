#!/bin/sh
set -eu

repository_root=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
work_directory=$(mktemp -d)
nginx_process_id=""

cleanup_test_resources() {
	if [ -n "$nginx_process_id" ]; then
		kill "$nginx_process_id" 2>/dev/null || true
		wait "$nginx_process_id" 2>/dev/null || true
	fi
	rm -rf "$work_directory"
}
trap cleanup_test_resources EXIT

listen_port=8094
application_mount_path="/reports/"
document_root="$work_directory/document-root"
index_marker="edge-authenticated-spa-index-marker"
mkdir -p "$document_root$application_mount_path"
printf '%s' "$index_marker" >"$document_root${application_mount_path}index.html"

correct_edge_secret="edge-authentication-test-secret-0a1b2c3d"

EDGE_SHARED_SECRET_VALUE="$correct_edge_secret" \
	EDGE_SHARED_SECRET_HEADER_NAME="X-Edge-Auth" \
	PORT="$listen_port" \
	NGINX_DOCUMENT_ROOT="$document_root" \
	APP_INDEX_FALLBACK_PATH="${application_mount_path}index.html" \
	EDGE_NGINX_TEMPLATE_PATH="$repository_root/deploy/nginx/edge-authenticated-spa.conf.template" \
	sh "$repository_root/deploy/nginx/render-edge-authenticated-spa-config.sh" >"$work_directory/edge-server.conf"

cat >"$work_directory/nginx.conf" <<NGINX_CONFIGURATION
pid $work_directory/nginx.pid;
error_log $work_directory/error.log warn;
events {}
http {
    access_log off;
    client_body_temp_path $work_directory/client-body-temp;
    proxy_temp_path $work_directory/proxy-temp;
    fastcgi_temp_path $work_directory/fastcgi-temp;
    uwsgi_temp_path $work_directory/uwsgi-temp;
    scgi_temp_path $work_directory/scgi-temp;
    include $work_directory/edge-server.conf;
}
NGINX_CONFIGURATION

nginx -p "$work_directory" -c "$work_directory/nginx.conf" -g 'daemon off;' &
nginx_process_id=$!

attempts=0
until curl -fsS -o /dev/null "http://127.0.0.1:$listen_port/reports/" -H "X-Edge-Auth: $correct_edge_secret" 2>/dev/null; do
	attempts=$((attempts + 1))
	if [ "$attempts" -ge 50 ]; then
		echo "FAIL: nginx did not become ready on port $listen_port" >&2
		exit 1
	fi
	sleep 0.1
done

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

base_url="http://127.0.0.1:$listen_port"

assert_http_status 403 "request without the edge header" "$base_url/reports/"
assert_http_status 403 "request with a wrong edge header value" -H "X-Edge-Auth: wrong-secret" "$base_url/reports/"
assert_http_status 200 "request with the correct edge header" -H "X-Edge-Auth: $correct_edge_secret" "$base_url/reports/"
assert_http_status 200 "deep single-page route falls back to index with the correct edge header" -H "X-Edge-Auth: $correct_edge_secret" "$base_url/reports/some/client/route"
assert_http_status 403 "deep single-page route without the edge header" "$base_url/reports/some/client/route"

served_index_body=$(curl -s -H "X-Edge-Auth: $correct_edge_secret" "$base_url/reports/some/client/route")
if [ "$served_index_body" != "$index_marker" ]; then
	echo "FAIL: authenticated single-page fallback did not serve the index document" >&2
	exit 1
fi
echo "PASS: authenticated single-page fallback served the index document"

echo "ALL EDGE AUTHENTICATION GATE ASSERTIONS PASSED"
