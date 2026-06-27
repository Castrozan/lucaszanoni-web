import type { ReactNode } from "react";

export interface UserInterfaceStateMessage {
  readonly messageIdentifier: string;
  readonly senderRole: "user" | "assistant";
  readonly renderedDisplayContent: ReactNode;
}
