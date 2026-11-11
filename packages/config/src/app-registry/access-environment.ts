import type { AppAccessModel } from "./types.ts";
import { PRIVATE_ENVIRONMENT } from "./types.ts";

export function belongsToPrivateEnvironment(
  accessModel: AppAccessModel,
): boolean {
  return accessModel.environment === PRIVATE_ENVIRONMENT;
}
