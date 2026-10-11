import { z } from "zod";

const evidenceSchema = z.object({
  materialId: z.string().min(1),
  quote: z.string().min(1),
  startOffset: z.number().int().nullable().default(null),
  endOffset: z.number().int().nullable().default(null)
});

const decisionSchema = z.object({
  text: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1)
});

const assignmentSchema = z.object({
  description: z.string().min(1),
  assigneeName: z.string().nullable(),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  timeZone: z.string().nullable(),
  dueDateRaw: z.string().nullable(),
  needsReview: z.boolean(),
  evidence: z.array(evidenceSchema).min(1)
});

const textPointSchema = z.object({
  text: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1)
});

export const aiResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  summary: z.string().min(1),
  decisions: z.array(decisionSchema),
  assignments: z.array(assignmentSchema),
  questions: z.array(textPointSchema),
  information: z.array(textPointSchema)
});

export type AiResult = z.infer<typeof aiResultSchema>;