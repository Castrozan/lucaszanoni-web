import { findMicroFrontendRoute } from "./route-registry";

export const SITE_DOMAIN = "lucaszanoni.com.br";

export const SHELL_MOUNT_PATH = findMicroFrontendRoute("shell").mountPath;
export const USAGE_DASHBOARD_MOUNT_PATH =
  findMicroFrontendRoute("usage-dashboard").mountPath;
export const REPORTS_MOUNT_PATH = findMicroFrontendRoute("reports").mountPath;
export const COCKPIT_MOUNT_PATH = findMicroFrontendRoute("cockpit").mountPath;
