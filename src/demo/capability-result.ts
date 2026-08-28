export type CapabilityErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFIRMATION_REQUIRED"
  | "ALREADY_REQUESTED"
  | "REWARD_NOT_EARNED"
  | "REWARD_ALREADY_ALLOCATED"
  | "INCOMPLETE_DRAFT"
  | "BUDGET_EXCEEDED"
  | "STALE_STATE"
  | "UNSUPPORTED_WEBMCP";

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
