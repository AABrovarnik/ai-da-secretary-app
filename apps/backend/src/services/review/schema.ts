import { z } from "zod";

const reviewActionSchema = z.enum(["approve", "reject"]);

const evidenceSchema = z.object({
  materialId: z.string().min(1),
  quote: z.string().min(1),
  startOffset: z.number().int().nullable(),
  endOffset: z.number().int().nullable()
});

const reviewedTextPointSchema = z.object({
  action: reviewActionSchema,
  text: z.string().min(1).max(4_000),
  evidence: z.array(evidenceSchema).min(1)
});

const reviewedAssignmentSchema = z.object({
  action: reviewActionSchema,
  description: z.string().min(1).max(4_000),
  assigneeName: z.string().min(1).max(250).nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  timeZone: z.string().min(1).max(80).nullable(),
  dueDateRaw: z.string().max(250).nullable(),
  needsReview: z.boolean(),
  evidence: z.array(evidenceSchema).min(1)
});

export const candidateReviewRequestSchema = z.object({
  summary: z.string().min(1).max(8_000),
  decisions: z.array(reviewedTextPointSchema),
  assignments: z.array(reviewedAssignmentSchema),
  questions: z.array(reviewedTextPointSchema),
  information: z.array(reviewedTextPointSchema),
  comment: z.string().max(1_000).optional()
});

export type CandidateReviewRequest = z.infer<typeof candidateReviewRequestSchema>;

export function buildReviewedPayload(review: CandidateReviewRequest) {
  const withoutAction = <T extends { action: "approve" | "reject" }>(item: T) => {
    const value: Omit<T, "action"> & { action?: T["action"] } = { ...item };
    delete value.action;
    return value;
  };

  return {
    schemaVersion: "1.0",
    summary: review.summary,
    decisions: review.decisions.map(withoutAction),
    assignments: review.assignments.map(withoutAction),
    questions: review.questions.map(withoutAction),
    information: review.information.map(withoutAction),
    review: {
      decisions: review.decisions.map((item) => item.action),
      assignments: review.assignments.map((item) => item.action),
      questions: review.questions.map((item) => item.action),
      information: review.information.map((item) => item.action)
    }
  };
}

export function assignmentDueDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
