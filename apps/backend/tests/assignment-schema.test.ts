import { AssignmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assignmentUpdateSchema, buildAssignmentUpdateData, changedAssignmentFields } from "../src/services/assignments/schema.js";

describe("assignment update contract", () => {
  it("accepts every stage 1 status and nullable deadline fields", () => {
    for (const status of Object.values(AssignmentStatus)) {
      expect(assignmentUpdateSchema.parse({ status })).toEqual({ status });
    }

    expect(buildAssignmentUpdateData(assignmentUpdateSchema.parse({ dueDate: null, assigneeName: null }))).toEqual({
      dueDate: null,
      assigneeName: null
    });
  });

  it("normalizes date-only updates and rejects empty changes", () => {
    expect(buildAssignmentUpdateData(assignmentUpdateSchema.parse({ dueDate: "2026-10-20" }))).toEqual({
      dueDate: new Date("2026-10-20T00:00:00.000Z")
    });
    expect(assignmentUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("reports only values that actually changed", () => {
    const current = {
      description: "Подготовить отчёт",
      assigneeName: "Ирина",
      dueDate: new Date("2026-10-20T00:00:00.000Z"),
      dueTime: "14:30",
      timeZone: "Europe/Moscow",
      dueDateRaw: "до вторника",
      status: AssignmentStatus.new
    };
    const update = buildAssignmentUpdateData(assignmentUpdateSchema.parse({
      description: "Подготовить отчёт",
      status: AssignmentStatus.in_progress
    }));

    expect(changedAssignmentFields(current, update)).toEqual(["status"]);
  });
});
