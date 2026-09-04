export type AppMode = "employee" | "employer";
export type ActorId = "employee" | "employer";
export type StateRevision = number;
export type AgentAuditEventType =
  | "actor_changed"
  | "policy_changed"
  | "business_mutation"
  | "proposal_created"
  | "proposal_approved"
  | "proposal_rejected"
  | "proposal_executed"
  | "policy_denied";
export type AgentAuditOutcome = "applied" | "denied" | "recorded";
export interface PolicyDenial {
  code: "POLICY_DENIED";
  message: string;
  nextStep: string;
}
export type PolicyDecision =
  { permitted: true } | { permitted: false; error: PolicyDenial };
export type EmployeeTab = "overview" | "shifts" | "learn" | "rewards";
export type EmployerTab = "dashboard" | "opportunity" | "shifts" | "fairness";
export type OpportunityCategory = "all" | "shift" | "learning" | "reward";
export type ActionSource = "ui" | "webmcp";
export type ActionProposalStatus =
  "pending" | "approved" | "rejected" | "executed" | "expired" | "invalidated";

export interface ActionProposalExecution {
  actorId: ActorId;
  policyRevision: StateRevision;
  stateRevision: StateRevision;
  executedAt: string;
}

export interface ActionProposal {
  id: string;
  action: string;
  actorId: ActorId;
  policyRevision: StateRevision;
  inputFingerprint: string;
  stateRevision: StateRevision;
  expiresAt: StateRevision;
  warnings: string[];
  effects: string[];
  status: ActionProposalStatus;
  execution?: ActionProposalExecution;
}

/** Simulated client-only actor data; production identity belongs on a server. */
export interface ActorSession {
  actorId: ActorId;
  displayName: string;
  policyRevision: StateRevision;
}

export interface CapabilityPolicy {
  actorId: ActorId;
  actorLabel: string;
  revision: StateRevision;
  viewMode: AppMode;
  permittedTools: readonly string[];
  protectedDataClasses: readonly string[];
  consequentialTools: readonly string[];
}

export interface AgentAuditEvent {
  id: string;
  type: AgentAuditEventType;
  actorId: ActorId;
  source: ActionSource | "system";
  action: string;
  proposalId?: string;
  outcome: AgentAuditOutcome;
  policyRevision: StateRevision;
  stateRevision: StateRevision;
  summary: string;
  timestamp: string;
}
export type ExpenseKey =
  | "housing"
  | "transport"
  | "food"
  | "dependants"
  | "debt"
  | "airtime"
  | "other";
export type ExpenseMap = Record<ExpenseKey, number>;
export type ShiftStatus = "confirmed" | "available" | "requested";
export type RewardStatus = "in_progress" | "earned" | "allocated";
export type RewardDestination = "savings" | "voucher";
export type ProgrammeStatus = "active" | "draft";
export type ProgrammeReadiness = "ready" | "review_required";
export type FairnessSeverity = "medium" | "low";
export type FairnessReviewState = "open" | "reviewing";

export interface Goal {
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  monthlyContribution: number;
  isPrivate: boolean;
}

export interface EmployeeProfile {
  firstName: string;
  fullName: string;
  employerName: string;
  role: string;
  hourlyRate: number;
  payFrequency: "monthly";
  nextPayday: string;
  daysToPayday: number;
  expectedEarnings: number;
  hoursWorked: number;
  startDate: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  site: string;
  role: string;
  estimatedEarnings: number;
  estimateKind: "estimated_before_deductions" | "confirmed_before_deductions";
  deadline: string | null;
  status: ShiftStatus;
  transport: string;
  eligibility: string;
  applications: number;
  spots: number;
}

export interface LearningOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  rewardAmount: number;
  rewardType: "cash" | "voucher";
  completed: boolean;
  expiresOn: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  amount: number;
  rewardType: "cash" | "voucher";
  qualifying: number | null;
  required: number | null;
  status: RewardStatus;
  deadline: string | null;
  allocatedTo: RewardDestination | null;
}

export interface EmployerProfile {
  employerName: string;
  contactName: string;
  role: string;
  totalEmployees: number;
  activeEmployees: number;
  goalEngagementPercent: number;
  dataConfidencePercent: number;
}

