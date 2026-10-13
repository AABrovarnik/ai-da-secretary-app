export type ReviewAction = "approve" | "reject";

export type Evidence = {
  materialId: string;
  quote: string;
  startOffset: number | null;
  endOffset: number | null;
};

export type ReviewedTextPoint = {
  action: ReviewAction;
  text: string;
  evidence: Evidence[];
};

export type ReviewedAssignment = {
  action: ReviewAction;
  description: string;
  assigneeName: string | null;
  dueDate: string | null;
  dueTime: string | null;
  timeZone: string | null;
  dueDateRaw: string | null;
  needsReview: boolean;
  evidence: Evidence[];
};

export type AiResultPayload = {
  schemaVersion: "1.0";
  summary: string;
  decisions: Omit<ReviewedTextPoint, "action">[];
  assignments: Omit<ReviewedAssignment, "action">[];
  questions: Omit<ReviewedTextPoint, "action">[];
  information: Omit<ReviewedTextPoint, "action">[];
  review?: {
    decisions: ReviewAction[];
    assignments: ReviewAction[];
    questions: ReviewAction[];
    information: ReviewAction[];
  };
};

export type ReviewRequest = {
  summary: string;
  decisions: ReviewedTextPoint[];
  assignments: ReviewedAssignment[];
  questions: ReviewedTextPoint[];
  information: ReviewedTextPoint[];
  comment?: string;
};

export type ResultCandidate = {
  id: string;
  summary: string;
  payloadJson: AiResultPayload;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
  history?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    comment: string | null;
    changedAt: string;
  }>;
};

export type ProcessingRun = {
  id: string;
  status: string;
  errorMessage: string | null;
  resultCandidates: ResultCandidate[];
};

export type MeetingListItem = { id: string; title: string };

export type AssignmentStatus = "new" | "in_progress" | "done" | "cancelled";

export type Assignment = {
  id: string;
  description: string;
  assigneeName: string | null;
  dueDate: string | null;
  dueTime: string | null;
  timeZone: string | null;
  dueDateRaw: string | null;
  status: AssignmentStatus;
  sourceQuote: string | null;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    id: string;
    actorUserId: string;
    changesJson: {
      changedFields?: string[];
    };
    changedAt: string;
  }>;
};

export type MeetingDetail = MeetingListItem & {
  materials: Array<{
    id: string;
    kind: string;
    originalName: string | null;
    contentText: string | null;
    createdAt: string;
  }>;
  processingRuns: ProcessingRun[];
  decisions: Array<{
    id: string;
    text: string;
    sourceQuote: string | null;
    createdAt: string;
  }>;
  assignments: Assignment[];
};
