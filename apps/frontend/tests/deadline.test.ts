import { describe, expect, it } from "vitest";
import { formatAssignmentDeadline } from "../src/deadline";

describe("formatAssignmentDeadline", () => {
  it("prefers the reviewed normalized deadline over stale raw AI text", () => {
    expect(
      formatAssignmentDeadline({
        dueDate: "2026-10-20T00:00:00.000Z",
        dueTime: "14:30",
        timeZone: "Europe/Moscow",
        dueDateRaw: "до пятницы"
      })
    ).toBe("2026-10-20, 14:30 (Europe/Moscow)");
  });

  it("uses raw text only when a normalized date is absent", () => {
    expect(
      formatAssignmentDeadline({
        dueDate: null,
        dueTime: null,
        timeZone: null,
        dueDateRaw: "после согласования"
      })
    ).toBe("после согласования");
  });
});
