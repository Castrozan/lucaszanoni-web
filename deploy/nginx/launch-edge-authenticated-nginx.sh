#!/bin/sh
set -eu

EDGE_NGINX_TEMPLATE_PATH="${EDGE_NGINX_TEMPLATE_PATH:-/etc/nginx/templates/edge-authenticated-spa.conf.template}"
export EDGE_NGINX_TEMPLATE_PATH

/usr/local/bin/render-edge-authenticated-spa-config.sh >/etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
