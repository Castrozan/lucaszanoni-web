ARG NODE_BUILDER_IMAGE=node:22.13-alpine
ARG NODE_RUNTIME_IMAGE=node:22.13-alpine

FROM ${NODE_BUILDER_IMAGE} AS build
ARG APP_PACKAGE_NAME
ARG APP_DIRECTORY_NAME
WORKDIR /workspace
RUN npm install --global corepack@latest && corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "${APP_PACKAGE_NAME}" build
RUN pnpm --filter "${APP_PACKAGE_NAME}" --prod deploy /standalone-service

FROM ${NODE_RUNTIME_IMAGE} AS runtime
ARG APP_MOUNT_PATH
ARG APP_SERVER_ENTRYPOINT_PATH=dist/server/entry.mjs
ENV NODE_ENV=production
ENV APP_MOUNT_PATH=${APP_MOUNT_PATH}
ENV APP_SERVER_ENTRYPOINT_PATH=${APP_SERVER_ENTRYPOINT_PATH}
WORKDIR /standalone-service
COPY --from=build /standalone-service ./
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec node \"${APP_SERVER_ENTRYPOINT_PATH}\""]
