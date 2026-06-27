import type { AppAccessModel } from "./app-registry-types";
import { PRIVATE_ENVIRONMENT } from "./app-registry-types";

export function belongsToPrivateEnvironment(
  accessModel: AppAccessModel,
): boolean {
  return accessModel.environment === PRIVATE_ENVIRONMENT;
}
