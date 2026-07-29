import { cockpitSignalPathDocument } from "./documents/cockpit-signal-path";
import { dailyOperationDocument } from "./documents/daily-operation";
import { platformSurfacesDocument } from "./documents/platform-surfaces";
import type { SystemDocument } from "./system-document";

export const systemDocuments: readonly SystemDocument[] = [
  cockpitSignalPathDocument,
  dailyOperationDocument,
  platformSurfacesDocument,
];
