import { describe, expect, it } from "vitest";
import { assignmentStatusLabels, isAssignmentOverdue } from "../src/assignment";

describe("assignment presentation", () => {
  it("marks only active past assignments overdue", () => {
    const base = { dueDate: "2026-10-10T00:00:00.000Z", dueTime: "12:00", timeZone: "Europe/Moscow" };
    const now = new Date("2026-10-11T12:00:00");

    expect(isAssignmentOverdue({ ...base, status: "new" }, now)).toBe(true);
    expect(isAssignmentOverdue({ ...base, status: "in_progress" }, now)).toBe(true);
    expect(isAssignmentOverdue({ ...base, status: "done" }, now)).toBe(false);
    expect(isAssignmentOverdue({ ...base, status: "cancelled" }, now)).toBe(false);
  });

  it("uses the saved time zone when comparing a deadline", () => {
    const assignment = {
      dueDate: "2026-10-11T00:00:00.000Z",
      dueTime: "12:00",
      timeZone: "Europe/Moscow",
      status: "new" as const
    };

    expect(isAssignmentOverdue(assignment, new Date("2026-10-11T08:59:00.000Z"))).toBe(false);
    expect(isAssignmentOverdue(assignment, new Date("2026-10-11T09:01:00.000Z"))).toBe(true);
  });

  it("has a readable label for every status", () => {
    expect(Object.keys(assignmentStatusLabels)).toEqual(["new", "in_progress", "done", "cancelled"]);
  });
});
