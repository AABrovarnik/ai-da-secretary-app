import { AssignmentStatus } from "@prisma/client";
import { z } from "zod";
import { assignmentDueDate } from "../review/schema.js";

const optionalNullableText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

export const assignmentUpdateSchema = z.object({
  description: z.string().trim().min(1).max(4_000).optional(),
  assigneeName: optionalNullableText(250),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  timeZone: optionalNullableText(80),
  dueDateRaw: optionalNullableText(250),
  status: z.nativeEnum(AssignmentStatus).optional()
}).refine((value) => Object.keys(value).length > 0, "At least one assignment field is required");

export type AssignmentUpdate = z.infer<typeof assignmentUpdateSchema>;

export function buildAssignmentUpdateData(update: AssignmentUpdate) {
  return {
    ...(update.description !== undefined ? { description: update.description } : {}),
    ...(update.assigneeName !== undefined ? { assigneeName: update.assigneeName } : {}),
    ...(update.dueDate !== undefined ? { dueDate: assignmentDueDate(update.dueDate) } : {}),
    ...(update.dueTime !== undefined ? { dueTime: update.dueTime } : {}),
    ...(update.timeZone !== undefined ? { timeZone: update.timeZone } : {}),
    ...(update.dueDateRaw !== undefined ? { dueDateRaw: update.dueDateRaw } : {}),
    ...(update.status !== undefined ? { status: update.status } : {})
  };
}

export function changedAssignmentFields(
  current: {
    description: string;
    assigneeName: string | null;
    dueDate: Date | null;
    dueTime: string | null;
    timeZone: string | null;
    dueDateRaw: string | null;
    status: AssignmentStatus;
  },
  update: ReturnType<typeof buildAssignmentUpdateData>
) {
  return Object.keys(update).filter((field) => {
    if (field === "dueDate") return current.dueDate?.getTime() !== update.dueDate?.getTime();
    const key = field as keyof typeof update;
    const nextValue = update[key];
    return current[key] !== nextValue;
  });
}
