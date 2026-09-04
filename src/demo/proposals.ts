import {
  proposalErrorResult,
  readResult,
  type CapabilityResult,
} from "./capability-result";
import type { ActionProposal, DemoState } from "./types";

const DEFAULT_EXPIRY_REVISIONS = 3;

export interface CreateActionProposalInput {
  action: string;
  input: unknown;
  warnings: readonly string[];
  effects: readonly string[];
  expiresAfterRevisions?: number;
}

export interface VerifyExecutableProposalInput {
  proposalId: string;
  action: string;
  input: unknown;
}

function canonicalise(value: unknown, ancestors: Set<object>): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return Number.isFinite(value) ? JSON.stringify(value) : "null";
    case "undefined":
      return "undefined";
    case "bigint":
      return `bigint:${value.toString()}`;
    case "object": {
      if (ancestors.has(value)) {
        throw new TypeError("Cannot fingerprint circular input.");
      }

      ancestors.add(value);
      const canonical = Array.isArray(value)
        ? `[${value.map((item) => canonicalise(item, ancestors)).join(",")}]`
        : `{${Object.keys(value)
            .sort()
            .map(
              (key) =>
                `${JSON.stringify(key)}:${canonicalise(
                  (value as Record<string, unknown>)[key],
                  ancestors,
                )}`,
            )
            .join(",")}}`;
      ancestors.delete(value);
      return canonical;
    }
    default:
      throw new TypeError(
        "Only structured proposal input can be fingerprinted.",
      );
  }
}

function fingerprint(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }

  return hash.toString(16).padStart(16, "0");
}

export function canonicalInputFingerprint(input: unknown): string {
  return `fp-v1-${fingerprint(canonicalise(input, new Set()))}`;
}

export function createActionProposal(
  state: DemoState,
  input: CreateActionProposalInput,
): ActionProposal {
  const expiresAfterRevisions =
    input.expiresAfterRevisions ?? DEFAULT_EXPIRY_REVISIONS;
  if (
    !Number.isSafeInteger(expiresAfterRevisions) ||
    expiresAfterRevisions < 1
  ) {
    throw new RangeError("Proposal expiry must be a positive revision count.");
  }

  const inputFingerprint = canonicalInputFingerprint(input.input);
  const idFingerprint = canonicalInputFingerprint({
    action: input.action,
    actorId: state.actorSession.actorId,
    inputFingerprint,
    policyRevision: state.actorSession.policyRevision,
    proposalSequence: state.proposals.length + 1,
    stateRevision: state.revision,
  });

  return {
    id: `proposal-${idFingerprint.slice("fp-v1-".length)}`,
    action: input.action,
    actorId: state.actorSession.actorId,
    policyRevision: state.actorSession.policyRevision,
    inputFingerprint,
    stateRevision: state.revision,
    expiresAt: state.revision + expiresAfterRevisions,
    warnings: [...input.warnings],
    effects: [...input.effects],
    status: "pending",
  };
}

export function findProposal(
  state: DemoState,
  proposalId: string,
): ActionProposal | undefined {
  return state.proposals.find((proposal) => proposal.id === proposalId);
}

export function verifyExecutableProposal(
  state: DemoState,
  input: VerifyExecutableProposalInput,
): CapabilityResult<ActionProposal> {
  const proposal = findProposal(state, input.proposalId);
  if (proposal === undefined) return proposalErrorResult("PROPOSAL_NOT_FOUND");
  if (proposal.status === "executed") {
    return proposalErrorResult("ALREADY_EXECUTED");
  }
  if (proposal.status === "expired" || state.revision >= proposal.expiresAt) {
    return proposalErrorResult("EXPIRED_PROPOSAL");
  }
  if (
    proposal.actorId !== state.actorSession.actorId ||
    proposal.policyRevision !== state.actorSession.policyRevision ||
    proposal.stateRevision !== state.revision
  ) {
    return proposalErrorResult("STALE_PROPOSAL");
  }

  let inputFingerprint: string;
  try {
    inputFingerprint = canonicalInputFingerprint(input.input);
  } catch {
    return proposalErrorResult("PROPOSAL_MISMATCH");
  }
  if (
    proposal.action !== input.action ||
    proposal.inputFingerprint !== inputFingerprint
  ) {
    return proposalErrorResult("PROPOSAL_MISMATCH");
  }
  if (proposal.status === "pending") {
    return proposalErrorResult("CONFIRMATION_REQUIRED");
  }
  if (proposal.status !== "approved") {
    return proposalErrorResult("STALE_PROPOSAL");
  }

  return readResult("Approved proposal is executable.", proposal);
}
