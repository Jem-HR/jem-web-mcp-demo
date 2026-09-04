export type CapabilityErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFIRMATION_REQUIRED"
  | "POLICY_DENIED"
  | "PROPOSAL_NOT_FOUND"
  | "PROPOSAL_MISMATCH"
  | "STALE_PROPOSAL"
  | "EXPIRED_PROPOSAL"
  | "ALREADY_EXECUTED"
  | "ALREADY_REQUESTED"
  | "REWARD_NOT_EARNED"
  | "REWARD_ALREADY_ALLOCATED"
  | "INCOMPLETE_DRAFT"
  | "BUDGET_EXCEEDED"
  | "STALE_STATE"
  | "UNSUPPORTED_WEBMCP";

export type ProposalCapabilityErrorCode = Extract<
  CapabilityErrorCode,
  | "CONFIRMATION_REQUIRED"
  | "POLICY_DENIED"
  | "PROPOSAL_NOT_FOUND"
  | "PROPOSAL_MISMATCH"
  | "STALE_PROPOSAL"
  | "EXPIRED_PROPOSAL"
  | "ALREADY_EXECUTED"
>;

export type CapabilityResult<T> =
  | {
      ok: true;
      status: "read" | "applied";
      summary: string;
      data: T;
    }
  | {
      ok: true;
      status: "preview";
      summary: string;
      warnings: string[];
      data: T;
    }
  | {
      ok: false;
      status: "error";
      error: { code: CapabilityErrorCode; message: string; recovery: string };
    };

type SuccessStatus = Exclude<
  Extract<CapabilityResult<unknown>, { ok: true }>["status"],
  "preview"
>;

function success<T>(
  status: SuccessStatus,
  summary: string,
  data: T,
): CapabilityResult<T> {
  return { ok: true, status, summary, data };
}

export function readResult<T>(summary: string, data: T): CapabilityResult<T> {
  return success("read", summary, data);
}

export function previewResult<T>(
  summary: string,
  data: T,
  warnings: readonly string[],
): CapabilityResult<T> {
  return {
    ok: true,
    status: "preview",
    summary,
    warnings: [...warnings],
    data,
  };
}

export function appliedResult<T>(
  summary: string,
  data: T,
): CapabilityResult<T> {
  return success("applied", summary, data);
}

export function errorResult(
  code: CapabilityErrorCode,
  message: string,
  recovery: string,
): CapabilityResult<never> {
  return { ok: false, status: "error", error: { code, message, recovery } };
}

const proposalErrorDetails: Record<
  ProposalCapabilityErrorCode,
  { message: string; recovery: string }
> = {
  CONFIRMATION_REQUIRED: {
    message: "This proposal has not been approved.",
    recovery: "Ask a person to approve or reject it in Jem.",
  },
  POLICY_DENIED: {
    message: "This action is outside the active simulated actor scope.",
    recovery: "Inspect active context or switch simulated actor scope.",
  },
  PROPOSAL_NOT_FOUND: {
    message: "No matching action proposal was found.",
    recovery: "Create a fresh proposal and use its ID.",
  },
  PROPOSAL_MISMATCH: {
    message: "The action or input does not match the approved proposal.",
    recovery:
      "Use the exact proposed action and input, or create a fresh proposal.",
  },
  STALE_PROPOSAL: {
    message: "This proposal is no longer current.",
    recovery: "Create a fresh proposal for the active context.",
  },
  EXPIRED_PROPOSAL: {
    message: "This proposal has expired.",
    recovery: "Create a fresh proposal and ask a person to approve it.",
  },
  ALREADY_EXECUTED: {
    message: "This proposal has already been executed.",
    recovery: "Inspect active context before proposing another action.",
  },
};

export function proposalErrorResult(
  code: ProposalCapabilityErrorCode,
): CapabilityResult<never> {
  const details = proposalErrorDetails[code];
  return errorResult(code, details.message, details.recovery);
}
