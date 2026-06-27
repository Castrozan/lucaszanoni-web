export type AgentActionApprovalDecision = "allow" | "require-approval" | "deny";

export interface AgentActionApprovalPolicy {
  readonly policyName: string;
  readonly policyDescription: string;
  readonly evaluateActionRisk: (
    toolName: string,
    toolArguments: Record<string, unknown>,
  ) => AgentActionApprovalDecision;
}

export interface AgentActionApprovalRequest {
  readonly requestIdentifier: string;
  readonly toolName: string;
  readonly toolArguments: Record<string, unknown>;
  readonly riskAssessmentDescription: string;
  readonly policyDecision: AgentActionApprovalDecision;
  readonly timestamp: number;
}

export interface AgentActionApprovalResponse {
  readonly requestIdentifier: string;
  readonly userDecision: "approved" | "rejected" | "revised";
  readonly revisedArguments?: Record<string, unknown>;
  readonly timestamp: number;
}
