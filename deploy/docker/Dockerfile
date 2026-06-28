ARG NODE_BUILDER_IMAGE=node:22.13-alpine
ARG NGINX_RUNTIME_IMAGE=nginx:1.27-alpine

FROM ${NODE_BUILDER_IMAGE} AS build
ARG APP_PACKAGE_NAME
ARG ATRIUM_BUILD_SHA
ARG VITE_COCKPIT_GITLAB_BASE_URL
ARG VITE_COCKPIT_GITLAB_PROJECT
ARG VITE_COCKPIT_MACHINES
ARG VITE_COCKPIT_REAL_COMPUTE
ARG VITE_COCKPIT_WORKSPACE_MACHINES
ENV ATRIUM_BUILD_SHA=${ATRIUM_BUILD_SHA}
ENV VITE_COCKPIT_GITLAB_BASE_URL=${VITE_COCKPIT_GITLAB_BASE_URL}
ENV VITE_COCKPIT_GITLAB_PROJECT=${VITE_COCKPIT_GITLAB_PROJECT}
ENV VITE_COCKPIT_MACHINES=${VITE_COCKPIT_MACHINES}
ENV VITE_COCKPIT_REAL_COMPUTE=${VITE_COCKPIT_REAL_COMPUTE}
ENV VITE_COCKPIT_WORKSPACE_MACHINES=${VITE_COCKPIT_WORKSPACE_MACHINES}
WORKDIR /workspace
RUN npm install --global corepack@latest && corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "${APP_PACKAGE_NAME}" build

FROM ${NGINX_RUNTIME_IMAGE} AS runtime
ARG APP_DIRECTORY_NAME
ARG APP_MOUNT_PATH
ENV APP_INDEX_FALLBACK_PATH=${APP_MOUNT_PATH}index.html
ENV APP_MOUNT_PATH=${APP_MOUNT_PATH}
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/nginx/edge-authenticated-spa.conf.template /etc/nginx/templates/edge-authenticated-spa.conf.template
COPY deploy/nginx/render-edge-authenticated-spa-config.sh /usr/local/bin/render-edge-authenticated-spa-config.sh
COPY deploy/nginx/launch-edge-authenticated-nginx.sh /usr/local/bin/launch-edge-authenticated-nginx.sh
RUN chmod +x /usr/local/bin/render-edge-authenticated-spa-config.sh /usr/local/bin/launch-edge-authenticated-nginx.sh
COPY --from=build /workspace/apps/${APP_DIRECTORY_NAME}/dist/ /usr/share/nginx/html${APP_MOUNT_PATH}
ENTRYPOINT ["/usr/local/bin/launch-edge-authenticated-nginx.sh"]
