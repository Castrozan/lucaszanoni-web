#!/bin/sh
set -eu

: "${EDGE_SHARED_SECRET_VALUE:?EDGE_SHARED_SECRET_VALUE must be set to a non-empty edge shared secret}"
: "${APP_INDEX_FALLBACK_PATH:?APP_INDEX_FALLBACK_PATH must be set to the single-page-application index fallback path}"

edge_authentication_request_header_name="${EDGE_SHARED_SECRET_HEADER_NAME:-X-Edge-Auth}"
edge_authentication_request_header_normalized=$(printf '%s' "$edge_authentication_request_header_name" | tr '[:upper:]-' '[:lower:]_')

EDGE_AUTHENTICATION_REQUEST_HEADER_NGINX_VARIABLE="\$http_${edge_authentication_request_header_normalized}"
NGINX_LISTEN_PORT="${PORT:-8080}"
NGINX_DOCUMENT_ROOT="${NGINX_DOCUMENT_ROOT:-/usr/share/nginx/html}"
EDGE_NGINX_TEMPLATE_PATH="${EDGE_NGINX_TEMPLATE_PATH:-/etc/nginx/templates/edge-authenticated-spa.conf.template}"

export EDGE_AUTHENTICATION_REQUEST_HEADER_NGINX_VARIABLE
export NGINX_LISTEN_PORT
export NGINX_DOCUMENT_ROOT
export EDGE_SHARED_SECRET_VALUE
export APP_INDEX_FALLBACK_PATH

envsubst '${EDGE_AUTHENTICATION_REQUEST_HEADER_NGINX_VARIABLE} ${EDGE_SHARED_SECRET_VALUE} ${NGINX_LISTEN_PORT} ${NGINX_DOCUMENT_ROOT} ${APP_INDEX_FALLBACK_PATH}' <"$EDGE_NGINX_TEMPLATE_PATH"
