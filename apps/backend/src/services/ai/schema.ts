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

const evidenceJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["materialId", "quote", "startOffset", "endOffset"],
  properties: {
    materialId: { type: "string" },
    quote: { type: "string" },
    startOffset: { type: ["integer", "null"] },
    endOffset: { type: ["integer", "null"] }
  }
} as const;

const textPointJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "evidence"],
  properties: {
    text: { type: "string" },
    evidence: { type: "array", items: evidenceJsonSchema }
  }
} as const;

export const aiResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "summary", "decisions", "assignments", "questions", "information"],
  properties: {
    schemaVersion: { type: "string", enum: ["1.0"] },
    summary: { type: "string" },
    decisions: {
      type: "array",
      items: textPointJsonSchema
    },
    assignments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "description",
          "assigneeName",
          "dueDate",
          "dueTime",
          "timeZone",
          "dueDateRaw",
          "needsReview",
          "evidence"
        ],
        properties: {
          description: { type: "string" },
          assigneeName: { type: ["string", "null"] },
          dueDate: { type: ["string", "null"] },
          dueTime: { type: ["string", "null"] },
          timeZone: { type: ["string", "null"] },
          dueDateRaw: { type: ["string", "null"] },
          needsReview: { type: "boolean" },
          evidence: { type: "array", items: evidenceJsonSchema }
        }
      }
    },
    questions: {
      type: "array",
      items: textPointJsonSchema
    },
    information: {
      type: "array",
      items: textPointJsonSchema
    }
  }
} as const;