export interface Programme {
  id: string;
  name: string;
  type: "attendance" | "learning" | "extra_shifts";
  budget: number;
  spent: number;
  enrolled: number;
  participating: number;
  status: ProgrammeStatus;
  readiness: ProgrammeReadiness;
  expiresOn: string | null;
}

export interface FairnessException {
  id: string;
  employeeLabel: string;
  issue: string;
  programmeName: string;
  severity: FairnessSeverity;
  recordFreshnessHours: number;
  reviewState: FairnessReviewState;
}

export interface OpportunityDraft {
  id: "draft-opportunity";
  name: string;
  type: "attendance" | "learning" | "extra_shifts";
  outcome: string;
  eligibleSegment: string;
  qualificationRule: string;
  startDate: string;
  endDate: string;
  rewardType: "cash" | "voucher" | "credits";
  rewardAmount: number;
  totalBudget: number;
  maxPerEmployee: number;
  exceptionPolicy: string;
  status: "draft";
}

export interface OpportunityValidation {
  draftId: "draft-opportunity";
  readiness: "ready" | "review_required" | "blocked";
  rulesClear: boolean;
  dataAvailable: boolean;
  dataFresh: boolean;
  fairnessPassed: boolean;
  budgetWithinLimit: boolean;
  eligibleEmployeeCount: number;
  expectedParticipationPercent: number;
  estimatedCost: number;
  maximumExposure: number;
  unresolvedExceptionCount: number;
  issues: string[];
}

export interface ActivityNotice {
  id: number;
  source: ActionSource;
  message: string;
}

export interface DemoState {
  mode: AppMode;
  actorSession: ActorSession;
  revision: StateRevision;
  auditEvents: AgentAuditEvent[];
  proposals: ActionProposal[];
  savingsIntent: null;
  onboarding: { completed: boolean; step: 1 | 2 | 3 | 4 };
  employee: {
    activeTab: EmployeeTab;
    profile: EmployeeProfile;
    goal: Goal;
    expenses: ExpenseMap;
    shifts: Shift[];
    learning: LearningOpportunity[];
    rewards: Reward[];
  };
  employer: {
    activeTab: EmployerTab;
    profile: EmployerProfile;
    programmes: Programme[];
    fairnessExceptions: FairnessException[];
    fairnessRules: string[];
    activeDraft: OpportunityDraft | null;
    validation: OpportunityValidation | null;
  };
  activity: ActivityNotice | null;
}

export interface DemoStore {
  getState(): DemoState;
  dispatch(action: DemoAction): void;
  subscribe(listener: () => void): () => void;
}

export type DemoAction =
  | { type: "demo/reset" }
  | { type: "session/set-actor"; actorId: ActorId }
  | { type: "navigation/set-mode"; mode: AppMode }
  | { type: "navigation/set-employee-tab"; tab: EmployeeTab }
  | { type: "navigation/set-employer-tab"; tab: EmployerTab }
  | { type: "onboarding/set-step"; step: 1 | 2 | 3 | 4 }
  | { type: "onboarding/complete" }
  | { type: "employee/replace-goal"; goal: Goal; source: ActionSource }
  | {
      type: "employee/replace-expenses";
      expenses: ExpenseMap;
      source: ActionSource;
    }
  | {
      type: "employee/complete-onboarding";
      goal: Goal;
      expenses: ExpenseMap;
      source: ActionSource;
    }
  | { type: "employee/request-shift"; shiftId: string; source: ActionSource }
  | {
      type: "employee/allocate-reward";
      rewardId: string;
      destination: RewardDestination;
      source: ActionSource;
    }
  | {
      type: "employer/save-draft";
      draft: OpportunityDraft;
      source: ActionSource;
    }
  | {
      type: "employer/set-validation";
      validation: OpportunityValidation;
      source: ActionSource;
    }
  | {
      type: "audit/record";
      eventType: AgentAuditEventType;
    }
  | {
      type: "proposal/create";
      proposal: ActionProposal;
      source: ActionSource;
    }
  | { type: "proposal/approve"; proposalId: string }
  | { type: "proposal/reject"; proposalId: string }
  | {
      type: "proposal/execute";
      proposalId: string;
      action: string;
      input: unknown;
    }
  | { type: "activity/dismiss" };
